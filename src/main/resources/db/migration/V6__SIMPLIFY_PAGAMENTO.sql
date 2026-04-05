ALTER TABLE pagamento
    DROP CONSTRAINT pagamento_usuario_id_fkey,
    DROP COLUMN usuario_id,
    DROP COLUMN pagarme_id,
    DROP COLUMN pix_qrcode;