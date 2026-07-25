-- Campeonatos de pontuação (gamificação)
CREATE TABLE campeonato (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    valor_por_ponto DECIMAL(10,2) NOT NULL,
    premiacao TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campeonato_tenant ON campeonato(tenant_id);

-- garante no máximo um campeonato ATIVO por barbearia
CREATE UNIQUE INDEX uq_campeonato_tenant_ativo ON campeonato(tenant_id) WHERE status = 'ATIVO';

-- Pontos concedidos ao cliente (ledger), gerados a partir de agendamentos pagos ou vendas do PDV
CREATE TABLE ponto_cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    campeonato_id UUID NOT NULL REFERENCES campeonato(id) ON DELETE CASCADE,
    cliente_tel VARCHAR(11) NOT NULL,
    cliente_nome VARCHAR(100),
    origem VARCHAR(20) NOT NULL,
    origem_id UUID NOT NULL,
    valor_gerador DECIMAL(10,2) NOT NULL,
    pontos INT NOT NULL,
    estornado BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ponto_cliente_campeonato ON ponto_cliente(campeonato_id);
CREATE INDEX idx_ponto_cliente_tel ON ponto_cliente(cliente_tel);

-- evita gerar pontos duas vezes para o mesmo agendamento/venda dentro do mesmo campeonato
CREATE UNIQUE INDEX uq_ponto_cliente_origem ON ponto_cliente(campeonato_id, origem, origem_id);

-- Telefone do cliente passa a ser usado como identificador na gamificação: padroniza os
-- números já cadastrados (remove formatação e DDI 55), best-effort sobre dados existentes.
UPDATE agendamento SET cliente_tel = regexp_replace(cliente_tel, '[^0-9]', '', 'g');
UPDATE agendamento SET cliente_tel = substring(cliente_tel from 3)
    WHERE length(cliente_tel) IN (12, 13) AND cliente_tel LIKE '55%';

-- Telefone opcional na venda do PDV, para vincular pontos ao mesmo cliente do agendamento
ALTER TABLE venda ADD COLUMN IF NOT EXISTS cliente_tel VARCHAR(11);
