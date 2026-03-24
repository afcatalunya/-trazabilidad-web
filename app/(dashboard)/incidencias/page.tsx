'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
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
  { value: 'ABIERTA',    label: 'Abierta' },
  { value: 'EN GESTION', label: 'En Gestión' },
  { value: 'RESUELTA',   label: 'Resuelta' },
  { value: 'CERRADA',    label: 'Cerrada' },
]

const TIPOS_INCIDENCIA = [
  { value: 'MATERIAL DEFECTUOSO',   label: 'Material Defectuoso' },
  { value: 'FALTA MATERIAL',        label: 'Falta Material' },
  { value: 'DAÑO TRANSPORTE',       label: 'Daño Transporte' },
  { value: 'ERROR PEDIDO',          label: 'Error Pedido' },
  { value: 'NO VIENE EN EL CAMION', label: 'No Viene en el Camión' },
  { value: 'MAL LACADO',            label: 'Mal Lacado' },
  { value: 'OTRO',                  label: 'Otro' },
]

const ESTADO_COLOR: Record<string, string> = {
  'ABIERTA':    'red',
  'EN GESTION': 'orange',
  'RESUELTA':   'blue',
  'CERRADA':    'green',
}

const ESTADO_NEXT: Record<string, string> = {
  'ABIERTA':    'EN GESTION',
  'EN GESTION': 'RESUELTA',
  'RESUELTA':   'CERRADA',
}

export default function IncidenciasPage() {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [estadoFiltro, setEstadoFiltro]   = useState('')
  const [showForm, setShowForm]           = useState(false)
  const [loading, setLoading]             = useState(false)
  const [editando, setEditando]           = useState<Incidencia | null>(null)
  const [formData, setFormData]           = useState({ numeroPedido: '', tipoIncidencia: '', descripcion: '', estadoIncidencia: 'ABIERTA' })
  const [editForm, setEditForm]           = useState({ tipoIncidencia: '', descripcion: '', estadoIncidencia: '', fechaResolucion: '', comentarios: '' })

  useEffect(() => { fetchIncidencias() }, [])

  const fetchIncidencias = async () => {
    const res  = await fetch('/api/incidencias')
    const data = await res.json()
    setIncidencias(Array.isArray(data) ? data : [])
  }

  const filteredIncidencias = incidencias.filter(i => !estadoFiltro || i.estadoIncidencia === estadoFiltro)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch('/api/incidencias', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      if (!res.ok) throw new Error()
      setFormData({ numeroPedido: '', tipoIncidencia: '', descripcion: '', estadoIncidencia: 'ABIERTA' })
      setShowForm(false); fetchIncidencias()
    } catch { alert('Error al crear incidencia') } finally { setLoading(false) }
  }

  const handleEdit = (inc: Incidencia) => {
    setEditando(inc)
    setEditForm({ tipoIncidencia: inc.tipoIncidencia || '', descripcion: inc.descripcion || '', estadoIncidencia: inc.estadoIncidencia || 'ABIERTA', fechaResolucion: inc.fechaResolucion || '', comentarios: inc.comentarios || '' })
  }

  const handleSaveEdit = async () => {
    if (!editando) return; setLoading(true)
    try {
      const res = await fetch(`/api/incidencias/${editando.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
      if (!res.ok) throw new Error()
      setEditando(null); fetchIncidencias()
    } catch { alert('Error al guardar') } finally { setLoading(false) }
  }

  const handleAvanzarEstado = async (inc: Incidencia) => {
    const nextEstado = ESTADO_NEXT[inc.estadoIncidencia]
    if (!nextEstado) return
    await fetch(`/api/incidencias/${inc.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...inc, estadoIncidencia: nextEstado }) })
    fetchIncidencias()
  }

  const kpis = ESTADOS.map(e => ({ ...e, count: incidencias.filter(i => i.estadoIncidencia === e.value).length }))

  return (
    <>
      <Header title="Incidencias" />
      <div className="flex-1 overflow-auto">
        <div className="p-6">

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {kpis.map(k => (
              <button key={k.value} onClick={() => setEstadoFiltro(estadoFiltro === k.value ? '' : k.value)}
                className="rounded-xl px-4 py-3 text-left transition-all duration-150 border bg-white"
                style={{ boxShadow: estadoFiltro === k.value ? '0 2px 8px rgba(0,0,0,0.10)' : '0 1px 3px rgba(0,0,0,0.04)', borderColor: estadoFiltro === k.value ? '#2d9e4e' : '#e5e7eb' }}>
                <p className="text-2xl font-bold text-gray-800">{k.count}</p>
                <p className="text-xs font-medium text-gray-500 mt-1">{k.label}</p>
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">{filteredIncidencias.length} incidencias</span>
            <Button onClick={() => setShowForm(!showForm)} variant="primary">{showForm ? 'Cancelar' : '+ Nueva Incidencia'}</Button>
          </div>

          {/* Form nueva */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5">
              <h3 className="font-semibold text-gray-800 mb-4">Nueva Incidencia</h3>
              <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nº Pedido *</label>
                  <input value={formData.numeroPedido} onChange={e => setFormData({...formData, numeroPedido: e.target.value})} required placeholder="V26-01234" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select value={formData.tipoIncidencia} onChange={e => setFormData({...formData, tipoIncidencia: e.target.value})}>
                    <option value="">Selecciona tipo</option>
                    {TIPOS_INCIDENCIA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} rows={2} placeholder="Describe la incidencia..." />
                </div>
                <div className="col-span-2 flex gap-2">
                  <Button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear'}</Button>
                  <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
                </div>
              </form>
            </div>
          )}

          {/* Tabla */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead style={{ background: '#f8faf9' }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nº Pedido</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredIncidencias.map(inc => (
                    <tr key={inc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{inc.numeroPedido}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{inc.tipoIncidencia || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{inc.descripcion || '-'}</td>
                      <td className="px-4 py-3"><Badge variant={ESTADO_COLOR[inc.estadoIncidencia] as any}>{inc.estadoIncidencia}</Badge></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{inc.fechaIncidencia ? new Date(inc.fechaIncidencia).toLocaleDateString('es-ES') : '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {ESTADO_NEXT[inc.estadoIncidencia] && (
                            <button onClick={() => handleAvanzarEstado(inc)}
                              className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 whitespace-nowrap">
                              → {ESTADO_NEXT[inc.estadoIncidencia]}
                            </button>
                          )}
                          <button onClick={() => handleEdit(inc)}
                            className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-100">
                            ✏️ Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredIncidencias.length === 0 && <div className="text-center py-12 text-gray-400">No hay incidencias</div>}
          </div>
        </div>
      </div>

      {/* Modal edición */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setEditando(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-800 mb-4">Editar Incidencia — {editando.numeroPedido}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={editForm.tipoIncidencia} onChange={e => setEditForm({...editForm, tipoIncidencia: e.target.value})} className="w-full">
                  {TIPOS_INCIDENCIA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select value={editForm.estadoIncidencia} onChange={e => setEditForm({...editForm, estadoIncidencia: e.target.value})} className="w-full">
                  {ESTADOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={editForm.descripcion} onChange={e => setEditForm({...editForm, descripcion: e.target.value})} rows={3} className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Resolución</label>
                <input type="date" value={editForm.fechaResolucion} onChange={e => setEditForm({...editForm, fechaResolucion: e.target.value})} className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
                <textarea value={editForm.comentarios} onChange={e => setEditForm({...editForm, comentarios: e.target.value})} rows={2} className="w-full" placeholder="Notas de gestión..." />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button onClick={handleSaveEdit} disabled={loading}>{loading ? 'Guardando...' : 'Guardar cambios'}</Button>
              <Button variant="secondary" onClick={() => setEditando(null)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
