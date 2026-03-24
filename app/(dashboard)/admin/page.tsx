'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { useEffect, useState } from 'react'

interface Usuario {
  id: number
  nombre: string
  email: string
  rol: string
  activo: number
  fechaCreacion: string
}

const ROLES = [
  { value: 'CONSULTA',  label: 'Consulta — solo lectura' },
  { value: 'OPERADOR',  label: 'Operador — editar pedidos, comentarios e incidencias' },
  { value: 'ADMIN',     label: 'Administrador — acceso total' },
]

const emptyForm = { nombre: '', email: '', password: '', rol: 'OPERADOR' }

export default function AdminPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [editForm, setEditForm] = useState({ nombre: '', rol: 'USUARIO', activo: true, password: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [emailLoading, setEmailLoading] = useState<string | null>(null)

  useEffect(() => {
    if (session && (session.user as any)?.rol !== 'ADMIN') router.push('/pedidos')
  }, [session, router])

  useEffect(() => {
    if (session && (session.user as any)?.rol === 'ADMIN') cargarUsuarios()
  }, [session])

  async function cargarUsuarios() {
    const res = await fetch('/api/usuarios')
    if (res.ok) setUsuarios(await res.json())
  }

  function mostrarMsg(tipo: 'ok' | 'error', texto: string) {
    setMsg({ tipo, texto })
    setTimeout(() => setMsg(null), 4000)
  }

  async function crearUsuario(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (res.ok) {
      mostrarMsg('ok', `Usuario ${form.nombre} creado correctamente`)
      setForm(emptyForm)
      cargarUsuarios()
    } else {
      const data = await res.json()
      mostrarMsg('error', data.error || 'Error al crear usuario')
    }
  }

  async function guardarEdicion() {
    if (!editando) return
    setLoading(true)
    const res = await fetch(`/api/usuarios/${editando.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setLoading(false)
    if (res.ok) {
      mostrarMsg('ok', 'Usuario actualizado')
      setEditando(null)
      cargarUsuarios()
    } else {
      mostrarMsg('error', 'Error al actualizar')
    }
  }

  async function desactivarUsuario(u: Usuario) {
    if (!confirm(`¿Desactivar a ${u.nombre}?`)) return
    const res = await fetch(`/api/usuarios/${u.id}`, { method: 'DELETE' })
    if (res.ok) {
      mostrarMsg('ok', `${u.nombre} desactivado`)
      cargarUsuarios()
    } else {
      const data = await res.json()
      mostrarMsg('error', data.error || 'Error')
    }
  }

  async function enviarEmail(endpoint: string, label: string) {
    setEmailLoading(endpoint)
    const res = await fetch(`/api/email/${endpoint}`, { method: 'POST' })
    setEmailLoading(null)
    if (res.ok) {
      const data = await res.json()
      mostrarMsg('ok', `✅ ${label} enviado correctamente`)
    } else {
      const data = await res.json().catch(() => ({}))
      mostrarMsg('error', `Error: ${data.error || 'No se pudo enviar el email'}`)
    }
  }

  if (!session || (session.user as any)?.rol !== 'ADMIN') {
    return (
      <>
        <Header title="Acceso Denegado" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-lg">No tienes permiso para acceder a esta página</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Panel Administrativo" />
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6 max-w-5xl">

          {/* Mensaje de estado */}
          {msg && (
            <div className={`p-4 rounded-lg font-medium ${msg.tipo === 'ok' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
              {msg.texto}
            </div>
          )}

          {/* ── CREAR USUARIO ─────────────────────────────────────── */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">➕ Crear Nuevo Usuario</h2>
            <form onSubmit={crearUsuario} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                <input
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Juan García"
                  value={form.nombre}
                  onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="usuario@aluminiosfranco.es"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                <input
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={form.rol}
                  onChange={e => setForm(p => ({ ...p, rol: e.target.value }))}
                >
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium px-6 py-2 rounded-lg text-sm transition"
                >
                  {loading ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>

          {/* ── LISTA DE USUARIOS ─────────────────────────────────── */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">👥 Usuarios del Sistema ({usuarios.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-3 font-semibold text-gray-600">Nombre</th>
                    <th className="pb-3 font-semibold text-gray-600">Email</th>
                    <th className="pb-3 font-semibold text-gray-600">Rol</th>
                    <th className="pb-3 font-semibold text-gray-600">Estado</th>
                    <th className="pb-3 font-semibold text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 font-medium">{u.nombre}</td>
                      <td className="py-3 text-gray-600">{u.email}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          u.rol === 'ADMIN'     ? 'bg-purple-100 text-purple-800' :
                          u.rol === 'OPERADOR'  ? 'bg-blue-100 text-blue-800' :
                                                  'bg-gray-100 text-gray-700'
                        }`}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${u.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3 space-x-2">
                        <button
                          onClick={() => { setEditando(u); setEditForm({ nombre: u.nombre, rol: u.rol, activo: !!u.activo, password: '' }) }}
                          className="text-blue-600 hover:underline text-xs font-medium"
                        >
                          Editar
                        </button>
                        {u.activo ? (
                          <button
                            onClick={() => desactivarUsuario(u)}
                            className="text-red-600 hover:underline text-xs font-medium"
                          >
                            Desactivar
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── MODAL EDITAR USUARIO ──────────────────────────────── */}
          {editando && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Editar: {editando.nombre}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={editForm.nombre}
                      onChange={e => setEditForm(p => ({ ...p, nombre: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={editForm.rol}
                      onChange={e => setEditForm(p => ({ ...p, rol: e.target.value }))}
                    >
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña (dejar vacío para no cambiar)</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Nueva contraseña..."
                      value={editForm.password}
                      onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="activo"
                      checked={editForm.activo}
                      onChange={e => setEditForm(p => ({ ...p, activo: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <label htmlFor="activo" className="text-sm font-medium text-gray-700">Usuario activo</label>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={guardarEdicion}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm"
                  >
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setEditando(null)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── INFORMES POR EMAIL ────────────────────────────────── */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">📧 Informes y Alertas por Email</h2>
            <p className="text-sm text-gray-500 mb-4">Se envían a danielf@aluminiosfranco.es y juanc@aluminiosfranco.es. Las automáticas se ejecutan por tarea programada.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-1">📋 Informe Semanal</h3>
                <p className="text-xs text-gray-500 mb-3">Todos los pedidos activos. <strong>Auto: lunes 8:00</strong></p>
                <button
                  onClick={() => enviarEmail('semanal', 'Informe semanal')}
                  disabled={emailLoading !== null}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                >
                  {emailLoading === 'semanal' ? 'Enviando...' : 'Enviar Ahora'}
                </button>
              </div>
              <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <h3 className="font-semibold text-yellow-800 mb-1">⏰ Alerta Sin FechaSalida</h3>
                <p className="text-xs text-yellow-700 mb-3">Pedidos sin fecha de salida de material &gt;3 días. <strong>Auto: L-V 8:00</strong></p>
                <button
                  onClick={() => enviarEmail('alerta-sin-salida', 'Alerta sin salida')}
                  disabled={emailLoading !== null}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                >
                  {emailLoading === 'alerta-sin-salida' ? 'Enviando...' : 'Enviar Ahora'}
                </button>
              </div>
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h3 className="font-semibold text-red-800 mb-1">⚠️ Terminados Sin Tarragona</h3>
                <p className="text-xs text-red-600 mb-3">Terminados sin llegar a almacén. <strong>Auto: diaria 9:00</strong></p>
                <button
                  onClick={() => enviarEmail('alerta-terminados', 'Alerta terminados')}
                  disabled={emailLoading !== null}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                >
                  {emailLoading === 'alerta-terminados' ? 'Enviando...' : 'Enviar Ahora'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
