CREATE TABLE IF NOT EXISTS agendamento_servico (
    agendamento_id UUID NOT NULL REFERENCES agendamento(id) ON DELETE CASCADE,
    servico_id UUID NOT NULL REFERENCES servico(id) ON DELETE CASCADE,
    posicao INT NOT NULL DEFAULT 0,
    PRIMARY KEY (agendamento_id, servico_id)
);

INSERT INTO agendamento_servico (agendamento_id, servico_id, posicao)
SELECT id, servico_id, 0 FROM agendamento WHERE servico_id IS NOT NULL;

ALTER TABLE agendamento DROP COLUMN IF EXISTS servico_id;
