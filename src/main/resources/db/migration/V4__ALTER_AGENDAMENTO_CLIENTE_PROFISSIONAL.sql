ALTER TABLE agendamento
    DROP CONSTRAINT agendamento_cliente_id_fkey,
    DROP COLUMN cliente_id,
    ADD COLUMN cliente_nome VARCHAR(100) NOT NULL DEFAULT '',
    ADD COLUMN cliente_tel  VARCHAR(20),
    ALTER COLUMN profissional_id DROP NOT NULL;

ALTER TABLE agendamento
    ALTER COLUMN cliente_nome DROP DEFAULT;