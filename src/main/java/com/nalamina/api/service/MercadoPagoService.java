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
import java.time.OffsetDateTime;
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

    public MercadoPagoPixResult criarPagamentoPix(String clienteNome, String clienteTel, BigDecimal valor, UUID agendamentoId) {
        String emailPagador = clienteTel.replaceAll("\\D", "") + "@cliente.nalamina.com.br";

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("transaction_amount", valor);
        body.put("description", "Agendamento NaLâmina");
        body.put("payment_method_id", "pix");
        body.put("payer", Map.of("email", emailPagador, "first_name", clienteNome));
        body.put("metadata", Map.of("agendamento_id", agendamentoId.toString()));

        try {
            JsonNode response = restClient.post()
                    .uri("/v1/payments")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Idempotency-Key", agendamentoId.toString())
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            String paymentId = response.get("id").asText();
            JsonNode txData = response.path("point_of_interaction").path("transaction_data");
            String pixCopiaECola = txData.get("qr_code").asText();
            String qrCodeBase64 = txData.path("qr_code_base64").asText(null);
            String expiresAt = response.get("date_of_expiration").asText();
            LocalDateTime pixExpiraEm = OffsetDateTime.parse(expiresAt, DateTimeFormatter.ISO_OFFSET_DATE_TIME).toLocalDateTime();

            return new MercadoPagoPixResult(paymentId, pixCopiaECola, qrCodeBase64, pixExpiraEm);
        } catch (Exception e) {
            log.error("Erro ao criar pagamento PIX no Mercado Pago: {}", e.getMessage());
            throw new RuntimeException("Falha ao gerar PIX. Tente outro método de pagamento.", e);
        }
    }

    public String consultarStatus(String paymentId) {
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

    /**
     * Valida o header x-signature conforme o formato do Mercado Pago:
     * "ts=<timestamp>,v1=<hmac>", assinando o manifest "id:{paymentId};request-id:{requestId};ts:{ts};".
     */
    public boolean verificarAssinatura(String paymentId, String requestId, String signatureHeader) {
        if (webhookSecret == null || webhookSecret.isBlank()) return true;
        if (signatureHeader == null || signatureHeader.isBlank()) return false;

        String ts = null;
        String hash = null;
        for (String part : signatureHeader.split(",")) {
            String[] kv = part.trim().split("=", 2);
            if (kv.length != 2) continue;
            if (kv[0].trim().equals("ts")) ts = kv[1].trim();
            if (kv[0].trim().equals("v1")) hash = kv[1].trim();
        }
        if (ts == null || hash == null) return false;

        String manifest = "id:" + paymentId + ";"
                + (requestId != null && !requestId.isBlank() ? "request-id:" + requestId + ";" : "")
                + "ts:" + ts + ";";

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(), "HmacSHA256"));
            byte[] computed = mac.doFinal(manifest.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : computed) sb.append(String.format("%02x", b));
            return sb.toString().equals(hash);
        } catch (Exception e) {
            log.error("Erro ao verificar assinatura Mercado Pago", e);
            return false;
        }
    }

    public record MercadoPagoPixResult(String paymentId, String pixCopiaECola, String qrCodeBase64, LocalDateTime pixExpiraEm) {}
}
