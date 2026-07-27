package com.nalamina.api.controller;

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

    @PostMapping
    public ResponseEntity<Void> receber(
            @RequestParam(value = "data.id", required = false) String dataIdQuery,
            @RequestBody(required = false) java.util.Map<String, Object> body,
            @RequestHeader(value = "x-signature", required = false) String xSignature,
            @RequestHeader(value = "x-request-id", required = false) String xRequestId) {

        String dataId = dataIdQuery;
        if (dataId == null && body != null) {
            Object data = body.get("data");
            if (data instanceof java.util.Map<?, ?> dataMap && dataMap.get("id") != null) {
                dataId = dataMap.get("id").toString();
            }
        }

        if (dataId == null) {
            return ResponseEntity.ok().build();
        }

        if (!mercadoPagoService.verificarAssinatura(xSignature, xRequestId, dataId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            String status = mercadoPagoService.buscarStatus(dataId);
            if ("approved".equals(status)) {
                pagamentoService.confirmarPagamento(dataId);
                log.info("Pagamento Mercado Pago confirmado via webhook: {}", dataId);
            }
        } catch (Exception e) {
            log.error("Erro ao processar webhook Mercado Pago: {}", e.getMessage());
        }

        return ResponseEntity.ok().build();
    }
}
