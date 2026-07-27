package com.nalamina.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class MercadoPagoService {

    private final RestClient restClient;
    private final String webhookSecret;

    public MercadoPagoService(
            @Value("${mercadopago.access-token:TEST-placeholder}") String accessToken,
            @Value("${mercadopago.webhook-secret:}") String webhookSecret) {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.mercadopago.com")
                .defaultHeader("Authorization", "Bearer " + accessToken)
                .build();
        this.webhookSecret = webhookSecret;
    }

    public MercadoPagoPixResult criarCobrancaPix(String clienteNome, String clienteTel, BigDecimal valor, String referenciaExterna) {
        Map<String, Object> payer = new LinkedHashMap<>();
        payer.put("email", "cliente+" + clienteTel + "@nalamina.app");
        payer.put("first_name", clienteNome);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("transaction_amount", valor);
        body.put("description", "NaLamina - " + referenciaExterna);
        body.put("payment_method_id", "pix");
        body.put("payer", payer);
        body.put("external_reference", referenciaExterna);

        try {
            JsonNode response = restClient.post()
                    .uri("/v1/payments")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Idempotency-Key", UUID.randomUUID().toString())
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            String paymentId = response.get("id").asText();
            JsonNode transactionData = response.path("point_of_interaction").path("transaction_data");
            String pixCopiaECola = transactionData.path("qr_code").asText(null);
            String qrCodeBase64 = transactionData.path("qr_code_base64").asText(null);
            String expiraEmTexto = response.path("date_of_expiration").asText(null);
            LocalDateTime pixExpiraEm = expiraEmTexto != null
                    ? LocalDateTime.parse(expiraEmTexto, DateTimeFormatter.ISO_DATE_TIME)
                    : null;

            return new MercadoPagoPixResult(paymentId, pixCopiaECola, qrCodeBase64, pixExpiraEm);
        } catch (Exception e) {
            log.error("Erro ao criar cobrança PIX no Mercado Pago: {}", e.getMessage());
            throw new RuntimeException("Falha ao gerar PIX. Tente outro método de pagamento.", e);
        }
    }

    public String buscarStatus(String paymentId) {
        try {
            JsonNode response = restClient.get()
                    .uri("/v1/payments/{id}", paymentId)
                    .retrieve()
                    .body(JsonNode.class);
            return response.get("status").asText();
        } catch (Exception e) {
            log.error("Erro ao consultar pagamento {} no Mercado Pago: {}", paymentId, e.getMessage());
            return null;
        }
    }

    public boolean estornarPagamento(String paymentId) {
        try {
            restClient.post()
                    .uri("/v1/payments/{id}/refunds", paymentId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (Exception e) {
            log.error("Erro ao estornar pagamento {} no Mercado Pago: {}", paymentId, e.getMessage());
            return false;
        }
    }

    public boolean verificarAssinatura(String xSignature, String xRequestId, String dataId) {
        if (webhookSecret == null || webhookSecret.isBlank()) return true;
        if (xSignature == null || xRequestId == null || dataId == null) return false;

        String ts = null;
        String v1 = null;
        for (String parte : xSignature.split(",")) {
            String[] kv = parte.split("=", 2);
            if (kv.length != 2) continue;
            String chave = kv[0].trim();
            if ("ts".equals(chave)) ts = kv[1].trim();
            if ("v1".equals(chave)) v1 = kv[1].trim();
        }
        if (ts == null || v1 == null) return false;

        try {
            String manifest = "id:" + dataId + ";request-id:" + xRequestId + ";ts:" + ts + ";";
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(), "HmacSHA256"));
            byte[] hash = mac.doFinal(manifest.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString().equals(v1);
        } catch (Exception e) {
            log.error("Erro ao verificar assinatura Mercado Pago", e);
            return false;
        }
    }

    public record MercadoPagoPixResult(String paymentId, String pixCopiaECola, String qrCodeBase64, LocalDateTime pixExpiraEm) {}
}
