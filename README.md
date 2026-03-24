# Extrucolor - Trazabilidad Pedidos

Sistema web para la trazabilidad de pedidos de la empresa Extrucolor, desarrollado con Next.js 14, TypeScript, Turso (SQLite), Drizzle ORM y NextAuth.js v5.

## Características

- Gestión completa de pedidos con seguimiento de estado
- Sistema de clientes
- Registro de incidencias
- Sistema de comentarios
- Informes y estadísticas
- Autenticación segura con NextAuth.js
- Base de datos SQLite con Turso
- Interfaz responsiva con Tailwind CSS

## Requisitos

- Node.js 18+
- npm o yarn
- Cuenta en Turso (para la base de datos)

## Instalación

### 1. Clonar el repositorio y instalar dependencias

```bash
cd trazabilidad-web
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env.local` y rellena los valores:

```bash
cp .env.example .env.local
```

```
TURSO_DATABASE_URL=libsql://tu-base-de-datos.turso.io
TURSO_AUTH_TOKEN=tu-token-aqui
NEXTAUTH_SECRET=cadena-aleatoria-muy-larga-y-segura-minimo-32-caracteres
NEXTAUTH_URL=http://localhost:3000
```

Para generar un `NEXTAUTH_SECRET` seguro:
```bash
openssl rand -base64 32
```

### 3. Crear la base de datos

```bash
npm run db:push
```

### 4. Crear usuario administrador

```bash
npm run db:seed
```

Credenciales por defecto:
- Email: `dani@extrucolor.es`
- Contraseña: `Extrucolor2024!`
- Rol: ADMIN

### 5. (Opcional) Importar datos desde Excel

Si tienes archivos `PEDIDOS_PARA_SHAREPOINT.xlsx` y `CLIENTES_PARA_SHAREPOINT.xlsx` en el directorio padre:

```bash
npm run db:import
```

### 6. Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Scripts disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run db:push` - Sincroniza el esquema con la base de datos
- `npm run db:studio` - Abre Drizzle Studio para inspeccionar la BD
- `npm run db:seed` - Crea el usuario administrador inicial
- `npm run db:import` - Importa datos desde archivos Excel

## Estructura del Proyecto

```
trazabilidad-web/
├── app/
│   ├── (auth)/              # Páginas de autenticación
│   ├── (dashboard)/         # Páginas del dashboard protegidas
│   │   ├── pedidos/        # Gestión de pedidos
│   │   ├── clientes/       # Gestión de clientes
│   │   ├── incidencias/    # Gestión de incidencias
│   │   ├── informes/       # Reportes y estadísticas
│   │   └── admin/          # Panel administrativo
│   ├── api/                # Rutas API
│   ├── globals.css         # Estilos globales
│   └── layout.tsx          # Layout raíz
├── components/
│   ├── layout/             # Componentes de layout
│   ├── pedidos/            # Componentes relacionados con pedidos
│   └── ui/                 # Componentes reutilizables
├── lib/
│   ├── auth.ts            # Configuración NextAuth
│   ├── db.ts              # Conexión a la base de datos
│   ├── schema.ts          # Esquema Drizzle ORM
│   └── utils.ts           # Funciones utilitarias
├── scripts/
│   ├── seed.ts            # Script de seed
│   └── import-excel.ts    # Script de importación
└── middleware.ts          # Middleware de NextAuth
```

## Estados de Pedidos

Los pedidos pueden tener los siguientes estados:

1. **SIN PEDIDO DE COMPRA** - Pedido inicial sin compra
2. **EN PROCESO** - Hay fecha de salida
3. **PLANNING** - En etapa de planning
4. **PARA CARGAR MURCIA** - Listo para cargar en Murcia
5. **EN CAMION** - Cargado en camión
6. **EN ALMACÉN** - En almacén de Tarragona
7. **ENTREGADO** - Entregado al cliente
8. **ANULADO** - Pedido anulado

El estado se calcula automáticamente basado en las fechas completadas en el pedido.

## Categorías de Productos

- NORMALIZADOS
- CHAPAS
- CARPINTERÍA
- COMPOSITE
- MINIONDA
- DEPLOYE

## Acabados

- LACADO
- ANODIZADO
- S/A

## Almacenes

- MURCIA
- TARRAGONA
- VALENCIA

## Tecnologías utilizadas

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Turso** - Base de datos SQLite serverless
- **Drizzle ORM** - ORM para TypeScript
- **NextAuth.js v5** - Autenticación
- **Tailwind CSS** - Estilos CSS
- **bcryptjs** - Hash de contraseñas
- **xlsx** - Importación de archivos Excel

## Desarrollo

### Crear nuevos endpoints API

Los endpoints API se encuentran en `app/api/`. Cada endpoint debe:
- Verificar autenticación con `await auth()`
- Retornar errores apropiados
- Registrar cambios en la tabla `historial`

### Agregar nuevas páginas

Las páginas protegidas van en `app/(dashboard)/`. Todas heredan del layout que incluye Sidebar y Header.

### Componentes personalizados

Los componentes sin librerías externas de UI se encuentran en:
- `components/ui/` - Componentes reutilizables base
- `components/pedidos/` - Componentes específicos de pedidos
- `components/layout/` - Componentes de layout

## Notas importantes

- La aplicación está completamente en ESPAÑOL
- Los campos de fecha usan `type="date"` de HTML
- El sistema usa JWT para sesiones
- Las contraseñas se hashean con bcryptjs (10 rounds)
- Se mantiene historial de cambios en la tabla `historial`

## Licencia

Privado - Extrucolor
