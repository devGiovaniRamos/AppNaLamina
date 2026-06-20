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
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class PagarmeService {

    private final RestClient restClient;
    private final String webhookSecret;

    public PagarmeService(
            @Value("${pagarme.api-key:sk_test_placeholder}") String apiKey,
            @Value("${pagarme.webhook-secret:}") String webhookSecret) {
        String credentials = Base64.getEncoder().encodeToString((apiKey + ":").getBytes());
        this.restClient = RestClient.builder()
                .baseUrl("https://api.pagar.me/core/v5")
                .defaultHeader("Authorization", "Basic " + credentials)
                .build();
        this.webhookSecret = webhookSecret;
    }

    public PagarmePixResult criarCobrancaPix(String clienteNome, BigDecimal valor, UUID agendamentoId) {
        long amountCents = valor.multiply(BigDecimal.valueOf(100)).longValue();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("amount", amountCents);
        body.put("currency", "BRL");
        body.put("payment_method", "pix");
        body.put("pix", Map.of("expires_in", 3600));
        body.put("customer", Map.of("name", clienteNome, "type", "individual"));
        body.put("metadata", Map.of("agendamento_id", agendamentoId.toString()));

        try {
            JsonNode response = restClient.post()
                    .uri("/charges")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            String chargeId = response.get("id").asText();
            JsonNode lastTx = response.get("last_transaction");
            String pixCopiaECola = lastTx.get("qr_code").asText();
            String expiresAt = lastTx.get("expires_at").asText();
            LocalDateTime pixExpiraEm = LocalDateTime.parse(expiresAt, DateTimeFormatter.ISO_DATE_TIME);

            return new PagarmePixResult(chargeId, pixCopiaECola, pixExpiraEm);
        } catch (Exception e) {
            log.error("Erro ao criar cobrança PIX no Pagar.me: {}", e.getMessage());
            throw new RuntimeException("Falha ao gerar PIX. Tente outro método de pagamento.", e);
        }
    }

    public boolean verificarAssinatura(String payload, String signature) {
        if (webhookSecret == null || webhookSecret.isBlank()) return true;
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(), "HmacSHA1"));
            byte[] hash = mac.doFinal(payload.getBytes());
            StringBuilder sb = new StringBuilder("sha1=");
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString().equals(signature);
        } catch (Exception e) {
            log.error("Erro ao verificar assinatura Pagar.me", e);
            return false;
        }
    }

    public record PagarmePixResult(String chargeId, String pixCopiaECola, LocalDateTime pixExpiraEm) {}
}
