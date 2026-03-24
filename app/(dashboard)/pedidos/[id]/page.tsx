import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { EstadoBadge } from '@/components/pedidos/EstadoBadge'
import { DeletePedidoButton } from '@/components/pedidos/DeletePedidoButton'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { db } from '@/lib/db'
import { pedidos, comentarios, incidencias } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PedidoDetailPage({ params }: PageProps) {
  const { id } = await params
  const pedidoId = parseInt(id)

  let pedido: any = null
  let pedidoComentarios: any[] = []
  let pedidoIncidencias: any[] = []

  try {
    const result = await db.select().from(pedidos).where(eq(pedidos.id, pedidoId)).limit(1)
    pedido = result[0] || null

    if (pedido) {
      pedidoComentarios = await db
        .select()
        .from(comentarios)
        .where(eq(comentarios.numeroPedido, pedido.numeroPedido))

      pedidoIncidencias = await db
        .select()
        .from(incidencias)
        .where(eq(incidencias.numeroPedido, pedido.numeroPedido))
    }
  } catch (err) {
    console.error('Error cargando detalle pedido:', err)
  }

  if (!pedido) {
    return (
      <>
        <Header title="Pedido no encontrado" />
        <div className="flex-1 overflow-auto p-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500 text-lg">El pedido no existe</p>
            <Link href="/pedidos" className="mt-4 inline-block">
              <Button variant="secondary">← Volver a Pedidos</Button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  const campo = (label: string, valor: any) =>
    valor ? (
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="font-semibold text-gray-900 mt-0.5">{valor}</p>
      </div>
    ) : null

  return (
    <>
      <Header title={`Pedido ${pedido.numeroPedido}${pedido.tipoSalida ? ` · ${pedido.tipoSalida}` : ''}`} />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Columna principal ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Información General */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Información General</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {campo('Número Pedido', pedido.numeroPedido)}
                  {campo('Tipo Salida', pedido.tipoSalida)}
                  {campo('Fecha Pedido', formatDate(pedido.fechaPedido))}
                  {campo('Cliente', pedido.cliente)}
                  {campo('Nº Cliente', pedido.numeroCliente)}
                  {campo('Comercial', pedido.codigoComercial)}
                  {campo('Categoría', pedido.categoria)}
                  {campo('Referencia', pedido.referenciaProducto)}
                  {campo('Acabado', pedido.acabado)}
                  {campo('Color', pedido.color)}
                  {campo('Proveedor', pedido.proveedor)}
                  {campo('Doc. Salida', pedido.docSalida)}
                  {campo('Origen Material', pedido.origenMaterial)}
                  {campo('Almacén', pedido.almacen)}
                </div>
                {/* PDF adjunto */}
                {pedido.pdfAdjunto && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#dc2626' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">PDF Orden de Trabajo</p>
                      <a
                        href={pedido.pdfAdjunto}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold hover:underline"
                        style={{ color: '#2d9e4e' }}
                      >
                        Ver / Descargar PDF →
                      </a>
                    </div>
                  </div>
                )}

                {pedido.comentarios && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Comentarios</p>
                    <p className="text-gray-900 mt-0.5 whitespace-pre-wrap">{pedido.comentarios}</p>
                  </div>
                )}
              </div>

              {/* Fechas del proceso */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Progreso del Pedido</h2>
                <div className="space-y-3">
                  {[
                    { label: '1. Salida Material',    fecha: pedido.fechaSalida },
                    { label: '2. Planning',            fecha: pedido.fechaPlanning },
                    { label: '3. Terminado',           fecha: pedido.fechaTerminado },
                    { label: '4. Carga Camión',        fecha: pedido.fechaCargaCamion },
                    { label: '5. En Tarragona',        fecha: pedido.fechaEnTarragona },
                    { label: '6. Entrega a Cliente',   fecha: pedido.fechaEntregaCliente },
                  ].map(({ label, fecha }) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ background: fecha ? '#f0faf4' : '#f9fafb' }}
                    >
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: fecha ? '#2d9e4e' : '#d1d5db' }}
                      />
                      <span className="text-sm font-medium text-gray-700 flex-1">{label}</span>
                      <span className="text-sm" style={{ color: fecha ? '#1a5c35' : '#9ca3af', fontWeight: fecha ? 600 : 400 }}>
                        {fecha ? formatDate(fecha) : 'Pendiente'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Incidencias */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Incidencias ({pedidoIncidencias.length})
                </h2>
                {pedidoIncidencias.length > 0 ? (
                  <div className="space-y-3">
                    {pedidoIncidencias.map((inc: any) => (
                      <div key={inc.id} className="border border-orange-200 bg-orange-50 rounded p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-gray-900">{inc.tipoIncidencia || 'Incidencia'}</span>
                          <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">
                            {inc.estadoIncidencia}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{inc.descripcion}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(inc.fechaIncidencia)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Sin incidencias</p>
                )}
              </div>

              {/* Comentarios */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Notas ({pedidoComentarios.length})
                </h2>
                {pedidoComentarios.length > 0 ? (
                  <div className="space-y-3">
                    {pedidoComentarios.map((com: any) => (
                      <div key={com.id} className="border-l-4 p-3 rounded-r" style={{ borderColor: '#2d9e4e', background: '#f0faf4' }}>
                        <p className="text-sm text-gray-900">{com.texto}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {com.usuario ? `${com.usuario} · ` : ''}{formatDate(com.fechaComentario)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Sin notas</p>
                )}
              </div>
            </div>

            {/* ── Sidebar ── */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">Estado</h3>
                <EstadoBadge estado={pedido.estadoPedido || 'SIN PEDIDO DE COMPRA'} />
                {pedido.urgente === 'URGENTE' && (
                  <div className="mt-3 bg-red-100 text-red-700 font-bold text-center py-1 rounded text-sm">
                    🚨 URGENTE
                  </div>
                )}
                {pedido.incidenciaMaterial === 'SÍ' && (
                  <div className="mt-2 bg-orange-100 text-orange-700 text-center py-1 rounded text-sm">
                    ⚠️ Incidencia Material
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">Acciones</h3>
                <div className="space-y-2">
                  <Link href={`/pedidos/${pedidoId}/editar`} className="block">
                    <Button className="w-full" variant="primary" size="sm">✏️ Editar Pedido</Button>
                  </Link>
                  <Link href="/pedidos" className="block">
                    <Button className="w-full" variant="secondary" size="sm">← Volver</Button>
                  </Link>
                  <DeletePedidoButton pedidoId={pedido.id} numeroPedido={pedido.numeroPedido} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
