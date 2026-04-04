package com.nalamina.api.controller;

import com.nalamina.api.dto.agendamento.*;
import com.nalamina.api.service.AgendamentoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/agendamentos")
@RequiredArgsConstructor
public class AgendamentoController {

    private final AgendamentoService agendamentoService;

    @GetMapping
    public ResponseEntity<List<AgendamentoResponse>> listar() {
        return ResponseEntity.ok(agendamentoService.listar());
    }

    @PostMapping
    public ResponseEntity<AgendamentoResponse> criar(@Valid @RequestBody AgendamentoRequest request) {
        return ResponseEntity.status(201).body(agendamentoService.criar(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AgendamentoResponse> atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody AgendamentoRequest request) {
        return ResponseEntity.ok(agendamentoService.atualizar(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AgendamentoResponse> atualizarStatus(
            @PathVariable UUID id,
            @Valid @RequestBody AgendamentoStatusRequest request) {
        return ResponseEntity.ok(agendamentoService.atualizarStatus(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelar(@PathVariable UUID id) {
        agendamentoService.cancelar(id);
        return ResponseEntity.noContent().build();
    }
}