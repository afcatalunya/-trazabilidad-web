import { Header } from '@/components/layout/Header'
import { BotonesAlertas } from '@/components/informes/BotonesAlertas'
import { db } from '@/lib/db'
import { pedidos } from '@/lib/schema'

export const dynamic = 'force-dynamic'

// ── Helpers ────────────────────────────────────────────────────────────────

function daysBetween(d1: string | null, d2: string | null): number | null {
  if (!d1 || !d2) return null
  try {
    const diff = new Date(d2).getTime() - new Date(d1).getTime()
    const days = Math.round(diff / (1000 * 60 * 60 * 24))
    return days >= 0 ? days : null
  } catch { return null }
}

function avg(nums: (number | null)[]): number | null {
  const valid = nums.filter((n): n is number => n !== null && n >= 0)
  if (valid.length === 0) return null
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
}

function median(nums: (number | null)[]): number | null {
  const valid = nums.filter((n): n is number => n !== null && n >= 0).sort((a, b) => a - b)
  if (valid.length === 0) return null
  const mid = Math.floor(valid.length / 2)
  return valid.length % 2 ? valid[mid] : Math.round((valid[mid - 1] + valid[mid]) / 2)
}

function leadColor(days: number | null): string {
  if (days === null) return '#9ca3af'
  if (days <= 10) return '#2d9e4e'
  if (days <= 20) return '#eab308'
  if (days <= 30) return '#f97316'
  return '#ef4444'
}

function etapaColor(days: number | null): string {
  if (days === null) return '#d1d5db'
  if (days <= 3) return '#2d9e4e'
  if (days <= 7) return '#eab308'
  if (days <= 14) return '#f97316'
  return '#ef4444'
}

// ── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color = '#2d9e4e' }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-3xl font-bold mt-1" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
      <span className="w-1 h-5 rounded-full inline-block flex-shrink-0" style={{ background: '#2d9e4e' }} />
      {children}
    </h2>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-6 ${className}`}>
      {children}
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function InformesPage() {
  let allPedidos: any[] = []
  try {
    allPedidos = await db.select().from(pedidos)
  } catch (err) {
    console.error('Error cargando pedidos para informes:', err)
  }

  const total = allPedidos.length
  const entregados = allPedidos.filter(p => p.fechaEntregaCliente).length
  const conIncidencia = allPedidos.filter(p => p.incidenciaMaterial === 'SÍ' || p.incidenciaMaterial === 'SI').length
  const urgentesCount = allPedidos.filter(p => p.urgente === 'URGENTE').length
  const enCurso = allPedidos.filter(p => !p.fechaEntregaCliente && p.estadoPedido !== 'ANULADO')

  // ── Lead times globales ──────────────────────────────────────────────────
  const allLeadTimes = allPedidos.map(p => daysBetween(p.fechaPedido, p.fechaEntregaCliente))
  const avgLead = avg(allLeadTimes)
  const medLead = median(allLeadTimes)

  // ── Etapas del proceso ───────────────────────────────────────────────────
  const etapas = [
    { label: 'Aprovisionamiento', sub: 'Pedido → Salida material',  fn: (p: any) => daysBetween(p.fechaPedido, p.fechaSalida) },
    { label: 'Entrada producción', sub: 'Salida → Planning',         fn: (p: any) => daysBetween(p.fechaSalida, p.fechaPlanning) },
    { label: 'Producción',         sub: 'Planning → Terminado',      fn: (p: any) => daysBetween(p.fechaPlanning, p.fechaTerminado) },
    { label: 'Espera de carga',    sub: 'Terminado → Camión',        fn: (p: any) => daysBetween(p.fechaTerminado, p.fechaCargaCamion) },
    { label: 'Tránsito',           sub: 'Camión → Tarragona',        fn: (p: any) => daysBetween(p.fechaCargaCamion, p.fechaEnTarragona) },
    { label: 'Almacén→Cliente',    sub: 'Tarragona → Entrega',       fn: (p: any) => daysBetween(p.fechaEnTarragona, p.fechaEntregaCliente) },
  ]

  const etapaStats = etapas.map(e => {
    const vals = allPedidos.map(e.fn)
    return { label: e.label, sub: e.sub, avg: avg(vals), median: median(vals), count: vals.filter(v => v !== null).length }
  })

  const maxEtapa = Math.max(...etapaStats.map(e => e.avg ?? 0), 1)
  const cuello = etapaStats.reduce((mx, e) => (e.avg ?? 0) > (mx.avg ?? 0) ? e : mx, etapaStats[0])

  // ── Por proveedor ────────────────────────────────────────────────────────
  const provMap: Record<string, { lt: (number|null)[]; aprov: (number|null)[]; prod: (number|null)[]; inc: number; total: number; ent: number }> = {}
  for (const p of allPedidos) {
    const k = p.proveedor || '(Sin proveedor)'
    if (!provMap[k]) provMap[k] = { lt: [], aprov: [], prod: [], inc: 0, total: 0, ent: 0 }
    provMap[k].lt.push(daysBetween(p.fechaPedido, p.fechaEntregaCliente))
    provMap[k].aprov.push(daysBetween(p.fechaPedido, p.fechaSalida))
    provMap[k].prod.push(daysBetween(p.fechaPlanning, p.fechaTerminado))
    if (p.incidenciaMaterial === 'SÍ' || p.incidenciaMaterial === 'SI') provMap[k].inc++
    provMap[k].total++
    if (p.fechaEntregaCliente) provMap[k].ent++
  }

  const provStats = Object.entries(provMap).map(([prv, d]) => ({
    proveedor: prv,
    total: d.total,
    entregados: d.ent,
    avgLead: avg(d.lt),
    avgAprov: avg(d.aprov),
    avgProd: avg(d.prod),
    pctInc: Math.round((d.inc / d.total) * 100),
  })).sort((a, b) => b.total - a.total)

  // ── Por categoría ────────────────────────────────────────────────────────
  const catMap: Record<string, { lt: (number|null)[]; count: number }> = {}
  for (const p of allPedidos) {
    const k = p.categoria || '(Sin categoría)'
    if (!catMap[k]) catMap[k] = { lt: [], count: 0 }
    catMap[k].lt.push(daysBetween(p.fechaPedido, p.fechaEntregaCliente))
    catMap[k].count++
  }
  const catStats = Object.entries(catMap)
    .map(([label, d]) => ({ label, value: avg(d.lt), count: d.count }))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
  const maxCat = Math.max(...catStats.map(c => c.value ?? 0), 1)

  // ── Urgente vs Normal ────────────────────────────────────────────────────
  const avgUrgente = avg(allPedidos.filter(p => p.urgente === 'URGENTE').map(p => daysBetween(p.fechaPedido, p.fechaEntregaCliente)))
  const avgNormal  = avg(allPedidos.filter(p => p.urgente !== 'URGENTE').map(p => daysBetween(p.fechaPedido, p.fechaEntregaCliente)))

  // ── Pedidos en riesgo ────────────────────────────────────────────────────
  const hoy = new Date()
  const enRiesgo = enCurso.filter(p => {
    const ultima = [p.fechaSalida, p.fechaPlanning, p.fechaTerminado, p.fechaCargaCamion, p.fechaEnTarragona, p.fechaPedido]
      .filter(Boolean).sort().reverse()[0]
    if (!ultima) return false
    return Math.round((hoy.getTime() - new Date(ultima).getTime()) / (1000 * 60 * 60 * 24)) > 15
  }).sort((a, b) => {
    const ul = (p: any) => [p.fechaSalida, p.fechaPlanning, p.fechaTerminado, p.fechaCargaCamion, p.fechaEnTarragona, p.fechaPedido]
      .filter(Boolean).sort().reverse()[0] || ''
    return ul(a) < ul(b) ? -1 : 1
  }).slice(0, 10)

  // ────────────────────────────────────────────────────────────────────────

  return (
    <>
      <Header title="Informes & Analítica" />
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">

          {/* ── KPIs globales ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="Total pedidos"   value={total}           sub="en base de datos"                         color="#1a5c35" />
            <KpiCard label="Entregados"      value={entregados}      sub={`${Math.round((entregados/total)*100)}% del total`} color="#2d9e4e" />
            <KpiCard label="En curso"        value={enCurso.length}  sub="pendientes de entrega"                    color="#3b82f6" />
            <KpiCard label="Lead time medio" value={avgLead !== null ? `${avgLead}d` : '—'} sub={medLead !== null ? `mediana ${medLead}d` : 'sin datos'} color="#1a5c35" />
            <KpiCard label="Con incidencia"  value={conIncidencia}   sub={`${Math.round((conIncidencia/total)*100)}% del total`} color="#f97316" />
            <KpiCard label="Urgentes"        value={urgentesCount}   sub={`${Math.round((urgentesCount/total)*100)}% del total`} color="#ef4444" />
          </div>

          {/* ── Etapas + Cuello + Urgentes ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <Card>
              <SectionTitle>Tiempo medio por etapa del proceso</SectionTitle>
              <div className="space-y-4">
                {etapaStats.map(e => {
                  const pct = e.avg !== null ? Math.min(100, (e.avg / maxEtapa) * 100) : 0
                  const col = etapaColor(e.avg)
                  const isCuello = e.label === cuello?.label
                  return (
                    <div key={e.label}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          {isCuello && <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: '#fee2e2', color: '#991b1b' }}>↑ lento</span>}
                          <span className="text-sm font-semibold text-gray-800">{e.label}</span>
                          <span className="text-xs text-gray-400 hidden sm:inline">{e.sub}</span>
                        </div>
                        <span className="text-sm font-bold ml-4 shrink-0" style={{ color: col }}>
                          {e.avg !== null ? `${e.avg}d` : '—'}
                          {e.median !== null && <span className="text-xs font-normal text-gray-400 ml-1">med:{e.median}d</span>}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full" style={{ background: '#f0faf4' }}>
                        <div className="h-2.5 rounded-full" style={{ width: `${pct}%`, background: col }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{e.count} pedidos con ambas fechas</p>
                    </div>
                  )
                })}
              </div>
            </Card>

            <div className="space-y-4">
              {/* Cuello de botella */}
              <Card>
                <SectionTitle>Cuello de botella identificado</SectionTitle>
                {cuello && cuello.avg !== null ? (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xl" style={{ background: '#ef4444' }}>
                      {cuello.avg}d
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{cuello.label}</p>
                      <p className="text-sm text-gray-500">{cuello.sub}</p>
                      <p className="text-xs text-gray-400 mt-1">Etapa más lenta en media — prioridad de mejora</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Sin datos suficientes</p>
                )}
              </Card>

              {/* Urgente vs Normal */}
              <Card>
                <SectionTitle>Urgente vs Normal — Lead time</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-xl" style={{ background: '#fef2f2' }}>
                    <p className="text-3xl font-bold" style={{ color: '#ef4444' }}>{avgUrgente !== null ? `${avgUrgente}d` : '—'}</p>
                    <p className="text-xs text-gray-500 mt-1">🚨 Urgentes</p>
                  </div>
                  <div className="text-center p-4 rounded-xl" style={{ background: '#f0faf4' }}>
                    <p className="text-3xl font-bold" style={{ color: '#2d9e4e' }}>{avgNormal !== null ? `${avgNormal}d` : '—'}</p>
                    <p className="text-xs text-gray-500 mt-1">Normales</p>
                  </div>
                </div>
                {avgUrgente !== null && avgNormal !== null && (
                  <p className="text-xs text-center text-gray-500 mt-3">
                    Los urgentes se entregan{' '}
                    <strong style={{ color: avgUrgente < avgNormal ? '#2d9e4e' : '#ef4444' }}>
                      {Math.abs(avgNormal - avgUrgente)}d {avgUrgente < avgNormal ? 'antes ✓' : 'después ⚠'}
                    </strong>
                    {' '}que los normales
                  </p>
                )}
              </Card>
            </div>
          </div>

          {/* ── Por proveedor ── */}
          <Card>
            <SectionTitle>Lead time y rendimiento por proveedor</SectionTitle>
            <div className="overflow-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr style={{ borderBottom: '2px solid #f0faf4' }}>
                    {['Proveedor', 'Pedidos', 'Entregados', 'Lead time medio', 'Aprovisionamiento', 'Producción', '% Incidencias'].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#1a5c35' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {provStats.map((p, i) => (
                    <tr key={p.proveedor} style={{ background: i % 2 === 1 ? '#fafcfa' : 'white', borderBottom: '1px solid #f3f4f6' }}>
                      <td className="py-3 px-3 font-semibold text-gray-800">{p.proveedor}</td>
                      <td className="py-3 px-3 text-gray-600 font-medium">{p.total}</td>
                      <td className="py-3 px-3">
                        <span className="text-gray-700">{p.entregados}</span>
                        <span className="text-gray-400 text-xs ml-1">({p.total > 0 ? Math.round((p.entregados/p.total)*100) : 0}%)</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-lg font-bold" style={{ color: leadColor(p.avgLead) }}>
                          {p.avgLead !== null ? `${p.avgLead}d` : '—'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-600">{p.avgAprov !== null ? `${p.avgAprov}d` : '—'}</td>
                      <td className="py-3 px-3 text-gray-600">{p.avgProd !== null ? `${p.avgProd}d` : '—'}</td>
                      <td className="py-3 px-3">
                        {p.pctInc > 0 ? (
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{
                            background: p.pctInc > 30 ? '#fee2e2' : p.pctInc > 10 ? '#fff3e0' : '#f0faf4',
                            color:      p.pctInc > 30 ? '#991b1b' : p.pctInc > 10 ? '#92400e' : '#1a5c35',
                          }}>{p.pctInc}%</span>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ── Categoría + Pedidos en riesgo ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <Card>
              <SectionTitle>Lead time medio por categoría</SectionTitle>
              <div className="space-y-3">
                {catStats.map(c => {
                  const pct = c.value !== null ? Math.min(100, (c.value / maxCat) * 100) : 0
                  const col = leadColor(c.value)
                  return (
                    <div key={c.label}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {c.label}
                          <span className="text-gray-400 font-normal text-xs ml-1">({c.count})</span>
                        </span>
                        <span className="text-sm font-bold" style={{ color: col }}>
                          {c.value !== null ? `${c.value}d` : '—'}
                        </span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: '#f0faf4' }}>
                        <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: col }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card>
              <SectionTitle>Pedidos en riesgo — más de 15 días sin avanzar</SectionTitle>
              {enRiesgo.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-3xl">✅</p>
                  <p className="text-gray-400 text-sm mt-2">Ningún pedido lleva más de 15 días parado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {enRiesgo.map(p => {
                    const ultima = [p.fechaSalida, p.fechaPlanning, p.fechaTerminado, p.fechaCargaCamion, p.fechaEnTarragona, p.fechaPedido]
                      .filter(Boolean).sort().reverse()[0]
                    const dias = ultima ? Math.round((hoy.getTime() - new Date(ultima).getTime()) / (1000 * 60 * 60 * 24)) : null
                    return (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: (dias ?? 0) > 30 ? '#fef2f2' : '#fffbeb' }}>
                        <div>
                          <p className="text-sm font-bold" style={{ color: '#1a5c35' }}>{p.numeroPedido}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{p.cliente || '—'} · {p.estadoPedido}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold" style={{ color: (dias ?? 0) > 30 ? '#ef4444' : '#f97316' }}>
                            {dias !== null ? `${dias}d parado` : '—'}
                          </p>
                          <p className="text-xs text-gray-400">{p.proveedor || '—'}</p>
                        </div>
                      </div>
                    )
                  })}
                  {enRiesgo.length >= 10 && (
                    <p className="text-xs text-gray-400 text-center">Mostrando los 10 más críticos</p>
                  )}
                </div>
              )}
            </Card>

          </div>

          {/* ── Alertas manuales por email ── */}
          <BotonesAlertas />

          <p className="text-xs text-gray-400 text-center pb-2">
            Tiempos calculados solo sobre pedidos con ambas fechas de cada etapa registradas.
            Lead time total: Fecha Pedido → Entrega Cliente.
          </p>

        </div>
      </div>
    </>
  )
}
