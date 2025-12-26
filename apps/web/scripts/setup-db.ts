/**
 * Script para ejecutar migraciones en Supabase
 * Incluye generación de hash bcrypt para contraseñas
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Configuración - Leer de variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente Supabase con service role key (acceso completo)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Genera un hash bcrypt de una contraseña
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Ejecuta la migración de tablas
 */
async function runMigration() {
  console.log('🚀 Iniciando migración de base de datos...\n');

  try {
    // Leer el archivo SQL de migración
    const migrationPath = path.join(__dirname, '../../database/migrations/001_auth_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Ejecutar migración
    const { error: migrationError } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (migrationError) {
      console.error('❌ Error en migración:', migrationError);
      return false;
    }

    console.log('✅ Migración 001_auth_system.sql ejecutada correctamente\n');
    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

/**
 * Crea el usuario de prueba
 */
async function createTestUser() {
  console.log('👤 Creando usuario de prueba...\n');

  // Datos del usuario
  const userData = {
    first_name: 'Fernando',
    last_name_paternal: 'Suarez',
    last_name_maternal: 'Gonzalez',
    display_name: 'Fernando Suarez',
    username: 'fernando_suarez',
    email: 'fernando.suarez@ecosdeliderazgo.com',
    password_hash: await hashPassword('220626EaFy'),
    permission_level: 'super_admin',
    company_role: 'CEO',
    department: 'Dirección General',
    account_status: 'active',
    is_email_verified: true,
    email_verified_at: new Date().toISOString(),
    timezone: 'America/Mexico_City',
    locale: 'es-MX'
  };

  // Insertar usuario
  const { data, error } = await supabase
    .from('account_users')
    .upsert(userData, { onConflict: 'email' })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creando usuario:', error);
    return null;
  }

  console.log('✅ Usuario creado exitosamente:');
  console.log(`   📧 Email: ${data.email}`);
  console.log(`   👤 Nombre: ${data.display_name}`);
  console.log(`   🔑 Nivel: ${data.permission_level}`);
  console.log(`   🏢 Rol: ${data.company_role}\n`);

  return data;
}

/**
 * Verifica la contraseña del usuario
 */
async function verifyPassword(email: string, password: string): Promise<boolean> {
  const { data: user, error } = await supabase
    .from('account_users')
    .select('password_hash')
    .eq('email', email)
    .single();

  if (error || !user) {
    console.error('❌ Usuario no encontrado');
    return false;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  console.log(`🔐 Verificación de contraseña: ${isValid ? '✅ Válida' : '❌ Inválida'}`);
  return isValid;
}

// Ejecutar
async function main() {
  console.log('═'.repeat(50));
  console.log('  IRIS - Setup de Base de Datos');
  console.log('═'.repeat(50) + '\n');

  // 1. Crear usuario de prueba
  const user = await createTestUser();

  if (user) {
    // 2. Verificar que la contraseña funciona
    await verifyPassword('fernando.suarez@ecosdeliderazgo.com', '220626EaFy');
  }

  console.log('\n' + '═'.repeat(50));
  console.log('  Setup completado');
  console.log('═'.repeat(50));
}

main().catch(console.error);
