package com.nalamina.api.controller;

import com.nalamina.api.dto.pagamento.PagamentoRequest;
import com.nalamina.api.dto.pagamento.PagamentoResponse;
import com.nalamina.api.service.PagamentoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/agendamentos/{agendamentoId}/pagamentos")
@RequiredArgsConstructor
public class PagamentoController {

    private final PagamentoService pagamentoService;

    @PostMapping
    public ResponseEntity<PagamentoResponse> registrar(
            @PathVariable UUID agendamentoId,
            @Valid @RequestBody PagamentoRequest request) {
        return ResponseEntity.status(201).body(pagamentoService.registrar(agendamentoId, request));
    }

    @GetMapping
    public ResponseEntity<PagamentoResponse> buscar(@PathVariable UUID agendamentoId) {
        return ResponseEntity.ok(pagamentoService.buscarPorAgendamento(agendamentoId));
    }
}