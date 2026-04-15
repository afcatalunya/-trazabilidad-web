import { sql } from 'drizzle-orm'
import { text, integer, sqliteTable as table } from 'drizzle-orm/sqlite-core'

// ─── USUARIOS ────────────────────────────────────────────────────────────────
export const usuarios = table('usuarios', {
  id:                 integer('id').primaryKey({ autoIncrement: true }),
  nombre:             text('nombre').notNull(),
  email:              text('email').notNull().unique(),
  password:           text('password').notNull(),
  rol:                text('rol').default('USUARIO'),           // ADMIN | USUARIO
  activo:             integer('activo').default(1),
  fechaCreacion:      text('fecha_creacion').default(sql`(datetime('now'))`),
  fechaActualizacion: text('fecha_actualizacion').default(sql`(datetime('now'))`),
})

// ─── CLIENTES ────────────────────────────────────────────────────────────────
export const clientes = table('clientes', {
  id:              integer('id').primaryKey({ autoIncrement: true }),
  numeroCliente:   text('numero_cliente').notNull().unique(),   // 0070, 8178
  nombreCliente:   text('nombre_cliente').notNull(),
  codigoComercial: text('codigo_comercial'),
  contacto:        text('contacto'),
  telefono:        text('telefono'),
  email:           text('email'),
  activo:          integer('activo').default(1),
  createdAt:       text('created_at').default(sql`(datetime('now'))`),
})

// ─── PEDIDOS ─────────────────────────────────────────────────────────────────
// Nota: numero_pedido NO es único — un pedido puede tener varias líneas (tipo_salida)
export const pedidos = table('pedidos', {
  id:                   integer('id').primaryKey({ autoIncrement: true }),
  numeroPedido:         text('numero_pedido').notNull(),
  tipoSalida:           text('tipo_salida'),                    // FRIO | RPT | EXTRUSION | CHAPAS...
  fechaPedido:          text('fecha_pedido'),
  numeroCliente:        text('numero_cliente'),
  codigoComercial:      text('codigo_comercial'),
  cliente:              text('cliente').notNull(),              // Nombre del cliente (texto directo)
  categoria:            text('categoria'),
  referenciaProducto:   text('referencia_producto'),
  acabado:              text('acabado'),
  color:                text('color'),
  docSalida:            text('doc_salida'),
  proveedor:            text('proveedor'),
  origenMaterial:       text('origen_material'),
  fechaSalida:          text('fecha_salida'),
  fechaPlanning:        text('fecha_planning'),
  fechaTerminado:       text('fecha_terminado'),
  fechaCargaCamion:     text('fecha_carga_camion'),
  fechaEnTarragona:     text('fecha_en_tarragona'),
  fechaEntregaCliente:  text('fecha_entrega_cliente'),
  estadoPedido:         text('estado_pedido').default('SIN PEDIDO DE COMPRA'),
  incidenciaMaterial:   text('incidencia_material').default('NO'),
  urgente:              text('urgente').default(''),            // '' = normal | 'URGENTE'
  almacen:              text('almacen'),                        // MURCIA | TARRAGONA | VALENCIA
  comentarios:          text('comentarios'),
  numComentarios:       integer('num_comentarios').default(0),
  pdfAdjunto:           text('pdf_adjunto'),                    // URL Vercel Blob del PDF original
  createdAt:            text('created_at').default(sql`(datetime('now'))`),
  updatedAt:            text('updated_at').default(sql`(datetime('now'))`),
})

// ─── COMENTARIOS ─────────────────────────────────────────────────────────────
export const comentarios = table('comentarios', {
  id:              integer('id').primaryKey({ autoIncrement: true }),
  numeroPedido:    text('numero_pedido').notNull(),
  tipoSalida:      text('tipo_salida'),
  texto:           text('texto').notNull(),
  tipoNota:        text('tipo_nota').default('NOTA'),
  fechaComentario: text('fecha_comentario').default(sql`(datetime('now'))`),
  usuario:         text('usuario'),
})

// ─── INCIDENCIAS ─────────────────────────────────────────────────────────────
export const incidencias = table('incidencias', {
  id:                  integer('id').primaryKey({ autoIncrement: true }),
  numeroPedido:        text('numero_pedido').notNull(),
  tipoSalida:          text('tipo_salida'),
  fechaIncidencia:     text('fecha_incidencia'),
  tipoIncidencia:      text('tipo_incidencia'),
  descripcion:         text('descripcion'),
  estadoIncidencia:    text('estado_incidencia').default('ABIERTA'),
  fechaResolucion:     text('fecha_resolucion'),
  comentarios:         text('comentarios'),
  // Campos nuevos — todos opcionales para no romper datos existentes
  foto:                text('foto'),                  // URL imagen en Vercel Blob
  accionesRealizadas:  text('acciones_realizadas'),   // Obligatorio al cambiar estado (validado en UI)
  ultimoCambioEstado:  text('ultimo_cambio_estado'),  // ISO datetime, para alerta 5 días
  createdAt:           text('created_at').default(sql`(datetime('now'))`),
  updatedAt:           text('updated_at').default(sql`(datetime('now'))`),
})

// ─── HISTORIAL ───────────────────────────────────────────────────────────────
export const historial = table('historial', {
  id:              integer('id').primaryKey({ autoIncrement: true }),
  numeroPedido:    text('numero_pedido').notNull(),
  tipoSalida:      text('tipo_salida'),
  fechaMovimiento: text('fecha_movimiento').default(sql`(datetime('now'))`),
  usuario:         text('usuario'),
  accion:          text('accion'),
  detalle:         text('detalle'),
  estadoAnterior:  text('estado_anterior'),
  estadoNuevo:     text('estado_nuevo'),
})
