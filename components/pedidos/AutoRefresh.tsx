'use client'

/**
 * AutoRefresh — recarga silenciosamente los datos del Server Component
 * cada `intervalMs` ms sin perder el estado del cliente (scroll, filtros).
 * Next.js router.refresh() solo re-fetcha los datos del servidor.
 *
 * Optimizaciones de consumo Vercel:
 *  - No refresca si la pestaña está en segundo plano (visibilityState hidden)
 *  - Intervalo por defecto 120s (era 30s → 4× menos invocaciones)
 *  - Al volver a primer plano refresca de inmediato si ya tocaba
 */
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface AutoRefreshProps {
  /** Intervalo en ms. Por defecto 120 segundos. */
  intervalMs?: number
}

export function AutoRefresh({ intervalMs = 120_000 }: AutoRefreshProps) {
  const router    = useRouter()
  const lastRef   = useRef<number>(Date.now())

  useEffect(() => {
    const refresh = () => {
      router.refresh()
      lastRef.current = Date.now()
    }

    const id = setInterval(() => {
      // Solo refrescar si la pestaña está visible
      if (document.visibilityState === 'visible') {
        refresh()
      }
      // Si está oculta, simplemente ignorar el tick (no se pierde nada,
      // se actualizará al volver al primer plano)
    }, intervalMs)

    // Al volver al primer plano: si han pasado más de intervalMs ms desde
    // el último refresco, actualizar de inmediato
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastRef.current
        if (elapsed >= intervalMs) {
          refresh()
        }
      }
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [router, intervalMs])

  // Sin UI — componente invisible
  return null
}
