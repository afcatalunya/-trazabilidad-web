'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'

interface Incidencia {
  id: number
  numeroPedido: string
  tipoSalida?: string
  fechaIncidencia?: string
  tipoIncidencia?: string
  descripcion?: string
  estadoIncidencia: string
  fechaResolucion?: string
  comentarios?: string
  createdAt?: string
}

const ESTADOS = [
  { value: 'ABIERTA', label: 'Abierta' },
  { value: 'EN GESTION', label: 'En Gestión' },
  { value: 'RESUELTA', label: 'Resuelta' },
  { value: 'CERRADA', label: 'Cerrada' },
]

const TIPOS_INCIDENCIA = [
  { value: 'MATERIAL DEFECTUOSO', label: 'Material Defectuoso' },
  { value: 'FALTA MATERIAL', label: 'Falta Material' },
  { value: 'DAÑO TRANSPORTE', label: 'Daño Transporte' },
  { value: 'ERROR PEDIDO', label: 'Error Pedido' },
  { value: 'NO VIENE EN EL CAMION', label: 'No Viene en el Camión' },
  { value: 'MAL LACADO', label: 'Mal Lacado' },
  { value: 'OTRO', label: 'Otro' },
]

export default function IncidenciasPage() {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [filteredIncidencias, setFilteredIncidencias] = useState<Incidencia[]>([])
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    numeroPedido: '',
    tipoIncidencia: '',
    descripcion: '',
    estadoIncidencia: 'ABIERTA',
  })

  useEffect(() => {
    fetchIncidencias()
  }, [])

  useEffect(() => {
    if (estadoFiltro) {
      setFilteredIncidencias(
        incidencias.filter((i) => i.estadoIncidencia === estadoFiltro)
      )
    } else {
      setFilteredIncidencias(incidencias)
    }
  }, [estadoFiltro, incidencias])

  const fetchIncidencias = async () => {
    try {
      const res = await fetch('/api/incidencias')
      const data = await res.json()
      setIncidencias(data)
    } catch (error) {
      console.error('Error fetching incidencias:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/incidencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Error al crear incidencia')

      setFormData({ numeroPedido: '', tipoIncidencia: '', descripcion: '', estadoIncidencia: 'ABIERTA' })
      setShowForm(false)
      fetchIncidencias()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear incidencia')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'ABIERTA':    return 'red'
      case 'EN GESTION': return 'orange'
      case 'RESUELTA':   return 'blue'
      case 'CERRADA':    return 'green'
      default:           return 'gray'
    }
  }

  return (
    <>
      <Header title="Incidencias" />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-6 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {filteredIncidencias.length} Incidencias
            </h3>
            <Button onClick={() => setShowForm(!showForm)} variant="primary">
              {showForm ? 'Cancelar' : '+ Nueva Incidencia'}
            </Button>
          </div>

          {showForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nueva Incidencia</h3>
              <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                <Input
                  label="Número de Pedido *"
                  value={formData.numeroPedido}
                  onChange={(e) => setFormData({ ...formData, numeroPedido: e.target.value })}
                  required
                  placeholder="V26-01234"
                />
                <Select
                  label="Tipo de Incidencia"
                  value={formData.tipoIncidencia}
                  onChange={(e) => setFormData({ ...formData, tipoIncidencia: e.target.value })}
                  options={TIPOS_INCIDENCIA}
                  placeholder="Selecciona tipo"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe la incidencia..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creando...' : 'Crear Incidencia'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="mb-6 max-w-xs">
            <Select
              label="Filtrar por Estado"
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              options={ESTADOS}
              placeholder="Todos los estados"
            />
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nº Pedido</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredIncidencias.map((incidencia) => (
                    <tr key={incidencia.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {incidencia.numeroPedido}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {incidencia.tipoIncidencia || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                        {incidencia.descripcion || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge variant={getEstadoColor(incidencia.estadoIncidencia) as any}>
                          {incidencia.estadoIncidencia}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {incidencia.fechaIncidencia
                          ? new Date(incidencia.fechaIncidencia).toLocaleDateString('es-ES')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredIncidencias.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No hay incidencias que mostrar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
