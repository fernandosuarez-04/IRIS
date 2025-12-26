/**
 * Utilidades para JWT (JSON Web Tokens)
 * Implementación usando Web Crypto API
 */

import { AccountUser } from '../supabase/server';

// Secreto para firmar tokens (debe estar en .env)
const JWT_SECRET = process.env.JWT_SECRET || 'iris-super-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = 60 * 60; // 1 hora en segundos
const REFRESH_TOKEN_EXPIRY = 60 * 60 * 24 * 7; // 7 días en segundos

// Tipos
export interface JWTPayload {
  sub: string; // user_id
  email: string;
  name: string;
  role: string;
  permissionLevel: string;
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Codifica un string a Base64URL
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Decodifica Base64URL a string
 */
function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = str.length % 4;
  if (pad) {
    str += '='.repeat(4 - pad);
  }
  return Buffer.from(str, 'base64').toString('utf-8');
}

/**
 * Crea una firma HMAC-SHA256
 */
async function createSignature(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );
  
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Genera un token JWT
 */
async function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: number): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };
  
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));
  const signatureInput = `${headerB64}.${payloadB64}`;
  const signature = await createSignature(signatureInput);
  
  return `${signatureInput}.${signature}`;
}

/**
 * Verifica y decodifica un token JWT
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [headerB64, payloadB64, signature] = parts;
    const signatureInput = `${headerB64}.${payloadB64}`;
    const expectedSignature = await createSignature(signatureInput);
    
    // Verificar firma
    if (signature !== expectedSignature) return null;
    
    // Decodificar payload
    const payload: JWTPayload = JSON.parse(base64UrlDecode(payloadB64));
    
    // Verificar expiración
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;
    
    return payload;
  } catch {
    return null;
  }
}

/**
 * Genera par de tokens (access + refresh) para un usuario
 */
export async function generateTokenPair(user: AccountUser): Promise<TokenPair> {
  const basePayload = {
    sub: user.user_id,
    email: user.email,
    name: user.display_name || `${user.first_name} ${user.last_name_paternal}`,
    role: user.company_role || 'user',
    permissionLevel: user.permission_level,
  };
  
  const accessToken = await generateToken(
    { ...basePayload, type: 'access' },
    ACCESS_TOKEN_EXPIRY
  );
  
  const refreshToken = await generateToken(
    { ...basePayload, type: 'refresh' },
    REFRESH_TOKEN_EXPIRY
  );
  
  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRY,
  };
}

/**
 * Hash de un token para almacenamiento seguro
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
