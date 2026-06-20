package com.nalamina.api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nalamina.api.service.PagarmeService;
import com.nalamina.api.service.PagamentoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/webhooks/pagarme")
@RequiredArgsConstructor
public class PagarmeWebhookController {

    private final PagarmeService pagarmeService;
    private final PagamentoService pagamentoService;
    private final ObjectMapper objectMapper;

    @PostMapping
    public ResponseEntity<Void> receber(
            @RequestBody String payload,
            @RequestHeader(value = "X-Hub-Signature", required = false) String signature) {

        if (!pagarmeService.verificarAssinatura(payload, signature)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            JsonNode node = objectMapper.readTree(payload);
            String type = node.path("type").asText();
            if ("charge.paid".equals(type)) {
                String chargeId = node.path("data").path("id").asText();
                pagamentoService.confirmarPagamento(chargeId);
                log.info("Pagamento PIX confirmado via webhook: {}", chargeId);
            }
        } catch (Exception e) {
            log.error("Erro ao processar webhook Pagar.me: {}", e.getMessage());
        }

        return ResponseEntity.ok().build();
    }
}
