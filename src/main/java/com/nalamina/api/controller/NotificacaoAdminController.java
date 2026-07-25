package com.nalamina.api.controller;

import com.nalamina.api.dto.notificacao.ContagemNaoLidasResponse;
import com.nalamina.api.dto.notificacao.NotificacaoAdminResponse;
import com.nalamina.api.service.NotificacaoAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/notificacoes")
@RequiredArgsConstructor
public class NotificacaoAdminController {

    private final NotificacaoAdminService notificacaoAdminService;

    @GetMapping
    public ResponseEntity<List<NotificacaoAdminResponse>> listar() {
        return ResponseEntity.ok(notificacaoAdminService.listar());
    }

    @GetMapping("/contagem")
    public ResponseEntity<ContagemNaoLidasResponse> contarNaoLidas() {
        return ResponseEntity.ok(notificacaoAdminService.contarNaoLidas());
    }

    @PostMapping("/{id}/lida")
    public ResponseEntity<Void> marcarComoLida(@PathVariable UUID id) {
        notificacaoAdminService.marcarComoLida(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/marcar-todas-lidas")
    public ResponseEntity<Void> marcarTodasComoLidas() {
        notificacaoAdminService.marcarTodasComoLidas();
        return ResponseEntity.noContent().build();
    }
}
