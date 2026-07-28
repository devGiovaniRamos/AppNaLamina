package com.nalamina.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Criptografia simétrica (AES-256-GCM) para dados sensíveis em repouso, como o access/refresh token
 * do Mercado Pago de cada barbearia — assim, um vazamento do banco sozinho não expõe credenciais
 * usáveis, só o ciphertext.
 */
@Service
public class CryptoService {

    private static final String ALGORITMO = "AES/GCM/NoPadding";
    private static final int TAMANHO_IV_BYTES = 12;
    private static final int TAMANHO_TAG_BITS = 128;

    private final SecretKeySpec chave;

    public CryptoService(@Value("${app.encryption-key:}") String chaveBase64) {
        if (chaveBase64 == null || chaveBase64.isBlank()) {
            throw new IllegalStateException(
                    "APP_ENCRYPTION_KEY não configurada. Gere uma chave de 256 bits com "
                            + "'openssl rand -base64 32' e configure a env var antes de subir a aplicação.");
        }
        byte[] bytes = Base64.getDecoder().decode(chaveBase64);
        if (bytes.length != 32) {
            throw new IllegalStateException("APP_ENCRYPTION_KEY deve decodificar para 32 bytes (256 bits).");
        }
        this.chave = new SecretKeySpec(bytes, "AES");
    }

    public String encrypt(String textoPlano) {
        if (textoPlano == null) return null;
        try {
            byte[] iv = new byte[TAMANHO_IV_BYTES];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITMO);
            cipher.init(Cipher.ENCRYPT_MODE, chave, new GCMParameterSpec(TAMANHO_TAG_BITS, iv));
            byte[] cifrado = cipher.doFinal(textoPlano.getBytes());

            ByteBuffer buffer = ByteBuffer.allocate(iv.length + cifrado.length);
            buffer.put(iv).put(cifrado);
            return Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception e) {
            throw new RuntimeException("Falha ao criptografar dado sensível", e);
        }
    }

    public String decrypt(String textoCifrado) {
        if (textoCifrado == null) return null;
        try {
            byte[] dados = Base64.getDecoder().decode(textoCifrado);
            ByteBuffer buffer = ByteBuffer.wrap(dados);
            byte[] iv = new byte[TAMANHO_IV_BYTES];
            buffer.get(iv);
            byte[] cifrado = new byte[buffer.remaining()];
            buffer.get(cifrado);

            Cipher cipher = Cipher.getInstance(ALGORITMO);
            cipher.init(Cipher.DECRYPT_MODE, chave, new GCMParameterSpec(TAMANHO_TAG_BITS, iv));
            return new String(cipher.doFinal(cifrado));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Falha ao decifrar dado sensível");
        }
    }
}
