'use client'

import { useState } from 'react'

export function BotonCargaMurcia() {
  const [estado, setEstado] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [msg, setMsg]       = useState('')

  async function enviar() {
    setEstado('loading')
    setMsg('')
    try {
      const res  = await fetch('/api/email/carga-murcia', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.ok) {
        setEstado('ok')
        setMsg(`✅ Enviado — ${data.pedidos} pedidos${data.conPdf > 0 ? `, ${data.conPdf} PDF${data.conPdf > 1 ? 's' : ''} adjuntos` : ''}`)
      } else {
        setEstado('error')
        setMsg(`❌ ${data.error || 'Error al enviar'}`)
      }
    } catch {
      setEstado('error')
      setMsg('❌ Error de red')
    } finally {
      setTimeout(() => { setEstado('idle'); setMsg('') }, 6000)
    }
  }

  const colorBg: Record<string, string> = {
    idle:    '#c0392b',
    loading: '#9b2c2c',
    ok:      '#15803d',
    error:   '#dc2626',
  }

  return (
    <button
      onClick={enviar}
      disabled={estado === 'loading'}
      title="Enviar email con pedidos terminados pendientes de cargar en camión"
      style={{
        background:    colorBg[estado],
        color:         'white',
        border:        'none',
        borderRadius:  '8px',
        padding:       '8px 16px',
        fontSize:      '13px',
        fontWeight:    '600',
        cursor:        estado === 'loading' ? 'not-allowed' : 'pointer',
        display:       'flex',
        alignItems:    'center',
        gap:           '6px',
        whiteSpace:    'nowrap',
        transition:    'background 0.2s',
        opacity:       estado === 'loading' ? 0.75 : 1,
      }}
    >
      {estado === 'loading' ? (
        <>
          <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
          Enviando...
        </>
      ) : estado === 'ok' || estado === 'error' ? (
        <span>{msg}</span>
      ) : (
        <>
          🚛 Carga Camión Murcia
        </>
      )}
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </button>
  )
}
