import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { PedidoRow } from '@/components/pedidos/PedidoRow'
import { FiltrosPedidos } from '@/components/pedidos/FiltrosPedidos'
import { EstadoBadge } from '@/components/pedidos/EstadoBadge'
import { db } from '@/lib/db'
import { pedidos } from '@/lib/schema'
import { like, and, eq, or, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    search?: string
    estado?: string
    almacen?: string
    categoria?: string
    urgente?: string
    page?: string
  }>
}

// KPI card component
function KpiCard({ label, value, color, active, href }: {
  label: string
  value: number
  color: string
  active?: boolean
  href: string
}) {
  return (
    <Link href={href}>
      <div
        className={`rounded-xl px-4 py-3 cursor-pointer transition-all duration-150 border ${
          active
            ? 'shadow-md scale-[1.02]'
            : 'hover:shadow-sm hover:scale-[1.01]'
        }`}
        style={{
          background: active ? color : '#fff',
          borderColor: active ? color : '#e5e7eb',
        }}
      >
        <p className={`text-2xl font-bold leading-none ${active ? 'text-white' : 'text-gray-800'}`}>
          {value}
        </p>
        <p className={`text-xs mt-1 font-medium ${active ? 'text-white/80' : 'text-gray-500'}`}>
          {label}
        </p>
      </div>
    </Link>
  )
}

export default async function PedidosPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search    = params.search    || ''
  const estado    = params.estado    || ''
  const almacen   = params.almacen   || ''
  const categoria = params.categoria || ''
  const urgente   = params.urgente   || ''
  const page      = parseInt(params.page || '1')
  const limit     = 50
  const offset    = (page - 1) * limit

  const conditions: any[] = []
  if (search) {
    conditions.push(
      or(
        like(pedidos.numeroPedido, `%${search}%`),
        like(pedidos.cliente, `%${search}%`),
        like(pedidos.numeroCliente, `%${search}%`)
      )
    )
  }
  if (estado)    conditions.push(eq(pedidos.estadoPedido, estado))
  if (almacen)   conditions.push(eq(pedidos.almacen, almacen))
  if (categoria) conditions.push(eq(pedidos.categoria, categoria))
  if (urgente === 'true') conditions.push(eq(pedidos.urgente, 'URGENTE'))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  let result: any[] = []
  let total = 0

  // Stats for KPI cards (always unfiltered)
  let stats: Record<string, number> = {}

  try {
    result = await db
      .select()
      .from(pedidos)
      .where(where)
      .orderBy(pedidos.createdAt)
      .limit(limit)
      .offset(offset)

    const countResult = await db.select({ id: pedidos.id }).from(pedidos).where(where)
    total = countResult.length

    // Get counts per estado (no filters)
    const allPedidos = await db.select({ estadoPedido: pedidos.estadoPedido }).from(pedidos)
    for (const p of allPedidos) {
      const e = p.estadoPedido || 'SIN PEDIDO DE COMPRA'
      stats[e] = (stats[e] || 0) + 1
    }
  } catch (err) {
    console.error('Error cargando pedidos:', err)
  }

  const totalPages = Math.ceil(total / limit)
  const totalAll = Object.values(stats).reduce((a, b) => a + b, 0)

  // Build base URL preserving other params
  const baseParams = [
    search    ? `search=${search}` : '',
    almacen   ? `almacen=${almacen}` : '',
    categoria ? `categoria=${categoria}` : '',
    urgente   ? `urgente=${urgente}` : '',
  ].filter(Boolean).join('&')

  const estadoUrl = (e: string) => `/pedidos?estado=${encodeURIComponent(e)}${baseParams ? `&${baseParams}` : ''}`
  const clearUrl = `/pedidos${baseParams ? `?${baseParams}` : ''}`

  const KPI_ITEMS = [
    { label: 'Todos',       value: totalAll,                                      color: '#2d9e4e', key: '' },
    { label: 'Sin pedido',  value: stats['SIN PEDIDO DE COMPRA'] || 0,            color: '#ef4444', key: 'SIN PEDIDO DE COMPRA' },
    { label: 'En proceso',  value: stats['EN PROCESO'] || 0,                      color: '#f97316', key: 'EN PROCESO' },
    { label: 'Planning',    value: (stats['PLANNING'] || 0) + (stats['PARA CARGAR MURCIA'] || 0), color: '#eab308', key: 'PLANNING' },
    { label: 'En camión',   value: stats['EN CAMION'] || 0,                       color: '#3b82f6', key: 'EN CAMION' },
    { label: 'En almacén',  value: stats['EN ALMACÉN'] || 0,                      color: '#22c55e', key: 'EN ALMACÉN' },
    { label: 'Entregados',  value: stats['ENTREGADO'] || 0,                       color: '#2d9e4e', key: 'ENTREGADO' },
  ]

  return (
    <>
      <Header title="Pedidos" />

      {/* KPI Cards */}
      <div className="px-6 pt-4 pb-3 flex-shrink-0">
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {KPI_ITEMS.map(item => (
            <KpiCard
              key={item.key}
              label={item.label}
              value={item.value}
              color={item.color}
              active={estado === item.key || (item.key === '' && !estado)}
              href={item.key ? estadoUrl(item.key) : clearUrl}
            />
          ))}
        </div>
      </div>

      {/* Toolbar: count + new button */}
      <div className="px-6 pb-2 flex justify-between items-center flex-shrink-0">
        <p className="text-sm text-gray-500 font-medium">
          {total === totalAll ? (
            <><span className="text-gray-800 font-semibold">{total}</span> pedidos en total</>
          ) : (
            <><span className="text-gray-800 font-semibold">{total}</span> de {totalAll} pedidos</>
          )}
        </p>
        <Link href="/pedidos/nuevo">
          <Button variant="primary" size="sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Pedido
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="px-6 pb-2 flex-shrink-0">
        <FiltrosPedidos />
      </div>

      {/* Table — scrollable */}
      <div className="flex-1 min-h-0 px-6 pb-2 overflow-hidden">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full overflow-auto">
          <table className="min-w-full">
            <thead className="sticky top-0 z-10">
              <tr style={{ background: '#f0faf4', borderBottom: '2px solid #b3e4c8' }}>
                {[
                  'Número','Tipo','F.Pedido','Cliente','Nº Cli','Comercial',
                  'Categoría','Referencia','Acabado','Color','Proveedor','Doc.Salida',
                  'F.Salida','F.Planning','F.Terminado','F.Camión','F.Tarragona','F.Entrega',
                  'Estado','Incidencia','Almacén','Urgente'
                ].map(h => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                    style={{ color: '#1a5c35', background: '#f0faf4' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.map((pedido, idx) => (
                <PedidoRow
                  key={pedido.id}
                  pedido={pedido}
                  cliente={pedido.cliente || '-'}
                  stripe={idx % 2 === 1}
                />
              ))}
              {result.length === 0 && (
                <tr>
                  <td colSpan={22} className="text-center py-16 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-sm">No hay pedidos que mostrar</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="px-6 py-3 flex justify-between items-center flex-shrink-0 border-t border-gray-100 bg-white">
        <span className="text-xs text-gray-400">Página {page} de {totalPages || 1}</span>
        <div className="flex gap-2">
          {page > 1 && (
            <Link href={`/pedidos?page=${page - 1}${search ? `&search=${search}` : ''}${estado ? `&estado=${estado}` : ''}`}>
              <Button variant="secondary" size="sm">← Anterior</Button>
            </Link>
          )}
          {page < totalPages && (
            <Link href={`/pedidos?page=${page + 1}${search ? `&search=${search}` : ''}${estado ? `&estado=${estado}` : ''}`}>
              <Button variant="secondary" size="sm">Siguiente →</Button>
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
