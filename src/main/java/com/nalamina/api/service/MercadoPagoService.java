package com.nalamina.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Cliente da API do Mercado Pago. Cada barbearia (tenant) conecta a própria conta via OAuth
 * ("Mercado Pago para Marketplaces"), então todo pagamento é criado com o access token da barbearia,
 * nunca com uma credencial fixa da plataforma.
 */
@Slf4j
@Service
public class MercadoPagoService {

    private final RestClient restClient;
    private final String clientId;
    private final String clientSecret;
    private final String redirectUri;
    private final String webhookSecret;
    private final int pixExpiracaoMinutos;

    public MercadoPagoService(
            @Value("${mercadopago.client-id:}") String clientId,
            @Value("${mercadopago.client-secret:}") String clientSecret,
            @Value("${mercadopago.redirect-uri:}") String redirectUri,
            @Value("${mercadopago.webhook-secret:}") String webhookSecret,
            @Value("${mercadopago.pix-expiracao-minutos:30}") int pixExpiracaoMinutos) {
        this.restClient = RestClient.builder().baseUrl("https://api.mercadopago.com").build();
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
        this.webhookSecret = webhookSecret;
        this.pixExpiracaoMinutos = pixExpiracaoMinutos;
    }

    public String gerarUrlAutorizacao(String state) {
        return UriComponentsBuilder.fromUriString("https://auth.mercadopago.com.br/authorization")
                .queryParam("client_id", clientId)
                .queryParam("response_type", "code")
                .queryParam("platform_id", "mp")
                .queryParam("state", state)
                .queryParam("redirect_uri", redirectUri)
                .build()
                .toUriString();
    }

    public MercadoPagoTokens trocarCodigoPorToken(String code) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("client_id", clientId);
        body.put("client_secret", clientSecret);
        body.put("grant_type", "authorization_code");
        body.put("code", code);
        body.put("redirect_uri", redirectUri);
        return trocarToken(body);
    }

    public MercadoPagoTokens renovarToken(String refreshToken) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("client_id", clientId);
        body.put("client_secret", clientSecret);
        body.put("grant_type", "refresh_token");
        body.put("refresh_token", refreshToken);
        return trocarToken(body);
    }

    private MercadoPagoTokens trocarToken(Map<String, Object> body) {
        try {
            JsonNode response = restClient.post()
                    .uri("/oauth/token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            String accessToken = response.get("access_token").asText();
            String refreshToken = response.path("refresh_token").asText(null);
            String publicKey = response.path("public_key").asText(null);
            String userId = response.path("user_id").asText(null);
            long expiresInSegundos = response.path("expires_in").asLong(15_552_000L);
            LocalDateTime expiraEm = LocalDateTime.now().plusSeconds(expiresInSegundos);

            return new MercadoPagoTokens(accessToken, refreshToken, publicKey, userId, expiraEm);
        } catch (Exception e) {
            log.error("Erro ao obter token do Mercado Pago: {}", e.getMessage());
            throw new RuntimeException("Falha ao conectar com o Mercado Pago.", e);
        }
    }

    /**
     * @param referenciaId id do agendamento ou da assinatura que originou a cobrança — usado só como
     *                      chave de idempotência e metadado, não precisa ser um agendamento.
     */
    public MercadoPagoPixResult criarPagamentoPix(
            String accessToken, String descricao, String clienteNome, String clienteTel, BigDecimal valor, UUID referenciaId) {
        String emailPagador = clienteTel.replaceAll("\\D", "") + "@cliente.nalamina.com.br";
        String dataExpiracao = OffsetDateTime.now()
                .plusMinutes(pixExpiracaoMinutos)
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSXXX"));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("transaction_amount", valor);
        body.put("description", descricao);
        body.put("payment_method_id", "pix");
        body.put("payer", Map.of("email", emailPagador, "first_name", clienteNome));
        body.put("metadata", Map.of("referencia_id", referenciaId.toString()));
        body.put("date_of_expiration", dataExpiracao);

        try {
            JsonNode response = restClient.post()
                    .uri("/v1/payments")
                    .header("Authorization", "Bearer " + accessToken)
                    .header("X-Idempotency-Key", referenciaId.toString())
                    .contentType(MediaType.APPLICATION_JSON)
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

    public String consultarStatus(String accessToken, String paymentId) {
        try {
            JsonNode response = restClient.get()
                    .uri("/v1/payments/{id}", paymentId)
                    .header("Authorization", "Bearer " + accessToken)
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
     * "ts=<timestamp>,v1=<hmac>", assinando o manifest "id:{paymentId};request-id:{requestId};ts:{ts};"
     * com a chave secreta do webhook cadastrada no painel da aplicação (única por app, não por barbearia).
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
            return HexFormat.of().formatHex(computed).equals(hash);
        } catch (Exception e) {
            log.error("Erro ao verificar assinatura Mercado Pago", e);
            return false;
        }
    }

    public record MercadoPagoTokens(
            String accessToken, String refreshToken, String publicKey, String userId, LocalDateTime expiraEm) {}

    public record MercadoPagoPixResult(String paymentId, String pixCopiaECola, String qrCodeBase64, LocalDateTime pixExpiraEm) {}
}
