import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { PedidoRow } from '@/components/pedidos/PedidoRow'
import { FiltrosPedidos } from '@/components/pedidos/FiltrosPedidos'
import { EstadoBadge } from '@/components/pedidos/EstadoBadge'
import { KpiCard } from '@/components/pedidos/KpiCard'
import { BotonCargaMurcia } from '@/components/pedidos/BotonCargaMurcia'
import { AutoRefresh } from '@/components/pedidos/AutoRefresh'
import { db } from '@/lib/db'
import { pedidos } from '@/lib/schema'
import { like, and, eq, or, count, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// Estados que se ocultan en la vista "activos" (vista por defecto)
const ESTADOS_INACTIVOS = ['EN ALMACÉN', 'ENTREGADO', 'ANULADO']

interface PageProps {
  searchParams: Promise<{
    search?: string
    estado?: string
    almacen?: string
    categoria?: string
    urgente?: string
    page?: string
    vista?: string   // 'activos' (default) | 'todos'
  }>
}


export default async function PedidosPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search    = params.search    || ''
  const estado    = params.estado    || ''
  const almacen   = params.almacen   || ''
  const categoria = params.categoria || ''
  const urgente   = params.urgente   || ''
  const page      = parseInt(params.page || '1')
  const vista     = params.vista     || 'activos'   // 'activos' por defecto
  const limit     = 50
  const offset    = (page - 1) * limit

  const conditions: any[] = []
  if (search) {
    conditions.push(
      or(
        like(pedidos.numeroPedido,       `%${search}%`),
        like(pedidos.cliente,             `%${search}%`),
        like(pedidos.numeroCliente,       `%${search}%`),
        like(pedidos.proveedor,           `%${search}%`),
        like(pedidos.referenciaProducto,  `%${search}%`),
        like(pedidos.tipoSalida,          `%${search}%`),
      )
    )
  }
  if (estado)    conditions.push(eq(pedidos.estadoPedido, estado))
  if (almacen)   conditions.push(eq(pedidos.almacen, almacen))
  if (categoria) conditions.push(eq(pedidos.categoria, categoria))
  if (urgente === 'true') conditions.push(eq(pedidos.urgente, 'URGENTE'))

  // Vista activos: excluir EN ALMACÉN, ENTREGADO, ANULADO (salvo que el usuario
  // haya seleccionado explícitamente uno de esos estados desde el KPI)
  const vistaActiva = vista !== 'todos' && !estado
  if (vistaActiva) {
    conditions.push(
      sql`COALESCE(${pedidos.estadoPedido}, '') NOT IN (${sql.join(
        ESTADOS_INACTIVOS.map(e => sql`${e}`), sql`, `
      )})`
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  let result: any[] = []
  let total = 0
  let totalGlobal = 0  // total sin filtro de vista (para el badge "Ver todos")

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

    // COUNT total con filtros (sin traer filas)
    const [{ total: totalCount }] = await db
      .select({ total: count() })
      .from(pedidos)
      .where(where)
    total = totalCount

    // COUNT global sin filtro vista (para el botón toggle)
    const [{ total: globalCount }] = await db
      .select({ total: count() })
      .from(pedidos)
    totalGlobal = globalCount

    // KPIs: GROUP BY estado_pedido — solo devuelve un array pequeño
    const kpiResult = await db
      .select({
        estadoPedido: sql<string>`COALESCE(${pedidos.estadoPedido}, 'SIN PEDIDO DE COMPRA')`,
        total: count(),
      })
      .from(pedidos)
      .groupBy(pedidos.estadoPedido)
    for (const row of kpiResult) {
      stats[row.estadoPedido] = (stats[row.estadoPedido] || 0) + row.total
    }
  } catch (err) {
    console.error('Error cargando pedidos:', err)
  }

  const totalPages = Math.ceil(total / limit)
  const totalAll = Object.values(stats).reduce((a, b) => a + b, 0)

  // Build base URL preserving other params (con encodeURIComponent para valores especiales)
  const baseParams = [
    search    ? `search=${encodeURIComponent(search)}` : '',
    almacen   ? `almacen=${encodeURIComponent(almacen)}` : '',
    categoria ? `categoria=${encodeURIComponent(categoria)}` : '',
    urgente   ? `urgente=${urgente}` : '',
  ].filter(Boolean).join('&')

  const estadoUrl = (e: string) =>
    `/pedidos?estado=${encodeURIComponent(e)}&vista=todos${baseParams ? `&${baseParams}` : ''}`
  const clearUrl = `/pedidos${baseParams ? `?${baseParams}` : ''}`

  // URLs para toggle vista
  const urlTodos    = `/pedidos?vista=todos${baseParams ? `&${baseParams}` : ''}`
  const urlActivos  = `/pedidos${baseParams ? `?${baseParams}` : ''}`

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
      {/* Auto-refresco silencioso cada 30 segundos */}
      <AutoRefresh intervalMs={30_000} />
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

      {/* Toolbar: count + toggle vista + new button */}
      <div className="px-6 pb-2 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500 font-medium">
            {vistaActiva ? (
              <><span className="text-gray-800 font-semibold">{total}</span> pedidos activos</>
            ) : total === totalAll ? (
              <><span className="text-gray-800 font-semibold">{total}</span> pedidos en total</>
            ) : (
              <><span className="text-gray-800 font-semibold">{total}</span> de {totalAll} pedidos</>
            )}
          </p>
          {/* Toggle vista activos / todos */}
          {vistaActiva ? (
            <Link
              href={urlTodos}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors"
              style={{ background: '#f1f5f9', color: '#64748b', borderColor: '#e2e8f0' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Ver todos ({totalGlobal})
            </Link>
          ) : (
            <Link
              href={urlActivos}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors"
              style={{ background: '#f0faf4', color: '#1a5c35', borderColor: '#b3e4c8' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Solo activos
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <BotonCargaMurcia />
          {/* Exportar CSV — respeta todos los filtros activos */}
          <a
            href={`/api/pedidos/export?${[
              estado    ? `estado=${encodeURIComponent(estado)}`       : '',
              vista !== 'activos' ? `vista=${vista}` : '',
              baseParams,
            ].filter(Boolean).join('&')}`}
            title="Exportar a CSV (se abre en Excel)"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
            style={{ background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Excel
          </a>
          <Link href="/pedidos/nuevo">
            <Button variant="primary" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Pedido
            </Button>
          </Link>
        </div>
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
                  'Número','Acciones','Tipo','F.Pedido','Cliente','Nº Cli','Comercial',
                  'Categoría','Referencia','Acabado','Color','Proveedor','Doc.Salida',
                  'F.Salida','F.Planning','F.Terminado','F.Camión','F.Tarragona','F.Entrega',
                  'Estado','Incidencia','Almacén','Urgente'
                ].map(h => (
                  <th
                    key={h}
                    className={`px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${
                      h === 'Número'   ? 'sticky left-0 z-20' :
                      h === 'Acciones' ? 'sticky z-20' : ''
                    }`}
                    style={{
                      color: '#1a5c35',
                      background: '#f0faf4',
                      ...(h === 'Número'   ? { minWidth: '120px', width: '120px' } : {}),
                      ...(h === 'Acciones' ? { left: '120px', boxShadow: '2px 0 5px rgba(0,0,0,0.06)' } : {}),
                    }}
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
                  <td colSpan={23} className="text-center py-16 text-gray-400">
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
            <Link href={`/pedidos?page=${page - 1}${estado ? `&estado=${encodeURIComponent(estado)}` : ''}${vista !== 'activos' ? `&vista=${vista}` : ''}${baseParams ? `&${baseParams}` : ''}`}>
              <Button variant="secondary" size="sm">← Anterior</Button>
            </Link>
          )}
          {page < totalPages && (
            <Link href={`/pedidos?page=${page + 1}${estado ? `&estado=${encodeURIComponent(estado)}` : ''}${vista !== 'activos' ? `&vista=${vista}` : ''}${baseParams ? `&${baseParams}` : ''}`}>
              <Button variant="secondary" size="sm">Siguiente →</Button>
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
