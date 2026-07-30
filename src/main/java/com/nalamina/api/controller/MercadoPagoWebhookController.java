package com.nalamina.api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nalamina.api.service.AssinaturaClienteService;
import com.nalamina.api.service.MercadoPagoService;
import com.nalamina.api.service.PagamentoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/webhooks/mercadopago")
@RequiredArgsConstructor
public class MercadoPagoWebhookController {

    private final MercadoPagoService mercadoPagoService;
    private final PagamentoService pagamentoService;
    private final AssinaturaClienteService assinaturaClienteService;
    private final ObjectMapper objectMapper;

    @PostMapping
    public ResponseEntity<Void> receber(
            @RequestBody String payload,
            @RequestHeader(value = "x-signature", required = false) String signature,
            @RequestHeader(value = "x-request-id", required = false) String requestId) {

        try {
            JsonNode node = objectMapper.readTree(payload);
            String type = node.path("type").asText();
            String paymentId = node.path("data").path("id").asText();

            if (!"payment".equals(type) || paymentId.isBlank()) {
                return ResponseEntity.ok().build();
            }

            if (!mercadoPagoService.verificarAssinatura(paymentId, requestId, signature)) {
                log.warn("Assinatura inválida no webhook Mercado Pago para pagamento {}", paymentId);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            boolean eraAgendamento = pagamentoService.processarWebhookMercadoPago(paymentId);
            if (!eraAgendamento) {
                assinaturaClienteService.processarWebhookMercadoPago(paymentId);
            }
            log.info("Webhook Mercado Pago processado para pagamento {}", paymentId);
        } catch (Exception e) {
            log.error("Erro ao processar webhook Mercado Pago: {}", e.getMessage());
        }

        return ResponseEntity.ok().build();
    }
}
