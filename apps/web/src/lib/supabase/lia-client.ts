/**
 * Cliente Supabase para LIA Extension (Datos locales)
 * 
 * LIA almacena:
 * - Conversaciones del chat AI
 * - Mensajes
 * - Folders de organización
 * - Configuraciones de usuario AI
 * - Meetings/transcripciones
 * 
 * La sincronización funciona así:
 * 1. Usuario se autentica en SOFIA
 * 2. Se sincroniza la sesión con LIA (signInWithPassword o signUp)
 * 3. LIA Supabase tiene su propio Auth para RLS en conversations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LIA_SUPABASE, isValidUrl } from './config';

// ── Tipos para tablas de LIA ──

export interface LiaConversation {
  id: string;
  user_id: string;
  title: string;
  folder_id: string | null;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface LiaMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface LiaMeeting {
  id: string;
  user_id: string;
  title: string;
  transcript: string | null;
  summary: string | null;
  action_items: string | null;
  created_at: string;
  updated_at: string;
}

// ── Cliente LIA (Browser/Client-side) ──

let _liaClient: SupabaseClient | null = null;

/**
 * Obtiene el cliente LIA para el lado del cliente (browser)
 */
export function getLiaClient(): SupabaseClient | null {
  if (_liaClient) return _liaClient;

  const liaUrl = isValidUrl(LIA_SUPABASE.URL) ? LIA_SUPABASE.URL : '';
  const liaKey = LIA_SUPABASE.ANON_KEY || '';

  if (!liaUrl || !liaKey) return null;

  _liaClient = createClient(liaUrl, liaKey, {
    auth: {
      storageKey: 'lia-auth-token', // ⚠️ ÚNICO por cliente
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return _liaClient;
}

/**
 * Verifica si LIA está configurado
 */
export function isLiaConfigured(): boolean {
  return (
    LIA_SUPABASE.URL !== '' &&
    LIA_SUPABASE.ANON_KEY !== '' &&
    isValidUrl(LIA_SUPABASE.URL)
  );
}

// Exportar el cliente singleton para uso directo
export const liaSupa = getLiaClient();
