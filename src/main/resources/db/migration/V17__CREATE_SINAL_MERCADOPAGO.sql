ALTER TABLE tenant
    ADD COLUMN sinal_obrigatorio BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN sinal_percentual DECIMAL(5,2),
    ADD COLUMN janela_cancelamento_horas INTEGER NOT NULL DEFAULT 12
        CHECK (janela_cancelamento_horas BETWEEN 0 AND 12);

ALTER TABLE pagamento
    ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT 'TOTAL',
    ADD COLUMN pix_qr_code_base64 TEXT;

ALTER TABLE pagamento RENAME COLUMN pagarme_charge_id TO mercadopago_payment_id;
