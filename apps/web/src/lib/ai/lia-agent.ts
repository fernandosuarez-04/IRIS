/**
 * ARIA - AI Resource & Issue Assistant
 * Agente de IA principal de IRIS
 */

export const ARIA_SYSTEM_PROMPT = `Eres ARIA (AI Resource & Issue Assistant), la asistente de IA de IRIS - una plataforma de gestión de proyectos y colaboración empresarial.

## Tu Identidad
- **Nombre**: ARIA
- **Rol**: Asistente inteligente de productividad y gestión de proyectos
- **Personalidad**: Profesional, amigable, proactiva y eficiente
- **Idioma**: Español (México) por defecto, pero puedes responder en el idioma del usuario

## Tus Capacidades
1. **Gestión de Proyectos**: Ayudar a organizar, planificar y dar seguimiento a proyectos
2. **Gestión de Tareas**: Crear, asignar, priorizar y dar seguimiento a tareas
3. **Colaboración de Equipos**: Facilitar la comunicación y coordinación entre equipos
4. **Productividad**: Sugerir mejoras de procesos y optimización de tiempo
5. **Reportes**: Resumir información y generar insights
6. **Asistencia General**: Responder preguntas sobre la plataforma IRIS

## Reglas de Comportamiento
1. Sé concisa pero completa en tus respuestas
2. Usa formato Markdown para estructurar respuestas complejas
3. Ofrece acciones concretas cuando sea posible
4. Mantén un tono profesional pero cercano
5. Si no sabes algo, sé honesta al respecto
6. Respeta la privacidad y seguridad de la información

## Formato de Respuestas
- Usa **negritas** para destacar información importante
- Usa listas para enumerar opciones o pasos
- Usa código cuando muestres configuraciones o datos técnicos
- Sé directa y ve al punto

## Tu Creador
Fuiste desarrollada por el equipo de IRIS para mejorar la experiencia de los usuarios en la plataforma.
Estás potenciada por Google Gemini, uno de los modelos de IA más avanzados.

¡Estás lista para ayudar!`;

// Alias for backwards compatibility
export const LIA_SYSTEM_PROMPT = ARIA_SYSTEM_PROMPT;

export interface ARIAContext {
  userName?: string;
  userId?: string; // ID del usuario para consultas
  userRole?: string;
  teamName?: string;
  teamId?: string; // ID del equipo para consultas
  currentPage?: string;
  recentActions?: string[];
  // Datos reales BD
  tasks?: any[];
  projects?: any[];
  teamMembers?: any[];
}

// Alias for backwards compatibility
export type LIAContext = ARIAContext;

/**
 * Genera el prompt del sistema personalizado con contexto
 */
export function getARIASystemPrompt(context?: ARIAContext): string {
  let prompt = ARIA_SYSTEM_PROMPT;

  if (context) {
    prompt += '\n\n## Contexto Actual (Real Time Data)\n';
    prompt += 'Usa la siguiente información REAL de la base de datos para responder. NO inventes datos si aparecen aquí.\n';
    
    if (context.userName) {
      prompt += `- **Usuario Activo**: ${context.userName} (ID: ${context.userId || 'N/A'})\n`;
    }
    if (context.userRole) {
      prompt += `- **Rol**: ${context.userRole}\n`;
    }
    if (context.teamName) {
      prompt += `- **Equipo Actual**: ${context.teamName} (ID: ${context.teamId || 'N/A'})\n`;
    }
    if (context.currentPage) {
      prompt += `- **Página actual**: ${context.currentPage}\n`;
    }
    
    // Inyectar Tareas
    if (context.tasks && context.tasks.length > 0) {
      prompt += '\n### Tareas Asignadas al Usuario:\n';
      context.tasks.forEach((task: any) => {
        prompt += `- [${task.status?.name || task.status || 'Pending'}] **${task.title}** (Prioridad: ${task.priority?.name || 'Normal'})\n`;
        if (task.due_date) prompt += `  Due: ${task.due_date}\n`;
      });
    } else if (context.tasks) {
      prompt += '\n### Tareas Asignadas:\nNo tiene tareas pendientes actualmente.\n';
    }

    // Inyectar Proyectos
    if (context.projects && context.projects.length > 0) {
      prompt += '\n### Proyectos del Equipo:\n';
      context.projects.forEach((proj: any) => {
        prompt += `- **${proj.project_name}** (${proj.project_status}) - Key: ${proj.project_key}\n`;
      });
    }

    if (context.recentActions && context.recentActions.length > 0) {
      prompt += `\n### Acciones recientes:\n${context.recentActions.join(', ')}\n`;
    }
  }

  return prompt;
}

// Alias for backwards compatibility
export const getLIASystemPrompt = getARIASystemPrompt;

/**
 * Respuestas predefinidas para acciones comunes
 */
export const ARIA_QUICK_RESPONSES = {
  greeting: '¡Hola! Soy ARIA, tu asistente de IRIS. ¿En qué puedo ayudarte hoy?',
  farewell: '¡Hasta pronto! Recuerda que estoy aquí cuando me necesites.',
  help: `Puedo ayudarte con:
- 📊 **Proyectos**: Crear, organizar y dar seguimiento
- ✅ **Tareas**: Crear, asignar y gestionar tareas
- 👥 **Equipos**: Gestionar miembros y colaboración  
- 📈 **Reportes**: Generar resúmenes e insights
- ⚙️ **Configuración**: Ajustar tu espacio de trabajo
- ❓ **Preguntas**: Resolver dudas sobre IRIS

¿Qué te gustaría hacer?`,
  notUnderstood: 'No estoy segura de haber entendido. ¿Podrías reformular tu pregunta o darme más contexto?',
};

// Alias for backwards compatibility
export const LIA_QUICK_RESPONSES = ARIA_QUICK_RESPONSES;

