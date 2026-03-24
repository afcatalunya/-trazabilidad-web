'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
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
]

export function FiltrosPedidos() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [estado, setEstado] = useState(searchParams.get('estado') || '')
  const [almacen, setAlmacen] = useState(searchParams.get('almacen') || '')
  const [categoria, setCategoria] = useState(searchParams.get('categoria') || '')
  const [urgente, setUrgente] = useState(searchParams.get('urgente') || '')

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (estado) params.set('estado', estado)
    if (almacen) params.set('almacen', almacen)
    if (categoria) params.set('categoria', categoria)
    if (urgente) params.set('urgente', urgente)

    router.push(`/pedidos?${params.toString()}`)
  }

  const handleReset = () => {
    setSearch('')
    setEstado('')
    setAlmacen('')
    setCategoria('')
    setUrgente('')
    router.push('/pedidos')
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Input
          label="Buscar"
          placeholder="Número o cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyUp={(e) => e.key === 'Enter' && handleFilter()}
        />

        <Select
          label="Estado"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          options={ESTADOS}
          placeholder="Todos"
        />

        <Select
          label="Almacén"
          value={almacen}
          onChange={(e) => setAlmacen(e.target.value)}
          options={ALMACENES}
          placeholder="Todos"
        />

        <Select
          label="Categoría"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          options={CATEGORIAS}
          placeholder="Todas"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Urgente</label>
          <select
            value={urgente}
            onChange={(e) => setUrgente(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="true">Solo urgentes</option>
            <option value="false">Sin urgentes</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button onClick={handleFilter} size="sm">
          Filtrar
        </Button>
        <Button onClick={handleReset} variant="secondary" size="sm">
          Limpiar
        </Button>
      </div>
    </div>
  )
}
