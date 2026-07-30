ALTER TABLE pagamento RENAME COLUMN pagarme_charge_id TO mercado_pago_payment_id;
ALTER TABLE pagamento ADD COLUMN IF NOT EXISTS pix_qr_code_base64 TEXT;

ALTER TABLE assinatura_cliente RENAME COLUMN pagarme_subscription_id TO mercado_pago_subscription_id;
