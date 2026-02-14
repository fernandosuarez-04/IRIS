/**
 * Índice central de clientes Supabase
 * 
 * Exporta todos los clientes y helpers para uso en la aplicación.
 * 
 * Arquitectura:
 * ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
 * │  IRIS Supa   │ │  SOFIA Supa  │ │  LIA Supa    │ │ ContentGen   │
 * │  (server.ts) │ │  (sofia-*)   │ │  (lia-*)     │ │ (content-*)  │
 * │              │ │              │ │              │ │              │
 * │ • projects   │ │ • auth       │ │ • conversa-  │ │ • cursos     │
 * │ • issues     │ │ • users      │ │   tions      │ │ • contenido  │
 * │ • teams      │ │ • orgs       │ │ • messages   │ │              │
 * │ • sessions   │ │ • teams      │ │ • meetings   │ │              │
 * └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
 */

// Configuración centralizada
export { 
  IRIS_SUPABASE, 
  SOFIA_SUPABASE, 
  LIA_SUPABASE, 
  CONTENT_GEN_SUPABASE,
  isValidUrl,
  isServiceConfigured,
} from './config';

// IRIS (servidor / Project Hub principal)
export { getSupabaseAdmin, supabaseAdmin } from './server';
export type { AccountUser, AuthSession } from './server';

// SOFIA (autenticación principal)
export { 
  getSofiaClient, 
  getSofiaAdmin, 
  isSofiaConfigured, 
  sofiaSupa 
} from './sofia-client';
export type { SofiaUser, SofiaOrganization, SofiaOrganizationUser } from './sofia-client';

// LIA Extension (conversaciones, meetings)
export { 
  getLiaClient, 
  isLiaConfigured, 
  liaSupa 
} from './lia-client';
export type { LiaConversation, LiaMessage, LiaMeeting } from './lia-client';

// Content Generator / CourseGen
export { 
  getContentGenClient, 
  isContentGenConfigured, 
  contentGenSupa 
} from './content-gen-client';
