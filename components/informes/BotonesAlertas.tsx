'use client'

import { useState } from 'react'

type AlertaKey = 'terminados' | 'sinSalida' | 'semanal'

export function BotonesAlertas() {
  const [loading, setLoading] = useState<AlertaKey | null>(null)
  const [result, setResult] = useState<{ key: AlertaKey; msg: string } | null>(null)

  async function disparar(key: AlertaKey, endpoint: string) {
    setLoading(key)
    setResult(null)
    try {
      const res = await fetch(endpoint, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        const msgs: Record<AlertaKey, string> = {
          terminados: `✅ Email enviado — ${data.pedidos} pedidos terminados sin llegar a Tarragona`,
          sinSalida:  `✅ Email enviado — ${data.pedidos} pedidos sin FechaSalida (>3 días)`,
          semanal:    `✅ Resumen semanal enviado — ${data.pedidos} pedidos activos`,
        }
        setResult({ key, msg: msgs[key] })
      } else {
        setResult({ key, msg: `❌ Error: ${data.error || 'desconocido'}` })
      }
    } catch {
      setResult({ key, msg: '❌ Error de red al enviar' })
    } finally {
      setLoading(null)
      setTimeout(() => setResult(null), 5000)
    }
  }

  const ACCIONES: { key: AlertaKey; label: string; sub: string; endpoint: string; color: string; bg: string }[] = [
    {
      key:      'sinSalida',
      label:    '⏰ Alerta sin FechaSalida',
      sub:      'Pedidos >3 días sin material',
      endpoint: '/api/email/alerta-sin-salida',
      color:    '#92400e',
      bg:       '#fef3c7',
    },
    {
      key:      'terminados',
      label:    '⚠️ Terminados sin carga',
      sub:      'Con FechaTerminado, sin Tarragona',
      endpoint: '/api/email/alerta-terminados',
      color:    '#7c2d12',
      bg:       '#fff7ed',
    },
    {
      key:      'semanal',
      label:    '📋 Resumen semanal',
      sub:      'Todos los pedidos activos',
      endpoint: '/api/email/semanal',
      color:    '#1e3a5f',
      bg:       '#eff6ff',
    },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full inline-block flex-shrink-0" style={{ background: '#2d9e4e' }} />
        Enviar alertas y reportes por email
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ACCIONES.map(acc => (
          <button
            key={acc.key}
            onClick={() => disparar(acc.key, acc.endpoint)}
            disabled={loading !== null}
            className="flex flex-col items-start gap-1 px-4 py-3 rounded-xl border-2 transition-all duration-150 disabled:opacity-60 text-left hover:shadow-md"
            style={{
              borderColor: acc.color,
              background:  result?.key === acc.key ? (result.msg.startsWith('✅') ? '#f0faf4' : '#fef2f2') : acc.bg,
            }}
          >
            {loading === acc.key ? (
              <span className="text-sm font-semibold" style={{ color: acc.color }}>
                Enviando...
              </span>
            ) : result?.key === acc.key ? (
              <span className="text-sm font-semibold" style={{ color: result.msg.startsWith('✅') ? '#16a34a' : '#dc2626' }}>
                {result.msg}
              </span>
            ) : (
              <>
                <span className="text-sm font-bold" style={{ color: acc.color }}>{acc.label}</span>
                <span className="text-xs text-gray-500">{acc.sub}</span>
              </>
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Los emails se envían a <strong>danielf@aluminiosfranco.es</strong> y <strong>juanc@aluminiosfranco.es</strong>.
        Las alertas también se ejecutan automáticamente por tarea programada.
      </p>
    </div>
  )
}
