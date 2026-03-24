'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

// SVG logo for login page
function AfLogoLarge() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#2d9e4e" />
      <circle cx="32" cy="32" r="28" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="1.5"/>
      <path d="M 13 52 A 22 22 0 0 1 52 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeOpacity="0.4"/>
      <text
        x="50%" y="55%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="white"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontWeight="700"
        fontSize="24"
        letterSpacing="-1"
      >
        af
      </text>
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (!result?.ok) {
        setError('Email o contraseña incorrectos')
        setLoading(false)
        return
      }

      router.push('/pedidos')
      router.refresh()
    } catch (err) {
      setError('Ocurrió un error al intentar iniciar sesión')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #f0faf4 0%, #d9f2e3 100%)' }}>

      {/* Left panel — brand */}
      <div
        className="hidden lg:flex w-2/5 flex-col justify-between p-12"
        style={{ background: 'linear-gradient(160deg, #1a5c35 0%, #2d9e4e 100%)' }}
      >
        <div>
          <AfLogoLarge />
          <h1 className="text-white text-3xl font-bold mt-6 leading-tight">
            Aluminios<br />Franco S.A.
          </h1>
          <p className="text-white/60 text-sm mt-3">Trazabilidad de Pedidos</p>
        </div>
        <div>
          <p className="text-white/30 text-xs">© 2026 Aluminios Franco S.A.</p>
          <p className="text-white/20 text-xs">Tarragona, Cataluña</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <AfLogoLarge />
            <h2 className="text-xl font-bold mt-3" style={{ color: '#1a5c35' }}>Aluminios Franco</h2>
            <p className="text-gray-500 text-sm">Trazabilidad de Pedidos</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Iniciar sesión</h2>
            <p className="text-sm text-gray-400 mb-6">Accede con tus credenciales</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full"
                  placeholder="tu@email.com"
                  style={{
                    padding: '0.6rem 0.875rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    width: '100%',
                    outline: 'none',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#2d9e4e'; e.target.style.boxShadow = '0 0 0 3px rgba(45,158,78,0.15)' }}
                  onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  style={{
                    padding: '0.6rem 0.875rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    width: '100%',
                    outline: 'none',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#2d9e4e'; e.target.style.boxShadow = '0 0 0 3px rgba(45,158,78,0.15)' }}
                  onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-all duration-150 mt-2"
                style={{
                  background: loading ? '#9ca3af' : '#2d9e4e',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#217a3b' }}
                onMouseLeave={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#2d9e4e' }}
              >
                {loading ? 'Entrando...' : 'Iniciar Sesión'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
