/**
 * Cliente Supabase para Content Generator / CourseGen
 * 
 * ContentGen almacena:
 * - Cursos generados
 * - Contenido educativo
 * - Templates de contenido
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CONTENT_GEN_SUPABASE, isValidUrl } from './config';

// ── Cliente ContentGen (Browser/Client-side) ──

let _contentGenClient: SupabaseClient | null = null;

/**
 * Obtiene el cliente ContentGen para el lado del cliente (browser)
 */
export function getContentGenClient(): SupabaseClient | null {
  if (_contentGenClient) return _contentGenClient;

  const url = isValidUrl(CONTENT_GEN_SUPABASE.URL) ? CONTENT_GEN_SUPABASE.URL : '';
  const key = CONTENT_GEN_SUPABASE.ANON_KEY || '';

  if (!url || !key) return null;

  _contentGenClient = createClient(url, key, {
    auth: {
      storageKey: 'content-gen-auth-token', // ⚠️ ÚNICO por cliente
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return _contentGenClient;
}

/**
 * Verifica si ContentGen está configurado
 */
export function isContentGenConfigured(): boolean {
  return (
    CONTENT_GEN_SUPABASE.URL !== '' &&
    CONTENT_GEN_SUPABASE.ANON_KEY !== '' &&
    isValidUrl(CONTENT_GEN_SUPABASE.URL)
  );
}

// Exportar el cliente singleton
export const contentGenSupa = getContentGenClient();
