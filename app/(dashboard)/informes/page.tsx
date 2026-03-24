'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'

interface InformesData {
  estadoCounts: Record<string, number>
  pedidosPorCliente: Array<{
    cliente: string
    total: number
  }>
  urgentesActivos: number
  totalPedidos: number
}

export default function InformesPage() {
  const [informes, setInformes] = useState<InformesData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInformes()
  }, [])

  const fetchInformes = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/informes')
      const data = await res.json()
      setInformes(data)
    } catch (error) {
      console.error('Error fetching informes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (!informes) return

    let csv = 'Estado,Cantidad\n'
    Object.entries(informes.estadoCounts).forEach(([estado, count]) => {
      csv += `"${estado}",${count}\n`
    })

    csv += '\n\nCliente,Total Pedidos\n'
    informes.pedidosPorCliente.forEach((item) => {
      csv += `"${item.cliente}",${item.total}\n`
    })

    const element = document.createElement('a')
    element.setAttribute(
      'href',
      'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    )
    element.setAttribute('download', 'informes.csv')
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (loading) {
    return (
      <>
        <Header title="Informes" />
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <p className="text-gray-500">Cargando informes...</p>
          </div>
        </div>
      </>
    )
  }

  if (!informes) {
    return (
      <>
        <Header title="Informes" />
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <p className="text-gray-500">Error al cargar los informes</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Informes" />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-6 flex justify-end">
            <Button onClick={handleExportCSV} variant="secondary">
              Descargar CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Total Pedidos</p>
              <p className="text-3xl font-bold text-blue-600">
                {informes.totalPedidos}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Urgentes Activos</p>
              <p className="text-3xl font-bold text-red-600">
                {informes.urgentesActivos}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Entregados</p>
              <p className="text-3xl font-bold text-green-600">
                {informes.estadoCounts['ENTREGADO'] || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Clientes</p>
              <p className="text-3xl font-bold text-purple-600">
                {informes.pedidosPorCliente.length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Estado Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Distribución por Estado
              </h2>
              <div className="space-y-3">
                {Object.entries(informes.estadoCounts).map(([estado, count]) => (
                  <div key={estado}>
                    <div className="flex justify-between mb-1">
                      <p className="text-sm font-medium text-gray-700">{estado}</p>
                      <p className="text-sm font-semibold text-gray-900">{count}</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (count / informes.totalPedidos) * 100 || 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Clients */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Pedidos por Cliente
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {informes.pedidosPorCliente
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 10)
                  .map((item) => (
                    <div
                      key={item.cliente}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {item.cliente}
                      </p>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {item.total}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Detailed Stats Table */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Estadísticas Detalladas
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Porcentaje
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(informes.estadoCounts).map(([estado, count]) => (
                    <tr key={estado} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {estado}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{count}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {((count / informes.totalPedidos) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
