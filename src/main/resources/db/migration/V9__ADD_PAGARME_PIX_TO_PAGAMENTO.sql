ALTER TABLE pagamento ADD COLUMN pagarme_charge_id VARCHAR(255);
ALTER TABLE pagamento ADD COLUMN pix_copia_e_cola TEXT;
ALTER TABLE pagamento ADD COLUMN pix_expira_em TIMESTAMP;
