# Sistema de Autenticación - IRIS

## Descripción General

Este documento describe la implementación del sistema de autenticación integrado con la base de datos PostgreSQL (Supabase).

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │  AuthProvider │  │   AuthGuard   │  │   useAuth()   │       │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘       │
│          │                  │                  │                │
│          └──────────────────┼──────────────────┘                │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │   authStore.ts  │                          │
│                    │    (Zustand)    │                          │
│                    └────────┬────────┘                          │
├─────────────────────────────┼───────────────────────────────────┤
│                     ┌───────▼───────┐                           │
│                     │  API Routes   │                           │
│                     ├───────────────┤                           │
│                     │ /api/auth/    │                           │
│                     │  ├─ login     │                           │
│                     │  ├─ logout    │                           │
│                     │  ├─ register  │                           │
│                     │  ├─ me        │                           │
│                     │  └─ refresh   │                           │
│                     └───────┬───────┘                           │
├─────────────────────────────┼───────────────────────────────────┤
│                    ┌────────▼────────┐                          │
│                    │  Supabase Admin │                          │
│                    │    (server.ts)  │                          │
│                    └────────┬────────┘                          │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                     ┌────────▼────────┐
                     │   PostgreSQL    │
                     │   (Supabase)    │
                     └─────────────────┘
```

## Componentes Implementados

### 1. Base de Datos (`database/migrations/`)

#### `001_auth_system.sql`

Tablas creadas:

- `account_users` - Información de usuarios
- `auth_sessions` - Sesiones activas
- `auth_refresh_tokens` - Tokens de renovación
- `auth_password_resets` - Solicitudes de reset de contraseña
- `auth_email_verifications` - Verificaciones de email
- `auth_login_history` - Historial de inicios de sesión
- `auth_oauth_providers` - Proveedores OAuth vinculados
- `user_permissions` - Permisos específicos por usuario

#### `002_seed_test_user.sql`

Usuario de prueba para desarrollo:

- Email: `fernando.suarez@ecosdeliderazgo.com`
- Password: `220626EaFy`
- Rol: `super_admin`

### 2. Backend (API Routes)

#### `/api/auth/login` (POST)

- Valida credenciales
- Verifica estado de cuenta (bloqueada, suspendida)
- Genera tokens JWT (access + refresh)
- Crea sesión en BD
- Registra en historial de login

#### `/api/auth/logout` (POST)

- Revoca sesión en BD
- Marca tokens como inválidos

#### `/api/auth/register` (POST)

- Valida datos de entrada
- Verifica unicidad de email/username
- Hashea contraseña
- Crea usuario en BD
- Genera tokens JWT

#### `/api/auth/me` (GET)

- Valida token de acceso
- Retorna datos del usuario autenticado
- Actualiza `last_activity_at`

#### `/api/auth/refresh` (POST)

- Valida refresh token
- Genera nuevos tokens
- Revoca sesión anterior
- Crea nueva sesión

### 3. Utilidades de Autenticación (`src/lib/auth/`)

#### `password.ts`

```typescript
hashPassword(password: string): Promise<string>
verifyPassword(password: string, storedHash: string): Promise<boolean>
```

- Soporta PBKDF2 (nuevo) y bcrypt (legacy)
- Compatible con Edge Runtime

#### `jwt.ts`

```typescript
generateTokenPair(user: AccountUser): Promise<TokenPair>
verifyToken(token: string): Promise<JWTPayload | null>
hashToken(token: string): Promise<string>
```

- Access token: 1 hora
- Refresh token: 7 días
- Firmados con HMAC-SHA256

### 4. Cliente Supabase (`src/lib/supabase/server.ts`)

```typescript
export const supabaseAdmin = createClient(url, serviceRoleKey);
```

- Usa `service_role` key para acceso completo
- No usa RLS (seguridad a nivel de aplicación)

### 5. Frontend State Management

#### `authStore.ts` (Zustand)

```typescript
// Estado
user: User | null
isAuthenticated: boolean
isLoading: boolean
isInitialized: boolean
error: string | null

// Acciones
login(credentials): Promise<void>
register(data): Promise<void>
logout(): Promise<void>
refreshToken(): Promise<boolean>
fetchCurrentUser(): Promise<void>
initialize(): Promise<void>
```

#### `useAuth.ts` (Hook)

- Wrapper sobre authStore
- Inicializa sesión automáticamente al montar
- Expone estado y acciones de autenticación

### 6. Componentes de Protección

#### `AuthProvider.tsx`

- Context provider para toda la app
- Inicializa sesión al cargar
- Refresh automático antes de expiración (cada 5 min)

#### `AuthGuard.tsx`

- Protege rutas que requieren autenticación
- Redirige a login si no autenticado
- Redirige a dashboard si autenticado en rutas públicas
- Soporte para verificación de roles

### 7. Middleware (`middleware.ts`)

- Protección a nivel de servidor
- Verifica tokens antes de servir páginas
- Diferencia rutas públicas/protegidas/admin
- Maneja expiración de tokens

### 8. API Client (`src/lib/api/client.ts`)

```typescript
api.get<T>(endpoint, config?)
api.post<T>(endpoint, body?, config?)
api.put<T>(endpoint, body?, config?)
api.patch<T>(endpoint, body?, config?)
api.delete<T>(endpoint, config?)
```

- Añade Authorization header automáticamente
- Renueva tokens en respuestas 401
- Evita refresh simultáneos

## Variables de Entorno Requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# JWT
JWT_SECRET=xxx-secret-key-change-in-production
```

## Uso

### En el Layout Principal

```tsx
import { AuthProvider } from "@/features/auth";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### Proteger una Página

```tsx
import { AuthGuard } from "@/features/auth";

export default function DashboardPage() {
  return (
    <AuthGuard allowedRoles={["admin", "user"]}>
      <DashboardContent />
    </AuthGuard>
  );
}
```

### Usar el Hook de Auth

```tsx
import { useAuth } from "@/features/auth";

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <h1>Bienvenido, {user?.name}</h1>;
}
```

### Hacer Peticiones Autenticadas

```tsx
import { api } from "@/lib/api/client";

async function fetchData() {
  const { data, error } = await api.get("/api/some-endpoint");
  if (error) {
    console.error(error);
    return;
  }
  return data;
}
```

## Seguridad

- Contraseñas hasheadas con PBKDF2 (100k iteraciones) o bcrypt
- Tokens firmados con HMAC-SHA256
- Tokens almacenados hasheados en BD
- Bloqueo de cuenta tras 5 intentos fallidos (15 min)
- Refresh tokens con rotación (revocar al usar)
- Historial completo de logins
- Soporte para revocar todas las sesiones

## TODOs Pendientes

- [ ] Verificación de email
- [ ] Reset de contraseña
- [ ] 2FA/MFA
- [ ] OAuth (Google, Microsoft)
- [ ] Logout de todas las sesiones
- [ ] Gestión de sesiones activas
