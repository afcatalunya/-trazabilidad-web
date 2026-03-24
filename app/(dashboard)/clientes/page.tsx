'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Cliente {
  id: number
  nombreCliente: string
  numeroCliente: string
  codigoComercial?: string
  contacto?: string
  email?: string
  telefono?: string
  activo?: number
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    pais: '',
  })

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    try {
      const res = await fetch('/api/clientes')
      const data = await res.json()
      setClientes(data)
    } catch (error) {
      console.error('Error fetching clientes:', error)
    }
  }

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)

    if (value) {
      try {
        const res = await fetch(`/api/clientes?search=${value}`)
        const data = await res.json()
        setClientes(data)
      } catch (error) {
        console.error('Error searching:', error)
      }
    } else {
      fetchClientes()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        throw new Error('Error al crear cliente')
      }

      setFormData({
        nombre: '',
        contacto: '',
        email: '',
        telefono: '',
        direccion: '',
        ciudad: '',
        codigoPostal: '',
        pais: '',
      })
      setShowForm(false)
      fetchClientes()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear cliente')
    } finally {
      setLoading(false)
    }
  }

  const filteredClientes = clientes.filter((c) =>
    (c.nombreCliente || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.numeroCliente || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Header title="Clientes" />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-6 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {filteredClientes.length} Clientes
            </h3>
            <Button
              onClick={() => setShowForm(!showForm)}
              variant="primary"
            >
              {showForm ? 'Cancelar' : '+ Nuevo Cliente'}
            </Button>
          </div>

          {showForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Nuevo Cliente
              </h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  required
                />
                <Input
                  label="Contacto"
                  value={formData.contacto}
                  onChange={(e) =>
                    setFormData({ ...formData, contacto: e.target.value })
                  }
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
                <Input
                  label="Teléfono"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                />
                <Input
                  label="Dirección"
                  value={formData.direccion}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                />
                <Input
                  label="Ciudad"
                  value={formData.ciudad}
                  onChange={(e) =>
                    setFormData({ ...formData, ciudad: e.target.value })
                  }
                />
                <Input
                  label="Código Postal"
                  value={formData.codigoPostal}
                  onChange={(e) =>
                    setFormData({ ...formData, codigoPostal: e.target.value })
                  }
                />
                <Input
                  label="País"
                  value={formData.pais}
                  onChange={(e) =>
                    setFormData({ ...formData, pais: e.target.value })
                  }
                />
                <div className="col-span-full flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creando...' : 'Crear Cliente'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="mb-6">
            <Input
              label="Buscar cliente"
              placeholder="Nombre..."
              value={search}
              onChange={handleSearch}
            />
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Nombre Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Nº Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Teléfono
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredClientes.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {cliente.nombreCliente}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {cliente.numeroCliente || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {cliente.contacto || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {cliente.email || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {cliente.telefono || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredClientes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No hay clientes que mostrar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
