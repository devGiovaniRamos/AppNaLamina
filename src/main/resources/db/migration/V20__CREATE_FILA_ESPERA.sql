CREATE TABLE fila_espera (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    numero_ticket INTEGER NOT NULL,
    cliente_nome VARCHAR(100) NOT NULL,
    cliente_tel VARCHAR(20) NOT NULL,
    servico_id UUID NOT NULL REFERENCES servico(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'AGUARDANDO',
    criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    iniciado_em TIMESTAMP,
    concluido_em TIMESTAMP
);

CREATE INDEX idx_fila_espera_tenant_status ON fila_espera(tenant_id, status);
CREATE INDEX idx_fila_espera_tenant_cliente_tel ON fila_espera(tenant_id, cliente_tel);
