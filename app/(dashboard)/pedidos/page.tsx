import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { PedidoRow } from '@/components/pedidos/PedidoRow'
import { FiltrosPedidos } from '@/components/pedidos/FiltrosPedidos'
import { db } from '@/lib/db'
import { pedidos } from '@/lib/schema'
import { like, and, eq, or } from 'drizzle-orm'

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
  } catch (err) {
    console.error('Error cargando pedidos:', err)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <>
      <Header title="Pedidos" />

      {/* Zona fija: título + botón */}
      <div className="px-6 pt-4 pb-2 flex justify-between items-center flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">{total} Pedidos</h3>
        <Link href="/pedidos/nuevo">
          <Button variant="primary">+ Nuevo Pedido</Button>
        </Link>
      </div>

      {/* Zona fija: filtros */}
      <div className="px-6 pb-2 flex-shrink-0">
        <FiltrosPedidos />
      </div>

      {/* Tabla con scroll propio — ocupa el resto de la pantalla */}
      <div className="flex-1 min-h-0 px-6 pb-2 overflow-hidden">
        <div className="bg-white rounded-lg shadow h-full overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {[
                  'Número','Tipo','F.Pedido','Cliente','Nº Cli','Comercial',
                  'Categoría','Referencia','Acabado','Color','Proveedor','Doc.Salida',
                  'F.Salida','F.Planning','F.Terminado','F.Camión','F.Tarragona','F.Entrega',
                  'Estado','Incidencia','Almacén','Urgente'
                ].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-50">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {result.map((pedido) => (
                <PedidoRow
                  key={pedido.id}
                  pedido={pedido}
                  cliente={pedido.cliente || '-'}
                />
              ))}
              {result.length === 0 && (
                <tr>
                  <td colSpan={22} className="text-center py-12 text-gray-400">
                    No hay pedidos que mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Zona fija: paginación */}
      <div className="px-6 py-3 flex justify-between items-center text-sm text-gray-600 flex-shrink-0 border-t border-gray-100">
        <span>Página {page} de {totalPages || 1}</span>
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
