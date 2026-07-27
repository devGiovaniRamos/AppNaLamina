package com.nalamina.api.controller;

import com.nalamina.api.security.TenantContextHolder;
import com.nalamina.api.service.MercadoPagoOAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/barbearia/mercadopago")
@RequiredArgsConstructor
public class MercadoPagoOAuthController {

    private final MercadoPagoOAuthService mercadoPagoOAuthService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @GetMapping("/conectar")
    public ResponseEntity<Map<String, String>> conectar() {
        UUID tenantId = TenantContextHolder.getTenantId();
        return ResponseEntity.ok(Map.of("url", mercadoPagoOAuthService.gerarUrlConexao(tenantId)));
    }

    @DeleteMapping("/desconectar")
    public ResponseEntity<Void> desconectar() {
        mercadoPagoOAuthService.desconectar(TenantContextHolder.getTenantId());
        return ResponseEntity.noContent().build();
    }

    /**
     * Redirect público (chamado pelo navegador do usuário, sem JWT) para onde o Mercado Pago
     * devolve o usuário após ele autorizar o acesso à própria conta.
     */
    @GetMapping("/callback")
    public ResponseEntity<Void> callback(
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "error", required = false) String error) {

        String destino;
        if (error != null || code == null || state == null) {
            destino = frontendUrl + "/configuracoes?mercadopago=erro";
        } else {
            try {
                mercadoPagoOAuthService.processarCallback(code, state);
                destino = frontendUrl + "/configuracoes?mercadopago=conectado";
            } catch (Exception e) {
                log.error("Erro ao processar callback do Mercado Pago: {}", e.getMessage());
                destino = frontendUrl + "/configuracoes?mercadopago=erro";
            }
        }

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(destino))
                .build();
    }
}
