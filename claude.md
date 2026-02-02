# IRIS - Documentacion Completa de Funciones

## Descripcion del Proyecto

**IRIS** es una plataforma educativa y de gestion de proyectos con inteligencia artificial integrada (ARIA), construida como un monorepo con:
- **Frontend**: Next.js 15/16 (App Router)
- **Backend**: Express 4 con TypeScript
- **Base de Datos**: PostgreSQL via Supabase
- **IA**: Google Gemini 2.0 Flash

---

## Estructura del Proyecto

```
IRIS/
├── apps/
│   ├── web/                    # Frontend Next.js
│   │   └── src/
│   │       ├── app/            # Pages y API Routes
│   │       ├── components/     # Componentes UI
│   │       ├── features/       # Modulos de negocio
│   │       ├── shared/         # Utilidades compartidas
│   │       ├── core/           # Stores y servicios
│   │       ├── lib/            # Integraciones externas
│   │       └── contexts/       # React Context
│   └── api/                    # Backend Express
│       └── src/
│           ├── core/           # Middlewares y config
│           └── features/       # Controladores y servicios
├── packages/
│   └── shared/                 # Tipos y utilidades compartidas
└── database/
    └── migrations/             # Scripts SQL
```

---

# FRONTEND (apps/web/src)

## 1. LIB - Integraciones Externas

### 1.1 AI - Integracion con Google Gemini

**Archivo:** `lib/ai/gemini.ts`

| Funcion | Descripcion | Parametros | Retorno |
|---------|-------------|------------|---------|
| `getGeminiClient()` | Obtiene instancia singleton del cliente GoogleGenerativeAI | Ninguno | `GoogleGenerativeAI` |
| `getGeminiModel()` | Obtiene el modelo generativo configurado | Ninguno | `GenerativeModel` |
| `generateText(prompt)` | Genera respuesta simple de texto | `prompt: string` | `Promise<string>` |
| `generateChatResponse(messages, systemPrompt?)` | Genera respuesta de chat (sin streaming) | `messages: ChatMessage[], systemPrompt?: string` | `Promise<string>` |
| `streamChatResponse(messages, systemPrompt?)` | Genera respuesta de chat con streaming | `messages: ChatMessage[], systemPrompt?: string` | `AsyncGenerator<string>` |
| `formatMessageParts(message)` | Formatea mensaje con attachments para Gemini | `message: ChatMessage` | `any[]` |

**Interfaces:**
```typescript
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: {
    mimeType: string;
    data: string; // Base64
  }[];
}
```

**Archivo:** `lib/ai/lia-agent.ts`

| Funcion/Constante | Descripcion | Parametros | Retorno |
|-------------------|-------------|------------|---------|
| `ARIA_SYSTEM_PROMPT` | Prompt del sistema para el agente ARIA | - | `string` |
| `getARIASystemPrompt(context?)` | Genera prompt personalizado con contexto | `context?: ARIAContext` | `string` |
| `ARIA_QUICK_RESPONSES` | Respuestas predefinidas (greeting, farewell, help) | - | `object` |

**Interfaces:**
```typescript
interface ARIAContext {
  userName?: string;
  userId?: string;
  userRole?: string;
  teamName?: string;
  teamId?: string;
  currentPage?: string;
  recentActions?: string[];
  tasks?: any[];
  projects?: any[];
  teamMembers?: any[];
}
```

---

### 1.2 Auth - Autenticacion

**Archivo:** `lib/auth/password.ts`

| Funcion | Descripcion | Parametros | Retorno |
|---------|-------------|------------|---------|
| `hashPassword(password)` | Genera hash seguro usando PBKDF2 | `password: string` | `Promise<string>` |
| `verifyPassword(password, storedHash)` | Verifica contrasena contra hash | `password: string, storedHash: string` | `Promise<boolean>` |
| `verifyPbkdf2Password(password, storedHash)` | Verifica contrasena PBKDF2 | `password: string, storedHash: string` | `Promise<boolean>` |
| `verifyBcryptPassword(password, storedHash)` | Verifica contrasena bcrypt (legacy) | `password: string, storedHash: string` | `Promise<boolean>` |

**Archivo:** `lib/auth/jwt.ts`

| Funcion | Descripcion | Parametros | Retorno |
|---------|-------------|------------|---------|
| `verifyToken(token)` | Verifica y decodifica JWT | `token: string` | `Promise<JWTPayload \| null>` |
| `generateTokenPair(user)` | Genera par de tokens (access + refresh) | `user: AccountUser` | `Promise<TokenPair>` |
| `hashToken(token)` | Hash de token para almacenamiento seguro | `token: string` | `Promise<string>` |
| `base64UrlEncode(str)` | Codifica string a Base64URL | `str: string` | `string` |
| `base64UrlDecode(str)` | Decodifica Base64URL a string | `str: string` | `string` |
| `createSignature(data)` | Crea firma HMAC-SHA256 | `data: string` | `Promise<string>` |
| `generateToken(payload, expiresIn)` | Genera token JWT individual | `payload: Omit<JWTPayload, 'iat'\|'exp'>, expiresIn: number` | `Promise<string>` |

**Interfaces:**
```typescript
interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  permissionLevel: string;
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

---

### 1.3 Supabase - Cliente de Base de Datos

**Archivo:** `lib/supabase/server.ts`

| Funcion | Descripcion | Parametros | Retorno |
|---------|-------------|------------|---------|
| `getSupabaseAdmin()` | Obtiene cliente Supabase con service role | Ninguno | `SupabaseClient` |
| `supabaseAdmin.from(table)` | Acceso a tablas | `table: string` | `PostgrestQueryBuilder` |
| `supabaseAdmin.rpc(fn, params)` | Llamada a funciones RPC | `fn: string, params: object` | `Promise` |
| `supabaseAdmin.storage.from(bucket)` | Acceso a storage | `bucket: string` | `StorageFileApi` |

**Tipos:**
```typescript
interface AccountUser {
  user_id: string;
  first_name: string;
  last_name_paternal: string;
  last_name_maternal: string | null;
  display_name: string | null;
  username: string;
  email: string;
  password_hash: string;
  permission_level: 'super_admin' | 'admin' | 'manager' | 'user' | 'viewer' | 'guest';
  company_role: string | null;
  department: string | null;
  account_status: 'active' | 'inactive' | 'suspended' | 'pending_verification' | 'deleted';
  is_email_verified: boolean;
  avatar_url: string | null;
  timezone: string;
  locale: string;
  created_at: string;
  updated_at: string;
}

interface AuthSession {
  session_id: string;
  user_id: string;
  token_hash: string;
  refresh_token_hash: string | null;
  is_active: boolean;
  expires_at: string;
}
```

---

### 1.4 Notifications - Sistema de Notificaciones

**Archivo:** `lib/notifications/notifier.ts`

| Funcion | Descripcion | Parametros | Retorno |
|---------|-------------|------------|---------|
| `sendNotification(payload)` | Envia notificacion a usuario especifico | `payload: NotificationPayload` | `Promise<boolean>` |
| `sendTeamNotification(teamId, payload)` | Envia notificacion a todos los miembros de un equipo | `teamId: string, payload: Omit<NotificationPayload, 'recipientId'>` | `Promise<boolean>` |

**Interfaces:**
```typescript
interface NotificationPayload {
  recipientId: string;
  actorId?: string;
  title: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  category?: 'task' | 'project' | 'team' | 'comment' | 'reminder' | 'system';
  entityId?: string;
  link?: string;
}
```

---

### 1.5 API Client

**Archivo:** `lib/api/client.ts`

| Funcion | Descripcion | Parametros | Retorno |
|---------|-------------|------------|---------|
| `apiClient<T>(endpoint, config?)` | Cliente API con manejo automatico de auth | `endpoint: string, config?: RequestConfig` | `Promise<ApiResponse<T>>` |
| `api.get<T>(endpoint, config?)` | GET request | `endpoint: string, config?: RequestConfig` | `Promise<ApiResponse<T>>` |
| `api.post<T>(endpoint, body?, config?)` | POST request | `endpoint: string, body?: unknown, config?: RequestConfig` | `Promise<ApiResponse<T>>` |
| `api.put<T>(endpoint, body?, config?)` | PUT request | `endpoint: string, body?: unknown, config?: RequestConfig` | `Promise<ApiResponse<T>>` |
| `api.patch<T>(endpoint, body?, config?)` | PATCH request | `endpoint: string, body?: unknown, config?: RequestConfig` | `Promise<ApiResponse<T>>` |
| `api.delete<T>(endpoint, config?)` | DELETE request | `endpoint: string, config?: RequestConfig` | `Promise<ApiResponse<T>>` |
| `refreshTokens()` | Renueva tokens automaticamente | Ninguno | `Promise<boolean>` |
| `getAccessToken()` | Obtiene token de localStorage | Ninguno | `string \| null` |
| `getRefreshToken()` | Obtiene refresh token de localStorage | Ninguno | `string \| null` |
| `setTokens(accessToken, refreshToken)` | Guarda tokens en localStorage | `accessToken: string, refreshToken: string` | `void` |
| `clearTokens()` | Limpia tokens de localStorage | Ninguno | `void` |

---

## 2. CORE - Estado Global y Servicios

### 2.1 Auth Store (Zustand)

**Archivo:** `core/stores/authStore.ts`

| Estado | Tipo | Descripcion |
|--------|------|-------------|
| `user` | `User \| null` | Usuario autenticado |
| `isAuthenticated` | `boolean` | Estado de autenticacion |
| `isLoading` | `boolean` | Cargando operacion |
| `isInitialized` | `boolean` | App inicializada |
| `error` | `string \| null` | Error actual |

| Accion | Descripcion | Parametros | Retorno |
|--------|-------------|------------|---------|
| `initialize()` | Inicializa sesion al cargar app | Ninguno | `Promise<void>` |
| `login(credentials)` | Inicia sesion | `{ email: string, password: string }` | `Promise<void>` |
| `register(data)` | Registra nuevo usuario | `RegisterData` | `Promise<void>` |
| `logout()` | Cierra sesion | Ninguno | `Promise<void>` |
| `refreshToken()` | Renueva tokens | Ninguno | `Promise<boolean>` |
| `fetchCurrentUser()` | Obtiene datos del usuario actual | Ninguno | `Promise<void>` |
| `clearError()` | Limpia error | Ninguno | `void` |
| `setUser(user)` | Establece usuario manualmente | `user: User \| null` | `void` |

---

### 2.2 API Service (Axios)

**Archivo:** `core/services/api.ts`

**Clase:** `ApiService`

| Metodo | Descripcion | Parametros | Retorno |
|--------|-------------|------------|---------|
| `get<T>(url, params?)` | GET request | `url: string, params?: Record<string, unknown>` | `Promise<T>` |
| `post<T>(url, data?)` | POST request | `url: string, data?: unknown` | `Promise<T>` |
| `put<T>(url, data?)` | PUT request | `url: string, data?: unknown` | `Promise<T>` |
| `patch<T>(url, data?)` | PATCH request | `url: string, data?: unknown` | `Promise<T>` |
| `delete<T>(url)` | DELETE request | `url: string` | `Promise<T>` |
| `setupInterceptors()` | Configura interceptores de auth | Ninguno | `void` |

---

## 3. SHARED - Utilidades y Componentes Reutilizables

### 3.1 Hooks Personalizados

**Archivo:** `shared/hooks/useDebounce.ts`

| Hook | Descripcion | Parametros | Retorno |
|------|-------------|------------|---------|
| `useDebounce<T>(value, delay?)` | Debounce de valores | `value: T, delay?: number (default 300)` | `T` |

**Archivo:** `shared/hooks/useLocalStorage.ts`

| Hook | Descripcion | Parametros | Retorno |
|------|-------------|------------|---------|
| `useLocalStorage<T>(key, initialValue)` | Persistencia en localStorage | `key: string, initialValue: T` | `[T, (value: T) => void]` |

**Archivo:** `shared/hooks/useMediaQuery.ts`

| Hook | Descripcion | Parametros | Retorno |
|------|-------------|------------|---------|
| `useMediaQuery(query)` | Detecta media query | `query: string` | `boolean` |
| `useIsMobile()` | Detecta mobile (< 768px) | Ninguno | `boolean` |
| `useIsTablet()` | Detecta tablet (769-1023px) | Ninguno | `boolean` |
| `useIsDesktop()` | Detecta desktop (>= 1024px) | Ninguno | `boolean` |

---

### 3.2 Utilidades

**Archivo:** `shared/utils/cn.ts`

| Funcion | Descripcion | Parametros | Retorno |
|---------|-------------|------------|---------|
| `cn(...inputs)` | Combina clases Tailwind (clsx + tailwind-merge) | `...inputs: ClassValue[]` | `string` |

---

## 4. CONTEXTS - React Context API

### 4.1 Theme Context

**Archivo:** `contexts/ThemeContext.tsx`

| Componente/Hook | Descripcion | Props/Retorno |
|-----------------|-------------|---------------|
| `ThemeProvider` | Proveedor de tema | `children: ReactNode` |
| `useTheme()` | Hook para acceder al tema | `{ theme: 'light'\|'dark', toggleTheme: () => void, isDark: boolean }` |
| `themeColors` | Colores del sistema SOFIA | `{ dark: {...}, light: {...} }` |

---

### 4.2 ARIA Context

**Archivo:** `contexts/ARIAContext.tsx`

| Componente/Hook | Descripcion | Props/Retorno |
|-----------------|-------------|---------------|
| `ARIAProvider` | Proveedor del estado de ARIA | `children: ReactNode` |
| `useARIA()` | Hook para controlar ARIA | `{ isOpen: boolean, openARIA: () => void, closeARIA: () => void, toggleARIA: () => void }` |
| `ARIA_PANEL_WIDTH` | Ancho del panel ARIA | `420` |

---

## 5. FEATURES - Modulos de Negocio

### 5.1 Auth Feature

**Archivo:** `features/auth/hooks/useAuth.ts`

| Hook | Descripcion | Retorno |
|------|-------------|---------|
| `useAuth()` | Hook principal de autenticacion | Estado + acciones del authStore |

**Retorno de `useAuth()`:**
```typescript
{
  // Estado
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Acciones
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastNamePaternal: string, email: string, password: string, username: string, lastNameMaternal?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshToken: () => Promise<boolean>;
  fetchCurrentUser: () => Promise<void>;
}
```

---

### 5.2 LIA/ARIA Feature - Asistente IA

**Archivo:** `features/lia/components/LIAChatWidget.tsx`

**Componente:** `LIAChatWidget` (alias: `ARIAChatWidget`)

| Prop | Tipo | Descripcion |
|------|------|-------------|
| `isOpen` | `boolean` | Estado de visibilidad |
| `onClose` | `() => void` | Callback al cerrar |
| `userName` | `string?` | Nombre del usuario |
| `userRole` | `string?` | Rol del usuario |
| `userId` | `string?` | ID del usuario |
| `teamId` | `string?` | ID del equipo |

**Funciones internas:**
| Funcion | Descripcion |
|---------|-------------|
| `toggleVoiceInput()` | Activa/desactiva dictado por voz |
| `handleFileSelect(event)` | Procesa archivo seleccionado |
| `removeAttachment(index)` | Elimina attachment por indice |
| `sendMessage(messageText?)` | Envia mensaje al API |
| `handleKeyPress(e)` | Maneja tecla Enter |
| `handleQuickAction(message)` | Ejecuta accion rapida |
| `clearConversation()` | Limpia conversacion |
| `scrollToBottom()` | Scroll al final de mensajes |

---

**Archivo:** `features/lia/components/LIAFloatingButton.tsx`

**Componente:** `LIAFloatingButton`

| Prop | Tipo | Descripcion |
|------|------|-------------|
| `userName` | `string?` | Nombre del usuario |
| `userRole` | `string?` | Rol del usuario |
| `userId` | `string?` | ID del usuario |
| `teamId` | `string?` | ID del equipo |

**Funciones internas:**
| Funcion | Descripcion |
|---------|-------------|
| `animate(currentTime)` | Animacion de rotacion del logo |
| `startAnimation()` | Inicia animacion |
| `handleMouseEnter()` | Inicia rotacion en hover |
| `handleMouseLeave()` | Detiene rotacion al salir |

---

### 5.3 Notifications Feature

**Archivo:** `features/notifications/NotificationCenter.tsx`

**Componente:** `NotificationCenter`

**Funciones internas:**
| Funcion | Descripcion |
|---------|-------------|
| `fetchNotifications()` | Obtiene notificaciones del servidor |
| `markAsRead(id)` | Marca notificacion como leida |
| `getIcon(type)` | Retorna icono segun tipo |

---

### 5.4 Dashboard Feature

**Archivo:** `features/dashboard/components/ARIAUsageWidget.tsx`

**Componente:** `ARIAUsageWidget`

| Prop | Tipo | Descripcion |
|------|------|-------------|
| `teamId` | `string?` | ID del equipo |
| `userId` | `string?` | ID del usuario |

**Funciones internas:**
| Funcion | Descripcion |
|---------|-------------|
| `fetchStats()` | Obtiene estadisticas de uso de ARIA |
| `formatNum(num)` | Formatea numeros grandes (k, M) |

---

### 5.5 Tools Feature

**Archivo:** `features/tools/FocusEnforcer.tsx`

**Componente:** `FocusEnforcer`

**Funciones internas:**
| Funcion | Descripcion |
|---------|-------------|
| `checkFocus()` | Verifica si hay sesion de enfoque activa |
| `formatTime(seconds)` | Formatea tiempo en mm:ss |

---

## 6. API ROUTES (Next.js)

### 6.1 Auth Routes

**Archivo:** `app/api/auth/login/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Inicia sesion |

**Funciones internas:**
| Funcion | Descripcion |
|---------|-------------|
| `mapPermissionToRole(level)` | Mapea permission_level a rol frontend |
| `detectDeviceType(userAgent)` | Detecta tipo de dispositivo |
| `detectBrowser(userAgent)` | Detecta navegador |

---

**Archivo:** `app/api/auth/register/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Registra nuevo usuario |

---

**Archivo:** `app/api/auth/logout/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `POST` | `/api/auth/logout` | Cierra sesion y revoca tokens |

---

**Archivo:** `app/api/auth/refresh/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `POST` | `/api/auth/refresh` | Renueva tokens |

---

**Archivo:** `app/api/auth/me/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/auth/me` | Obtiene usuario autenticado |

---

**Archivo:** `app/api/auth/change-password/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `POST` | `/api/auth/change-password` | Cambia contrasena |

---

### 6.2 AI Routes

**Archivo:** `app/api/lia/chat/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `POST` | `/api/lia/chat` | Chat con ARIA (streaming) |
| `GET` | `/api/lia/chat` | Health check |

**Request Body:**
```typescript
{
  messages: ChatMessage[];
  context?: ARIAContext;
  stream?: boolean;
}
```

---

**Archivo:** `app/api/ai/agile-advisor/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `POST` | `/api/ai/agile-advisor` | Recomienda metodologia agil |

**Request Body:**
```typescript
{
  content?: string;
  fileData?: string; // Base64
  mimeType?: string;
}
```

**Response:**
```typescript
{
  methodology: string;
  confidence: number;
  reasoning: string;
  pros: string[];
  cons: string[];
  tips: string[];
}
```

---

**Archivo:** `app/api/ai/diagram-generator/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `POST` | `/api/ai/diagram-generator` | Genera diagramas Mermaid |

---

**Archivo:** `app/api/ai/predictive-report/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `POST` | `/api/ai/predictive-report` | Genera reporte predictivo |

---

### 6.3 Admin Routes

**Archivo:** `app/api/admin/users/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/admin/users` | Lista usuarios |
| `POST` | `/api/admin/users` | Crea usuario |

---

**Archivo:** `app/api/admin/users/[id]/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/admin/users/:id` | Obtiene usuario |
| `PATCH` | `/api/admin/users/:id` | Actualiza usuario |
| `DELETE` | `/api/admin/users/:id` | Elimina usuario |

---

**Archivo:** `app/api/admin/teams/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/admin/teams` | Lista equipos |
| `POST` | `/api/admin/teams` | Crea equipo |

---

**Archivo:** `app/api/admin/teams/[teamId]/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/admin/teams/:teamId` | Obtiene equipo |
| `PATCH` | `/api/admin/teams/:teamId` | Actualiza equipo |
| `DELETE` | `/api/admin/teams/:teamId` | Elimina equipo |

---

**Archivo:** `app/api/admin/teams/[teamId]/members/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/admin/teams/:teamId/members` | Lista miembros |
| `POST` | `/api/admin/teams/:teamId/members` | Agrega miembro |

---

**Archivo:** `app/api/admin/teams/[teamId]/issues/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/admin/teams/:teamId/issues` | Lista tareas |
| `POST` | `/api/admin/teams/:teamId/issues` | Crea tarea |

---

**Archivo:** `app/api/admin/teams/[teamId]/statuses/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/admin/teams/:teamId/statuses` | Lista estados de tareas |

---

**Archivo:** `app/api/admin/teams/[teamId]/labels/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/admin/teams/:teamId/labels` | Lista etiquetas |
| `POST` | `/api/admin/teams/:teamId/labels` | Crea etiqueta |

---

**Archivo:** `app/api/admin/priorities/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/admin/priorities` | Lista prioridades |

---

**Archivo:** `app/api/admin/projects/[id]/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/admin/projects/:id` | Obtiene proyecto |
| `PATCH` | `/api/admin/projects/:id` | Actualiza proyecto |
| `DELETE` | `/api/admin/projects/:id` | Elimina proyecto |

---

**Archivo:** `app/api/admin/analytics/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/admin/analytics` | Obtiene metricas del dashboard |

---

### 6.4 Otras Routes

**Archivo:** `app/api/search/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/search?q=:query` | Busqueda global (proyectos, tareas, usuarios, equipos) |

---

**Archivo:** `app/api/notifications/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/notifications?userId=:id` | Lista notificaciones |

---

**Archivo:** `app/api/notifications/[id]/read/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `PATCH` | `/api/notifications/:id/read` | Marca como leida |

---

**Archivo:** `app/api/faqs/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/faqs` | Lista FAQs |

---

**Archivo:** `app/api/focus/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/focus?userId=:id` | Verifica sesion de enfoque activa |
| `POST` | `/api/focus` | Inicia sesion de enfoque |

---

**Archivo:** `app/api/aria/usage/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/aria/usage` | Estadisticas de uso de ARIA |

---

**Archivo:** `app/api/upload/avatar/route.ts`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `POST` | `/api/upload/avatar` | Sube avatar de usuario |

---

## 7. MIDDLEWARE

**Archivo:** `middleware.ts`

| Funcion | Descripcion |
|---------|-------------|
| `middleware(request)` | Middleware de proteccion de rutas |

**Constantes:**
| Constante | Descripcion |
|-----------|-------------|
| `PUBLIC_PATHS` | Rutas que no requieren autenticacion |
| `GUEST_ONLY_PATHS` | Rutas solo para invitados |
| `ADMIN_PATHS` | Rutas que requieren rol admin |

**Logica:**
1. Permite archivos estaticos
2. Permite rutas publicas
3. Verifica token JWT en cookie o header
4. Valida expiracion del token
5. Verifica permisos de admin si aplica
6. Redirige usuarios autenticados fuera de rutas guest-only

---

# BACKEND (apps/api/src)

## 1. Server Principal

**Archivo:** `server.ts`

| Funcion/Config | Descripcion |
|----------------|-------------|
| `app` | Instancia de Express |
| `helmet()` | Middleware de seguridad |
| `cors()` | Configuracion CORS |
| `limiter` | Rate limiting (100 req/15min) |
| `morgan()` | Logging de requests |
| `compression()` | Compresion gzip |
| `cookieParser()` | Parser de cookies |
| `errorHandler` | Manejador global de errores |

**Endpoints:**
| Endpoint | Descripcion |
|----------|-------------|
| `GET /health` | Health check |
| `/api/v1/auth/*` | Rutas de autenticacion |
| `/api/v1/users/*` | Rutas de usuarios |

---

## 2. Core - Middlewares

### 2.1 Error Handler

**Archivo:** `core/middleware/errorHandler.ts`

| Funcion/Clase | Descripcion | Parametros | Retorno |
|---------------|-------------|------------|---------|
| `AppError` | Clase de error personalizada | `message, statusCode, code` | - |
| `createError(message, statusCode, code)` | Factory de AppError | `message: string, statusCode: number, code: string` | `AppError` |
| `errorHandler(err, req, res, next)` | Middleware global de errores | Express params | `void` |
| `asyncHandler(fn)` | Wrapper para async/await | `fn: AsyncFunction` | `RequestHandler` |

---

### 2.2 Auth Middleware

**Archivo:** `core/middleware/auth.middleware.ts`

| Funcion | Descripcion | Parametros |
|---------|-------------|------------|
| `authenticate(req, res, next)` | Verifica JWT en Authorization header | Express params |
| `authorize(...allowedRoles)` | Middleware de autorizacion por roles | `...allowedRoles: string[]` |

---

## 3. Features - Auth

### 3.1 Auth Controller

**Archivo:** `features/auth/auth.controller.ts`

**Clase:** `AuthController`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `login` | `POST /auth/login` | Inicia sesion |
| `register` | `POST /auth/register` | Registra usuario |
| `refreshToken` | `POST /auth/refresh` | Renueva tokens |
| `logout` | `POST /auth/logout` | Cierra sesion |
| `getMe` | `GET /auth/me` | Obtiene usuario actual |

---

### 3.2 Auth Service

**Archivo:** `features/auth/auth.service.ts`

**Clase:** `AuthService`

| Metodo | Descripcion | Parametros | Retorno |
|--------|-------------|------------|---------|
| `login(credentials)` | Login con email y password | `{ email, password }` | `Promise<{ user, accessToken, refreshToken }>` |
| `register(data)` | Registra nuevo usuario | `{ name, email, password }` | `Promise<{ user, accessToken, refreshToken }>` |
| `refreshToken(refreshToken)` | Renueva access token | `refreshToken: string` | `Promise<AuthTokens>` |
| `logout(userId)` | Invalida sesion | `userId: string` | `Promise<void>` |

---

## 4. Features - Users

### 4.1 Users Controller

**Archivo:** `features/users/users.controller.ts`

**Clase:** `UsersController`

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `getAll` | `GET /users` | Lista usuarios |
| `getById` | `GET /users/:id` | Obtiene usuario |
| `update` | `PATCH /users/:id` | Actualiza usuario |
| `delete` | `DELETE /users/:id` | Elimina usuario |

---

### 4.2 Users Service

**Archivo:** `features/users/users.service.ts`

**Clase:** `UsersService`

| Metodo | Descripcion | Parametros | Retorno |
|--------|-------------|------------|---------|
| `getAll()` | Obtiene todos los usuarios | Ninguno | `Promise<User[]>` |
| `getById(id)` | Obtiene usuario por ID | `id: string` | `Promise<User>` |
| `update(id, data)` | Actualiza usuario | `id: string, data: UpdateUserInput` | `Promise<User>` |
| `delete(id)` | Elimina usuario | `id: string` | `Promise<void>` |

---

# PAQUETE COMPARTIDO (packages/shared/src)

## 1. Tipos

**Archivo:** `types/index.ts`

### Interfaces

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
```

### Enums

```typescript
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}
```

---

## 2. Constantes

**Archivo:** `constants/index.ts`

### HTTP Status Codes

```typescript
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};
```

### Error Codes

```typescript
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
};
```

### API Endpoints

```typescript
const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',
  USERS: '/users',
  USER_BY_ID: (id: string) => `/users/${id}`,
};
```

### App Config

```typescript
const APP_CONFIG = {
  NAME: 'IRIS',
  VERSION: '1.0.0',
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  TOKEN_EXPIRY: '7d',
  REFRESH_TOKEN_EXPIRY: '30d',
};
```

---

## 3. Utilidades

**Archivo:** `utils/index.ts`

| Funcion | Descripcion | Parametros | Retorno |
|---------|-------------|------------|---------|
| `formatDate(date, locale?)` | Formatea fecha | `date: Date\|string, locale?: string` | `string` |
| `formatDateTime(date, locale?)` | Formatea fecha con hora | `date: Date\|string, locale?: string` | `string` |
| `sleep(ms)` | Pausa asincrona | `ms: number` | `Promise<void>` |
| `generateRandomString(length?)` | Genera string aleatorio | `length?: number (default 16)` | `string` |
| `capitalize(str)` | Capitaliza primera letra | `str: string` | `string` |
| `truncate(str, length)` | Trunca string con ellipsis | `str: string, length: number` | `string` |
| `isEmpty(value)` | Verifica si valor esta vacio | `value: unknown` | `boolean` |

---

# BASE DE DATOS (database/migrations)

## 1. Sistema de Autenticacion (001_auth_system.sql)

### Tablas

| Tabla | Descripcion |
|-------|-------------|
| `account_users` | Usuarios del sistema |
| `auth_sessions` | Sesiones activas |
| `auth_refresh_tokens` | Tokens de refresh |
| `auth_password_resets` | Solicitudes de reset de password |
| `auth_email_verifications` | Verificaciones de email |
| `auth_login_history` | Historial de intentos de login |
| `auth_oauth_providers` | Proveedores OAuth vinculados |
| `user_permissions` | Permisos especificos por usuario |

### Funciones SQL

| Funcion | Descripcion | Parametros |
|---------|-------------|------------|
| `update_updated_at_column()` | Actualiza updated_at automaticamente | Trigger |
| `handle_failed_login(p_user_id)` | Incrementa intentos fallidos y bloquea | `p_user_id: UUID` |
| `reset_failed_login_attempts(p_user_id)` | Resetea intentos tras login exitoso | `p_user_id: UUID` |

### Triggers

| Trigger | Tabla | Descripcion |
|---------|-------|-------------|
| `trigger_account_users_updated_at` | account_users | Auto-update updated_at |
| `trigger_auth_oauth_providers_updated_at` | auth_oauth_providers | Auto-update updated_at |

---

## 2. Gestion de Proyectos (003_project_management.sql)

### Tablas

| Tabla | Descripcion |
|-------|-------------|
| `pm_projects` | Proyectos principales |
| `pm_project_members` | Miembros de proyectos |
| `pm_project_progress_history` | Historial de progreso |
| `pm_project_views` | Vistas personalizadas |
| `pm_milestones` | Hitos de proyectos |
| `pm_project_updates` | Actualizaciones/notas |

### Funciones SQL

| Funcion | Descripcion | Parametros |
|---------|-------------|------------|
| `record_project_progress(p_project_id)` | Registra progreso actual | `p_project_id: UUID` |
| `get_project_sparkline_data(p_project_id, p_days?)` | Datos para sparkline | `p_project_id: UUID, p_days?: int (default 30)` |

### Vistas

| Vista | Descripcion |
|-------|-------------|
| `v_projects_summary` | Proyectos con info calculada |

---

## 3. Gestion de Tareas (005_task_management.sql)

### Tablas

| Tabla | Descripcion |
|-------|-------------|
| `task_statuses` | Estados de tareas por equipo |
| `task_priorities` | Prioridades globales |
| `task_labels` | Etiquetas por equipo |
| `task_cycles` | Ciclos/Sprints |
| `task_issues` | Tareas principales |
| `task_issue_labels` | Relacion Issue-Label |
| `task_issue_subscribers` | Suscriptores/Watchers |
| `task_issue_comments` | Comentarios |
| `task_issue_attachments` | Archivos adjuntos |
| `task_issue_history` | Historial de cambios |
| `task_issue_relations` | Relaciones entre tareas |
| `task_saved_views` | Vistas guardadas |

### Funciones SQL

| Funcion | Descripcion |
|---------|-------------|
| `generate_issue_number()` | Auto-incrementa numero de issue por equipo |
| `update_issue_completion()` | Actualiza completed_at cuando status cambia a done |
| `create_default_task_statuses()` | Crea estados por defecto al crear equipo |

### Triggers

| Trigger | Tabla | Descripcion |
|---------|-------|-------------|
| `trg_issue_number` | task_issues | Auto-genera issue_number |
| `trg_issue_completion` | task_issues | Actualiza completed_at |
| `trg_team_default_statuses` | teams | Crea estados por defecto |

### Vistas

| Vista | Descripcion |
|-------|-------------|
| `v_task_issues_full` | Issues con toda la info relacionada |

---

## 4. Sistema de Notificaciones (008_notifications_system.sql)

### Tablas

| Tabla | Descripcion |
|-------|-------------|
| `notifications` | Notificaciones de usuarios |

### Funciones SQL

| Funcion | Descripcion |
|---------|-------------|
| `update_notification_read_at()` | Actualiza read_at automaticamente |

### Triggers

| Trigger | Descripcion |
|---------|-------------|
| `trg_notification_read_at` | Auto-update read_at al marcar leida |

---

## 5. Otras Migraciones

| Archivo | Descripcion |
|---------|-------------|
| `002_seed_test_user.sql` | Usuario de prueba |
| `004_storage_user_avatars.sql` | Bucket de avatares |
| `006_aria_multimodal.sql` | Tablas para ARIA multimodal |
| `007_aria_usage_tracking.sql` | Tracking de uso de ARIA |
| `009_faq_system.sql` | Sistema de FAQs |
| `010_global_search.sql` | Configuracion de busqueda global |
| `011_focus_mode_system.sql` | Sistema de modo enfoque |
| `add_cycles_table.sql` | Tabla de ciclos adicional |

---

# SCRIPTS DE NPM

```json
{
  "dev": "concurrently npm:dev:*",
  "dev:web": "npm run dev -w apps/web",
  "dev:api": "npm run dev -w apps/api",
  "build": "npm run build -w packages/shared && npm run build -w apps/web && npm run build -w apps/api",
  "lint": "npm run lint -w apps/web && npm run lint -w apps/api"
}
```

---

# TECNOLOGIAS PRINCIPALES

## Frontend
- Next.js 15.0.0 (App Router)
- TypeScript 5.9.3
- React 18
- Tailwind CSS 3.4.18
- Zustand 5.0.2
- Framer Motion 12.23.24
- React Hook Form 7.65.0
- Zod 3.25.76
- Google Generative AI SDK (Gemini 2.0 Flash)
- Supabase (SSR + JS client)
- Recharts 3.6.0
- Mermaid 11.12.2

## Backend
- Express 4.18.2
- TypeScript 5.3.3
- Helmet 7.1.0
- Morgan 1.10.0
- Bcrypt 5.1.1
- Zod 3.25.76

## Base de Datos
- PostgreSQL (via Supabase)
- UUID extension
- pgcrypto extension

## Requisitos
- Node.js >= 22.0.0
- npm >= 10.5.1

---

# VARIABLES DE ENTORNO

## Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
GEMINI_MAX_TOKENS=8192
GEMINI_TEMPERATURE=0.7
JWT_SECRET=
```

## Backend (.env)
```
PORT=4000
API_VERSION=v1
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
JWT_SECRET=
```

---

*Documentacion generada automaticamente - IRIS v1.3*
