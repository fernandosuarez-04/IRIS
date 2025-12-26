# 🌟 IRIS - Plataforma Educativa con IA

> Plataforma educativa moderna con inteligencia artificial integrada para una experiencia de aprendizaje personalizada.

## 📋 Tabla de Contenidos

- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación)
- [Desarrollo](#-desarrollo)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Variables de Entorno](#-variables-de-entorno)

## 🛠 Stack Tecnológico

### Frontend (apps/web)
- **Next.js 16** - Framework React
- **React 18** - Biblioteca UI
- **TypeScript 5** - Tipado estático
- **TailwindCSS 3** - Estilos utilitarios
- **Zustand** - Gestión de estado
- **Framer Motion** - Animaciones
- **Axios** - Cliente HTTP

### Backend (apps/api)
- **Express 4** - Framework HTTP
- **TypeScript 5** - Tipado estático
- **Zod** - Validación de esquemas
- **Supabase** - Base de datos y Auth
- **Helmet** - Seguridad HTTP

### Packages Compartidos
- **@iris/shared** - Tipos, constantes y utilidades

## 📐 Arquitectura

Este proyecto sigue la **Screaming Architecture**:

```
IRIS/
├── apps/
│   ├── web/                 # Frontend Next.js
│   │   └── src/
│   │       ├── app/         # App Router
│   │       ├── features/    # Features del negocio
│   │       ├── shared/      # Componentes UI
│   │       └── core/        # Services y Stores
│   │
│   └── api/                 # Backend Express
│       └── src/
│           ├── features/    # Features del negocio
│           ├── core/        # Middleware y Config
│           └── shared/      # Tipos compartidos
│
└── packages/
    └── shared/              # Código compartido
```

## 🚀 Instalación

### Requisitos
- Node.js >= 22.0.0
- npm >= 10.5.1

### Pasos

1. **Instalar dependencias del monorepo:**
```bash
npm install
```

2. **Configurar variables de entorno:**
```bash
# Frontend
cp apps/web/.env.example apps/web/.env.local

# Backend
cp apps/api/.env.example apps/api/.env
```

3. **Editar los archivos .env con tus valores**

## 💻 Desarrollo

### Iniciar todo (Frontend + Backend):
```bash
npm run dev
```

### Iniciar por separado:
```bash
# Frontend (http://localhost:3000)
npm run dev:web

# Backend (http://localhost:4000)
npm run dev:api
```

### Verificar que funciona:
```bash
# Frontend
curl http://localhost:3000

# Backend
curl http://localhost:4000/health
```

## 📁 Estructura del Proyecto

### Frontend (apps/web/src)

| Carpeta | Descripción |
|---------|-------------|
| `app/` | Next.js App Router (páginas y layouts) |
| `features/` | Features de negocio (auth, users, etc.) |
| `shared/` | Componentes UI reutilizables |
| `core/` | Services y Stores globales |

### Backend (apps/api/src)

| Carpeta | Descripción |
|---------|-------------|
| `features/` | Features de negocio (auth, users, etc.) |
| `core/` | Middleware, config y utils |
| `shared/` | Tipos y constantes |

## 🔐 Variables de Entorno

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SUPABASE_URL=tu-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-key
```

### Backend (.env)
```env
PORT=4000
JWT_SECRET=tu-secret
SUPABASE_URL=tu-url
SUPABASE_SERVICE_ROLE_KEY=tu-key
```

## 📜 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia frontend y backend |
| `npm run dev:web` | Solo frontend |
| `npm run dev:api` | Solo backend |
| `npm run build` | Build de producción |

---

Creado con ❤️ usando la arquitectura de **Aprende y Aplica**
