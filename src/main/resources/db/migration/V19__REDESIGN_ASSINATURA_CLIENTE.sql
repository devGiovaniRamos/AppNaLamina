ALTER TABLE assinatura_cliente DROP CONSTRAINT IF EXISTS assinatura_cliente_usuario_id_fkey;
ALTER TABLE assinatura_cliente DROP COLUMN IF EXISTS usuario_id;

ALTER TABLE assinatura_cliente ADD COLUMN IF NOT EXISTS cliente_nome VARCHAR(100);
ALTER TABLE assinatura_cliente ADD COLUMN IF NOT EXISTS cliente_tel VARCHAR(20);

ALTER TABLE assinatura_cliente ALTER COLUMN inicio DROP NOT NULL;
ALTER TABLE assinatura_cliente RENAME COLUMN fim TO expira_em;

ALTER TABLE assinatura_cliente ADD COLUMN IF NOT EXISTS mercado_pago_payment_id VARCHAR(255);
ALTER TABLE assinatura_cliente ADD COLUMN IF NOT EXISTS pix_copia_e_cola TEXT;
ALTER TABLE assinatura_cliente ADD COLUMN IF NOT EXISTS pix_qr_code_base64 TEXT;
ALTER TABLE assinatura_cliente ADD COLUMN IF NOT EXISTS pix_expira_em TIMESTAMP;

ALTER TABLE plano_assinatura DROP COLUMN IF EXISTS max_agendamentos;
