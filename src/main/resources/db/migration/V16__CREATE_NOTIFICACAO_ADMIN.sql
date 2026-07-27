-- Notificações in-app pro barbeiro (ex: "chegou agendamento"), separada da
-- tabela "notificacao" (que é para envio de push/lembrete ao cliente)
CREATE TABLE notificacao_admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    agendamento_id UUID NOT NULL REFERENCES agendamento(id) ON DELETE CASCADE,
    titulo VARCHAR(100) NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notificacao_admin_tenant ON notificacao_admin(tenant_id);
CREATE INDEX idx_notificacao_admin_tenant_lida ON notificacao_admin(tenant_id, lida);
