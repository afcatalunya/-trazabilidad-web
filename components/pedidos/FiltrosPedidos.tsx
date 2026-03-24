'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'

const ESTADOS = [
  { value: 'SIN PEDIDO DE COMPRA', label: 'Sin Pedido de Compra' },
  { value: 'EN PROCESO', label: 'En Proceso' },
  { value: 'PLANNING', label: 'Planning' },
  { value: 'PARA CARGAR MURCIA', label: 'Para Cargar Murcia' },
  { value: 'EN CAMION', label: 'En Camión' },
  { value: 'EN ALMACÉN', label: 'En Almacén' },
  { value: 'ENTREGADO', label: 'Entregado' },
  { value: 'ANULADO', label: 'Anulado' },
]

const ALMACENES = [
  { value: 'MURCIA', label: 'Murcia' },
  { value: 'TARRAGONA', label: 'Tarragona' },
  { value: 'VALENCIA', label: 'Valencia' },
]

const CATEGORIAS = [
  { value: 'NORMALIZADOS', label: 'Normalizados' },
  { value: 'CHAPAS', label: 'Chapas' },
  { value: 'CARPINTERÍA', label: 'Carpintería' },
  { value: 'COMPOSITE', label: 'Composite' },
  { value: 'MINIONDA', label: 'Minionda' },
  { value: 'DEPLOYE', label: 'Deploye' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
  { value: 'ACCESORIOS', label: 'Accesorios' },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.45rem 0.75rem',
  border: '1px solid #e5e7eb',
  borderRadius: '0.5rem',
  fontSize: '0.8125rem',
  background: 'white',
  outline: 'none',
  color: '#374151',
}

export function FiltrosPedidos() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch]     = useState(searchParams.get('search') || '')
  const [estado, setEstado]     = useState(searchParams.get('estado') || '')
  const [almacen, setAlmacen]   = useState(searchParams.get('almacen') || '')
  const [categoria, setCategoria] = useState(searchParams.get('categoria') || '')
  const [urgente, setUrgente]   = useState(searchParams.get('urgente') || '')

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (search)   params.set('search', search)
    if (estado)   params.set('estado', estado)
    if (almacen)  params.set('almacen', almacen)
    if (categoria) params.set('categoria', categoria)
    if (urgente)  params.set('urgente', urgente)
    router.push(`/pedidos?${params.toString()}`)
  }

  const handleReset = () => {
    setSearch(''); setEstado(''); setAlmacen(''); setCategoria(''); setUrgente('')
    router.push('/pedidos')
  }

  const hasFilters = !!(search || estado || almacen || categoria || urgente)

  return (
    <div
      className="rounded-xl px-4 py-3 flex flex-wrap items-end gap-3"
      style={{ background: 'white', border: '1px solid #e5e7eb' }}
    >
      {/* Search */}
      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
        <div className="relative">
          <input
            type="text"
            style={inputStyle}
            placeholder="Número, cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyUp={e => e.key === 'Enter' && handleFilter()}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-xs"
            >✕</button>
          )}
        </div>
      </div>

      {/* Estado */}
      <div className="min-w-[150px]">
        <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
        <select style={inputStyle} value={estado} onChange={e => setEstado(e.target.value)}>
          <option value="">Todos</option>
          {ESTADOS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Almacén */}
      <div className="min-w-[120px]">
        <label className="block text-xs font-medium text-gray-500 mb-1">Almacén</label>
        <select style={inputStyle} value={almacen} onChange={e => setAlmacen(e.target.value)}>
          <option value="">Todos</option>
          {ALMACENES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Categoría */}
      <div className="min-w-[130px]">
        <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
        <select style={inputStyle} value={categoria} onChange={e => setCategoria(e.target.value)}>
          <option value="">Todas</option>
          {CATEGORIAS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Urgente */}
      <div className="min-w-[110px]">
        <label className="block text-xs font-medium text-gray-500 mb-1">Urgente</label>
        <select style={inputStyle} value={urgente} onChange={e => setUrgente(e.target.value)}>
          <option value="">Todos</option>
          <option value="true">🚨 Solo urgentes</option>
        </select>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pb-0.5">
        <Button onClick={handleFilter} size="sm">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Filtrar
        </Button>
        {hasFilters && (
          <Button onClick={handleReset} variant="secondary" size="sm">
            Limpiar
          </Button>
        )}
      </div>
    </div>
  )
}
