'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { useEffect, useState } from 'react'

// ─── Consola Email ────────────────────────────────────────────────────────────
function EmailConsola() {
  const [status, setStatus]   = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<string | null>(null)

  const verificar = async () => {
    setLoading(true); setStatus(null); setSendResult(null)
    const res  = await fetch('/api/email/test')
    const data = await res.json()
    setStatus(data); setLoading(false)
  }

  const enviarTest = async () => {
    setSending(true); setSendResult(null)
    const res  = await fetch('/api/email/test', { method: 'POST' })
    const data = await res.json()
    setSendResult(data.ok ? '✅ ' + data.mensaje : '❌ ' + (data.error || 'Error'))
    setSending(false)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">🔌 Diagnóstico de Email SMTP</h2>
          <p className="text-sm text-gray-500">Verifica la conexión y configuración del servidor de correo</p>
        </div>
        <div className="flex gap-2">
          <button onClick={verificar} disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50">
            {loading ? '⏳ Verificando...' : '🔍 Verificar conexión'}
          </button>
          <button onClick={enviarTest} disabled={sending || !status || status.smtpStatus !== 'ok'}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-40">
            {sending ? 'Enviando...' : '📨 Enviar email test'}
          </button>
        </div>
      </div>

      {status && (
        <div className="space-y-3">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm ${
            status.smtpStatus === 'ok'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <span className="text-lg">{status.smtpStatus === 'ok' ? '✅' : '❌'}</span>
            <div>
              <p className="font-semibold">{status.smtpStatus === 'ok' ? 'Conexión SMTP establecida' : 'Error de conexión SMTP'}</p>
              {status.smtpError && <p className="text-xs mt-0.5 opacity-80">{status.smtpError}</p>}
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-gray-300 space-y-1">
            <p className="text-gray-500 mb-2">// Variables de entorno (producción)</p>
            {Object.entries(status.config).map(([k, v]) => (
              <p key={k}>
                <span className="text-blue-400">{k.toUpperCase()}</span>
                <span className="text-gray-500"> = </span>
                <span className={String(v).includes('no configurado') ? 'text-red-400' : 'text-green-400'}>
                  &quot;{String(v)}&quot;
                </span>
              </p>
            ))}
          </div>
        </div>
      )}

      {sendResult && (
        <div className={`mt-3 px-4 py-3 rounded-lg text-sm font-medium ${
          sendResult.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {sendResult}
        </div>
      )}
    </div>
  )
}

// ─── Consola Usuarios BD ──────────────────────────────────────────────────────
function UsuariosBDConsola() {
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const cargar = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/debug-usuarios')
    setData(await res.json())
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">🗄️ Consola Usuarios — Base de Datos</h2>
          <p className="text-sm text-gray-500">Estado real de cada usuario en Turso/libSQL</p>
        </div>
        <button onClick={cargar} disabled={loading}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50">
          {loading ? '⏳ Cargando...' : '🔄 Consultar BD'}
        </button>
      </div>

      {data && (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="px-3 py-2 border border-gray-200">ID</th>
                  <th className="px-3 py-2 border border-gray-200">Nombre</th>
                  <th className="px-3 py-2 border border-gray-200">Email</th>
                  <th className="px-3 py-2 border border-gray-200">Rol</th>
                  <th className="px-3 py-2 border border-gray-200">Activo</th>
                  <th className="px-3 py-2 border border-gray-200">Hash bcrypt</th>
                  <th className="px-3 py-2 border border-gray-200">Última actualización</th>
                </tr>
              </thead>
              <tbody>
                {data.usuarios?.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border border-gray-200">{u.id}</td>
                    <td className="px-3 py-2 border border-gray-200 font-semibold">{u.nombre}</td>
                    <td className="px-3 py-2 border border-gray-200 text-blue-700">{u.email}</td>
                    <td className="px-3 py-2 border border-gray-200">{u.rol}</td>
                    <td className="px-3 py-2 border border-gray-200">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                        {u.activo ? '✅ Activo' : '❌ Inactivo'}
                      </span>
                    </td>
                    <td className="px-3 py-2 border border-gray-200">
                      <span className={u.tienePassword ? 'text-green-700' : 'text-red-600'}>
                        {u.tienePassword ? `✅ ${u.hashPreview}` : '❌ SIN HASH'}
                      </span>
                    </td>
                    <td className="px-3 py-2 border border-gray-200 text-gray-500">
                      {u.fechaActualizacion ? new Date(u.fechaActualizacion).toLocaleString('es-ES') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Consola Test Credenciales ────────────────────────────────────────────────
function TestCredencialesConsola() {
  const [email, setEmail]     = useState('')
  const [pass, setPass]       = useState('')
  const [result, setResult]   = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testear = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setResult(null)
    const res  = await fetch('/api/admin/debug-usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    })
    setResult(await res.json())
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">🔑 Test de Credenciales</h2>
        <p className="text-sm text-gray-500">Verifica si un usuario puede iniciar sesión sin hacer logout. Útil para confirmar cambios de contraseña.</p>
      </div>

      <form onSubmit={testear} className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Email del usuario</label>
          <input
            type="email" required value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="juanc@aluminiosfranco.es"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña a probar</label>
          <input
            type="password" required value={pass}
            onChange={e => setPass(e.target.value)}
            placeholder="Contraseña..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <button type="submit" disabled={loading}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
          {loading ? '⏳ Verificando...' : '🔍 Verificar'}
        </button>
      </form>

      {result && (
        <div className={`mt-4 rounded-lg p-4 text-sm ${result.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`font-bold text-base mb-2 ${result.ok ? 'text-green-800' : 'text-red-800'}`}>
            {result.motivo}
          </p>
          {result.usuario && (
            <div className="font-mono text-xs text-gray-600 space-y-1 bg-white rounded p-3 border">
              <p><span className="text-gray-400">ID:</span> {result.usuario.id}</p>
              <p><span className="text-gray-400">Nombre:</span> {result.usuario.nombre}</p>
              <p><span className="text-gray-400">Rol:</span> {result.usuario.rol}</p>
              <p><span className="text-gray-400">Activo:</span> {result.usuario.activo ? '✅ Sí' : '❌ No'}</p>
              <p><span className="text-gray-400">Actualizado:</span> {result.usuario.fechaActualizacion ? new Date(result.usuario.fechaActualizacion).toLocaleString('es-ES') : '—'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Consola Historial Contraseñas ────────────────────────────────────────────
function HistorialPasswordsConsola() {
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const cargar = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/debug-usuarios')
    setData(await res.json())
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">📋 Historial de Cambios de Contraseña</h2>
          <p className="text-sm text-gray-500">Registro auditado de todos los cambios realizados por administradores</p>
        </div>
        <button onClick={cargar} disabled={loading}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50">
          {loading ? '⏳ Cargando...' : '🔄 Ver historial'}
        </button>
      </div>

      {data && (
        data.historialPasswords?.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">No hay cambios de contraseña registrados aún</div>
        ) : (
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-gray-300 space-y-2 max-h-64 overflow-y-auto">
            {data.historialPasswords?.map((h: any, i: number) => (
              <div key={i} className="border-b border-gray-700 pb-2">
                <span className="text-yellow-400">[{h.fecha ? new Date(h.fecha).toLocaleString('es-ES') : '—'}]</span>
                {' '}<span className="text-green-400">{h.accion}</span>
                {' '}<span className="text-gray-200">{h.detalle}</span>
                {' '}<span className="text-blue-400">por {h.usuario}</span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
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

// ─── Página principal Admin ───────────────────────────────────────────────────
export default function AdminPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [editForm, setEditForm] = useState({ nombre: '', rol: 'OPERADOR', activo: true, password: '' })
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
    setTimeout(() => setMsg(null), 5000)
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
      mostrarMsg('ok', `✅ Usuario ${form.nombre} creado correctamente`)
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
      const cambioClave = editForm.password ? ` — contraseña actualizada ✅` : ''
      mostrarMsg('ok', `✅ Usuario "${editForm.nombre}" actualizado${cambioClave}`)
      setEditando(null)
      cargarUsuarios()
    } else {
      const data = await res.json().catch(() => ({}))
      mostrarMsg('error', `❌ Error al actualizar: ${data.error || 'desconocido'}`)
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
        <div className="p-6 space-y-6 max-w-6xl">

          {/* Mensaje de estado global */}
          {msg && (
            <div className={`p-4 rounded-lg font-medium text-sm ${msg.tipo === 'ok' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
              {msg.texto}
            </div>
          )}

          {/* ── CREAR USUARIO ─────────────────────────────────────── */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">➕ Crear Nuevo Usuario</h2>
            <form onSubmit={crearUsuario} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                <input required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Juan García"
                  value={form.nombre}
                  onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="usuario@aluminiosfranco.es"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                <input type="password" required
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
                  onChange={e => setForm(p => ({ ...p, rol: e.target.value }))}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <button type="submit" disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium px-6 py-2 rounded-lg text-sm transition">
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
                          u.rol === 'ADMIN'    ? 'bg-purple-100 text-purple-800' :
                          u.rol === 'OPERADOR' ? 'bg-blue-100 text-blue-800' :
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
                          className="text-blue-600 hover:underline text-xs font-medium">
                          Editar
                        </button>
                        {u.activo ? (
                          <button onClick={() => desactivarUsuario(u)}
                            className="text-red-600 hover:underline text-xs font-medium">
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
                <h3 className="text-lg font-bold mb-1">Editar: {editando.nombre}</h3>
                <p className="text-xs text-gray-500 mb-4">Los cambios se guardan en la base de datos inmediatamente</p>
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
                      onChange={e => setEditForm(p => ({ ...p, rol: e.target.value }))}>
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nueva contraseña <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span>
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Nueva contraseña..."
                      value={editForm.password}
                      onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                    />
                    {editForm.password && (
                      <p className="text-xs text-amber-600 mt-1">⚠️ Se cambiará la contraseña al guardar. Verifica con la Consola de Credenciales después.</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="activo" checked={editForm.activo}
                      onChange={e => setEditForm(p => ({ ...p, activo: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <label htmlFor="activo" className="text-sm font-medium text-gray-700">Usuario activo</label>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={guardarEdicion} disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm">
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button onClick={() => setEditando(null)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── SEPARADOR CONSOLAS ─────────────────────────────────── */}
          <div className="border-t-2 border-dashed border-gray-300 pt-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">🛠️ Consolas de diagnóstico</p>
          </div>

          {/* ── CONSOLA TEST CREDENCIALES ─────────────────────────── */}
          <TestCredencialesConsola />

          {/* ── CONSOLA USUARIOS BD ───────────────────────────────── */}
          <UsuariosBDConsola />

          {/* ── CONSOLA HISTORIAL CONTRASEÑAS ─────────────────────── */}
          <HistorialPasswordsConsola />

          {/* ── CONSOLA EMAIL ──────────────────────────────────────── */}
          <EmailConsola />

          {/* ── INFORMES POR EMAIL ────────────────────────────────── */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">📧 Informes y Alertas por Email</h2>
            <p className="text-sm text-gray-500 mb-4">Se envían a danielf@aluminiosfranco.es y juanc@aluminiosfranco.es. Las automáticas se ejecutan por tarea programada.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-1">📋 Informe Semanal</h3>
                <p className="text-xs text-gray-500 mb-3">Todos los pedidos activos. <strong>Auto: lunes 8:00</strong></p>
                <button onClick={() => enviarEmail('semanal', 'Informe semanal')}
                  disabled={emailLoading !== null}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                  {emailLoading === 'semanal' ? 'Enviando...' : 'Enviar Ahora'}
                </button>
              </div>
              <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <h3 className="font-semibold text-yellow-800 mb-1">⏰ Alerta Sin FechaSalida</h3>
                <p className="text-xs text-yellow-700 mb-3">Pedidos sin fecha de salida &gt;3 días. <strong>Auto: L-V 8:00</strong></p>
                <button onClick={() => enviarEmail('alerta-sin-salida', 'Alerta sin salida')}
                  disabled={emailLoading !== null}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                  {emailLoading === 'alerta-sin-salida' ? 'Enviando...' : 'Enviar Ahora'}
                </button>
              </div>
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h3 className="font-semibold text-red-800 mb-1">⚠️ Terminados Sin Tarragona</h3>
                <p className="text-xs text-red-600 mb-3">Terminados sin llegar a almacén. <strong>Auto: diaria 9:00</strong></p>
                <button onClick={() => enviarEmail('alerta-terminados', 'Alerta terminados')}
                  disabled={emailLoading !== null}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
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
