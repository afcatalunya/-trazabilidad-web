# Guía Rápida de Configuración

## Paso 1: Obtener credenciales de Turso

1. Ve a https://turso.tech/
2. Crea una cuenta y un proyecto
3. Crea una base de datos
4. Obtén la URL de la base de datos y el auth token

## Paso 2: Configurar variables de entorno

Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:

```
TURSO_DATABASE_URL=libsql://nombre-db-xxxxxxxxxxxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZExBU1M...
NEXTAUTH_SECRET=<genera con: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

Para generar NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Paso 3: Instalar dependencias

```bash
npm install
```

## Paso 4: Crear la base de datos

```bash
npm run db:push
```

## Paso 5: Crear usuario administrador

```bash
npm run db:seed
```

Credenciales:
- Email: `dani@extrucolor.es`
- Contraseña: `Extrucolor2024!`

## Paso 6: (Opcional) Importar datos Excel

Si tienes los archivos en el directorio padre:

```bash
npm run db:import
```

Archivos esperados:
- `PEDIDOS_PARA_SHAREPOINT.xlsx`
- `CLIENTES_PARA_SHAREPOINT.xlsx`

## Paso 7: Iniciar la aplicación

```bash
npm run dev
```

La app estará en: http://localhost:3000

## Iniciar sesión

Use las credenciales del administrador creadas en el paso 5.

## Archivos clave

| Archivo | Descripción |
|---------|-------------|
| `.env.local` | Variables de entorno (NO subir a git) |
| `lib/db.ts` | Conexión a la base de datos |
| `lib/schema.ts` | Esquema de tablas |
| `lib/auth.ts` | Configuración NextAuth |
| `lib/utils.ts` | Funciones auxiliares |
| `app/api/` | Rutas API REST |
| `app/(dashboard)/` | Páginas del dashboard |
| `components/` | Componentes React |
| `scripts/seed.ts` | Script de inicialización |
| `scripts/import-excel.ts` | Script de importación |

## Comandos útiles

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm run start

# Base de datos
npm run db:push      # Sincronizar esquema
npm run db:studio    # Abrir Drizzle Studio
npm run db:seed      # Crear usuario admin
npm run db:import    # Importar datos Excel
```

## Solución de problemas

### "Conexión rechazada a base de datos"
- Verifica TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en .env.local
- Asegúrate de que la base de datos existe en Turso

### "Usuario no encontrado al iniciar sesión"
- Ejecuta `npm run db:seed` para crear el usuario admin

### "Archivos Excel no encontrados"
- Los archivos deben estar en el directorio padre de trazabilidad-web
- Nombres exactos: `PEDIDOS_PARA_SHAREPOINT.xlsx` y `CLIENTES_PARA_SHAREPOINT.xlsx`

## Estructura de directorios

```
trazabilidad-web/
├── app/
│   ├── (auth)/               # Login
│   ├── (dashboard)/          # Páginas protegidas
│   │   ├── pedidos/         # Gestión de pedidos
│   │   ├── clientes/        # Gestión de clientes
│   │   ├── incidencias/     # Incidencias
│   │   ├── informes/        # Reportes
│   │   └── admin/           # Panel admin
│   └── api/                 # API REST
├── components/              # Componentes React
├── lib/                    # Código compartido
├── scripts/                # Scripts de setup
├── package.json            # Dependencias
└── tsconfig.json          # Configuración TS
```

## Lenguaje

Toda la interfaz está en ESPAÑOL, incluyendo:
- Etiquetas de formularios
- Botones
- Mensajes
- Menús

## Stack tecnológico

- **Frontend**: Next.js 14 + React 18 + TypeScript
- **Base de datos**: Turso (SQLite serverless)
- **ORM**: Drizzle ORM
- **Autenticación**: NextAuth.js v5
- **Estilos**: Tailwind CSS 3
- **Otros**: bcryptjs, xlsx

## Soporte

Consulta el archivo `README.md` para documentación completa.
