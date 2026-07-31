ALTER TABLE notificacao_admin ALTER COLUMN agendamento_id DROP NOT NULL;
ALTER TABLE notificacao_admin ADD COLUMN IF NOT EXISTS fila_espera_id UUID REFERENCES fila_espera(id) ON DELETE CASCADE;
