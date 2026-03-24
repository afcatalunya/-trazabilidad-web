'use client'

/**
 * AutoRefresh — recarga silenciosamente los datos del Server Component
 * cada `intervalMs` ms sin perder el estado del cliente (scroll, filtros).
 * Next.js router.refresh() solo re-fetcha los datos del servidor.
 */
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AutoRefreshProps {
  /** Intervalo en ms. Por defecto 30 segundos. */
  intervalMs?: number
}

export function AutoRefresh({ intervalMs = 30_000 }: AutoRefreshProps) {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh()
    }, intervalMs)

    return () => clearInterval(id)
  }, [router, intervalMs])

  // Sin UI — componente invisible
  return null
}
