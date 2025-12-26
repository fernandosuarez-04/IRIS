const fs = require('fs');
const path = require('path');

// 1. Leer Configuración
const configPath = path.join(__dirname, '../antigravity.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('\x1b[36m%s\x1b[0m', `🚀 Iniciando conexión con ${config.connection.name}...`);
console.log(`📡 Endpoint: ${config.connection.endpoint}`);

// 2. Ejecutar Conexión
async function connectToBridge() {
    try {
        const response = await fetch(config.connection.endpoint, {
            headers: {
                'Authorization': `Bearer ${config.connection.auth.fallback_token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        // 3. Mostrar Contexto Recibido
        console.log('\n\x1b[32m%s\x1b[0m', '✅ CONEXIÓN EXITOSA - Contexto de IRIS Recibido:');
        console.log('------------------------------------------------');
        console.log(`💾 Base de Datos:   ${data.database?.stats?.projects_count} Proyectos, ${data.database?.stats?.tasks_count} Tareas`);
        console.log(`🌍 Entorno:         ${data.environment}`);
        console.log(`🟢 Estado Sistema:  ${data.system_status}`);
        console.log('------------------------------------------------');
        
        if (data.active_context?.active_projects?.length > 0) {
            console.log('\n📋 Proyectos Activos Detectados:');
            data.active_context.active_projects.forEach(p => {
                // CORRECCIÓN: Usamos project_name que es lo que devuelve la API ahora
                console.log(`   - [${p.project_status}] ${p.project_name}`);
            });
        }

    } catch (error) {
        console.error('\n\x1b[31m%s\x1b[0m', '❌ ERROR DE CONEXIÓN:');
        console.error('Asegúrate de que el servidor Next.js esté corriendo (npm run dev)');
        console.error(error.message);
    }
}

connectToBridge();
