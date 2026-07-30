ALTER TABLE tenant ADD COLUMN IF NOT EXISTS mercado_pago_access_token TEXT;
ALTER TABLE tenant ADD COLUMN IF NOT EXISTS mercado_pago_refresh_token TEXT;
ALTER TABLE tenant ADD COLUMN IF NOT EXISTS mercado_pago_public_key VARCHAR(255);
ALTER TABLE tenant ADD COLUMN IF NOT EXISTS mercado_pago_user_id VARCHAR(100);
ALTER TABLE tenant ADD COLUMN IF NOT EXISTS mercado_pago_token_expira_em TIMESTAMP;
