ALTER TABLE tenant ADD COLUMN IF NOT EXISTS endereco VARCHAR(255);
ALTER TABLE tenant ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE tenant ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP NOT NULL DEFAULT NOW();

-- Tabela de horário de funcionamento por dia da semana
CREATE TABLE horario_funcionamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL, -- 0=domingo, 1=segunda, 2=terça, 3=quarta, 4=quinta, 5=sexta, 6=sábado
    aberto BOOLEAN NOT NULL DEFAULT FALSE,
    hora_inicio_1 TIME,          -- início do primeiro turno
    hora_fim_1 TIME,             -- fim do primeiro turno
    hora_inicio_2 TIME,          -- início do segundo turno (opcional)
    hora_fim_2 TIME,             -- fim do segundo turno (opcional)
    UNIQUE(tenant_id, dia_semana)
);

CREATE INDEX idx_horario_tenant ON horario_funcionamento(tenant_id);

-- Insere horários padrão para tenants existentes (todos fechados por padrão)
INSERT INTO horario_funcionamento (tenant_id, dia_semana, aberto)
SELECT t.id, d.dia, FALSE
FROM tenant t
CROSS JOIN (SELECT generate_series(0, 6) AS dia) d
ON CONFLICT DO NOTHING;