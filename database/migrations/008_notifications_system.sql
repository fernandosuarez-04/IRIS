-- ============================================================================
-- Notifications System
-- Migration: 008_notifications_system.sql
-- Created: 2025-12-26
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Destinatario
    recipient_id UUID REFERENCES account_users(user_id) ON DELETE CASCADE NOT NULL,
    
    -- Actor (quién generó la acción, NULL si es sistema)
    actor_id UUID REFERENCES account_users(user_id) ON DELETE SET NULL,
    
    -- Contenido
    title TEXT NOT NULL,
    message TEXT,
    
    -- Clasificación
    type VARCHAR(20) DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    category VARCHAR(50) DEFAULT 'system', -- 'task', 'project', 'team', 'comment', 'reminder'
    
    -- Contexto (opcional)
    entity_id UUID, -- ID del recurso relacionado (task_id, project_id)
    link TEXT, -- URL relativa para redirección (e.g. '/projects/123')
    
    -- Estado
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id) WHERE is_read = FALSE;

-- Trigger para actualizar read_at automáticamente
CREATE OR REPLACE FUNCTION update_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
        NEW.read_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notification_read_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    WHEN (NEW.is_read IS DISTINCT FROM OLD.is_read)
    EXECUTE FUNCTION update_notification_read_at();
