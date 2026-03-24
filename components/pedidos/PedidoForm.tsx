'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Pedido, formatDateForInput } from '@/lib/utils'

interface PedidoFormProps {
  pedido?: Partial<Pedido>
  clientes?: Array<{ id: number; nombreCliente: string; numeroCliente: string }>
  onSubmit: (data: Partial<Pedido>) => Promise<void>
  loading?: boolean
}

const CATEGORIAS = [
  { value: 'NORMALIZADOS', label: 'Normalizados' },
  { value: 'CHAPAS', label: 'Chapas' },
  { value: 'CARPINTERÍA', label: 'Carpintería' },
  { value: 'COMPOSITE', label: 'Composite' },
  { value: 'MINIONDA', label: 'Minionda' },
  { value: 'DEPLOYE', label: 'Deploye' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
  { value: 'ACCESORIOS', label: 'Accesorios' },
  { value: 'CARROCERÍA', label: 'Carrocería' },
  { value: 'TRAPEZOIDAL', label: 'Trapezoidal' },
]

const ACABADOS = [
  { value: 'LACADO', label: 'Lacado' },
  { value: 'ANODIZADO', label: 'Anodizado' },
  { value: 'S/A', label: 'S/A' },
]

const ORIGENES = [
  { value: 'PROVEEDOR', label: 'Proveedor' },
  { value: 'STOCK MURCIA', label: 'Stock Murcia' },
  { value: 'STOCK VALENCIA', label: 'Stock Valencia' },
]

const ALMACENES = [
  { value: 'MURCIA', label: 'Murcia' },
  { value: 'TARRAGONA', label: 'Tarragona' },
  { value: 'VALENCIA', label: 'Valencia' },
]

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

const TIPOS_SALIDA = [
  { value: 'FRIO', label: 'Frío' },
  { value: 'RPT', label: 'RPT' },
  { value: 'EXTRUSION', label: 'Extrusión' },
  { value: 'CHAPAS', label: 'Chapas' },
  { value: 'PANEL', label: 'Panel' },
  { value: 'ACCESORIOS', label: 'Accesorios' },
]

const INCIDENCIAS_MATERIAL = [
  { value: 'NO', label: 'No' },
  { value: 'SÍ', label: 'Sí' },
]

const defaultFormData: Partial<Pedido> = {
  numeroPedido:       '',
  tipoSalida:         '',
  fechaPedido:        '',
  numeroCliente:      '',
  codigoComercial:    '',
  cliente:            '',
  categoria:          '',
  referenciaProducto: '',
  acabado:            '',
  color:              '',
  docSalida:          '',
  proveedor:          '',
  origenMaterial:     '',
  almacen:            '',
  urgente:            '',
  incidenciaMaterial: 'NO',
  estadoPedido:       'SIN PEDIDO DE COMPRA',
  comentarios:        '',
  fechaSalida:        '',
  fechaPlanning:      '',
  fechaTerminado:     '',
  fechaCargaCamion:   '',
  fechaEnTarragona:   '',
  fechaEntregaCliente: '',
}

export function PedidoForm({ pedido, clientes = [], onSubmit, loading = false }: PedidoFormProps) {
  const [formData, setFormData] = useState<Partial<Pedido>>(
    pedido ? { ...defaultFormData, ...pedido } : defaultFormData
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked ? 'URGENTE' : '' }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">

      {/* Identificación */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Identificación</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Número de Pedido *"
            name="numeroPedido"
            value={formData.numeroPedido || ''}
            onChange={handleChange}
            required
            disabled={!!pedido?.id}
            placeholder="V26-01234"
          />
          <Select
            label="Tipo Salida"
            name="tipoSalida"
            value={formData.tipoSalida || ''}
            onChange={handleChange}
            options={TIPOS_SALIDA}
            placeholder="Selecciona tipo"
          />
          <Input
            label="Fecha Pedido"
            name="fechaPedido"
            type="date"
            value={formatDateForInput(formData.fechaPedido || null)}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Cliente */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Cliente</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Nº Cliente"
            name="numeroCliente"
            value={formData.numeroCliente || ''}
            onChange={handleChange}
            placeholder="0095"
          />
          <Input
            label="Nombre Cliente *"
            name="cliente"
            value={formData.cliente || ''}
            onChange={handleChange}
            required
            placeholder="Nombre del cliente"
          />
          <Input
            label="Comercial"
            name="codigoComercial"
            value={formData.codigoComercial || ''}
            onChange={handleChange}
            placeholder="30, 80..."
          />
        </div>
      </div>

      {/* Producto */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Producto</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Categoría"
            name="categoria"
            value={formData.categoria || ''}
            onChange={handleChange}
            options={CATEGORIAS}
            placeholder="Selecciona categoría"
          />
          <Select
            label="Acabado"
            name="acabado"
            value={formData.acabado || ''}
            onChange={handleChange}
            options={ACABADOS}
            placeholder="Selecciona acabado"
          />
          <Input
            label="Color"
            name="color"
            value={formData.color || ''}
            onChange={handleChange}
            placeholder="7042 MATE..."
          />
          <Input
            label="Referencia Producto"
            name="referenciaProducto"
            value={formData.referenciaProducto || ''}
            onChange={handleChange}
            placeholder="Referencia técnica"
          />
          <Input
            label="Doc. Salida"
            name="docSalida"
            value={formData.docSalida || ''}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Material y Logística */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Material y Logística</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Origen Material"
            name="origenMaterial"
            value={formData.origenMaterial || ''}
            onChange={handleChange}
            options={ORIGENES}
            placeholder="Selecciona origen"
          />
          <Input
            label="Proveedor"
            name="proveedor"
            value={formData.proveedor || ''}
            onChange={handleChange}
            placeholder="Nombre del proveedor"
          />
          <Select
            label="Almacén"
            name="almacen"
            value={formData.almacen || ''}
            onChange={handleChange}
            options={ALMACENES}
            placeholder="Selecciona almacén"
          />
        </div>
      </div>

      {/* Estado */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Estado</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Estado del Pedido"
            name="estadoPedido"
            value={formData.estadoPedido || 'SIN PEDIDO DE COMPRA'}
            onChange={handleChange}
            options={ESTADOS}
          />
          <Select
            label="Incidencia Material"
            name="incidenciaMaterial"
            value={formData.incidenciaMaterial || 'NO'}
            onChange={handleChange}
            options={INCIDENCIAS_MATERIAL}
          />
          <div className="flex items-center gap-3 mt-6">
            <input
              type="checkbox"
              id="urgente"
              name="urgente"
              checked={formData.urgente === 'URGENTE'}
              onChange={handleChange}
              className="w-4 h-4 rounded border-gray-300 accent-red-500"
            />
            <label htmlFor="urgente" className="text-sm font-semibold text-red-700">
              🚨 URGENTE
            </label>
          </div>
        </div>
      </div>

      {/* Fechas del Proceso */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Fechas del Proceso</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="1. Fecha Salida"
            name="fechaSalida"
            type="date"
            value={formatDateForInput(formData.fechaSalida || null)}
            onChange={handleChange}
          />
          <Input
            label="2. Fecha Planning"
            name="fechaPlanning"
            type="date"
            value={formatDateForInput(formData.fechaPlanning || null)}
            onChange={handleChange}
          />
          <Input
            label="3. Fecha Terminado"
            name="fechaTerminado"
            type="date"
            value={formatDateForInput(formData.fechaTerminado || null)}
            onChange={handleChange}
          />
          <Input
            label="4. Fecha Carga Camión"
            name="fechaCargaCamion"
            type="date"
            value={formatDateForInput(formData.fechaCargaCamion || null)}
            onChange={handleChange}
          />
          <Input
            label="5. Fecha En Tarragona"
            name="fechaEnTarragona"
            type="date"
            value={formatDateForInput(formData.fechaEnTarragona || null)}
            onChange={handleChange}
          />
          <Input
            label="6. Fecha Entrega Cliente"
            name="fechaEntregaCliente"
            type="date"
            value={formatDateForInput(formData.fechaEntregaCliente || null)}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Comentarios */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Comentarios</label>
        <textarea
          name="comentarios"
          value={formData.comentarios || ''}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Notas y observaciones..."
        />
      </div>

      {/* Botones */}
      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : pedido?.id ? 'Actualizar Pedido' : 'Crear Pedido'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => window.history.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
