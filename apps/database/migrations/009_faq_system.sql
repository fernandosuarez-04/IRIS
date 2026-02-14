-- ============================================================================
-- FAQ System
-- Migration: 009_faq_system.sql
-- Created: 2025-12-26
-- ============================================================================

CREATE TABLE IF NOT EXISTS faqs (
    faq_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general', -- 'billing', 'account', 'projects', 'technical'
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_faqs_order ON faqs(display_order);

-- Initial Seed Data
INSERT INTO faqs (question, answer, category, display_order) VALUES
('¿Cómo creo un nuevo proyecto?', 'Para crear un proyecto, ve a la sección "Proyectos" en el menú lateral y haz clic en el botón "+ Nuevo Proyecto". Completa el formulario con los detalles requeridos.', 'projects', 1),
('¿Cómo asigno tareas a mi equipo?', 'Dentro de un proyecto, ve a la pestaña "Tareas". Crea una nueva tarea y en el campo "Asignado a", selecciona al miembro del equipo deseado.', 'projects', 2),
('¿Qué hace ARIA?', 'ARIA es tu asistente de IA integrado. Puede ayudarte a crear tareas, redactar correos, resumir el estado de proyectos y responder preguntas sobre tu flujo de trabajo.', 'general', 3),
('¿Cómo cambio mi contraseña?', 'Ve a "Configuración" > "Perfil" y busca la sección de seguridad para actualizar tu contraseña.', 'account', 4),
('¿Puedo exportar los reportes?', 'Sí, en la sección de "Analytics" o "Reportes", encontrarás opciones para exportar los datos a PDF o CSV.', 'technical', 5);
