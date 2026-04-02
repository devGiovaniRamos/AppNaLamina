package com.nalamina.api.controller;

import com.nalamina.api.dto.servico.ServicoRequest;
import com.nalamina.api.dto.servico.ServicoResponse;
import com.nalamina.api.service.ServicoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/servicos")
@RequiredArgsConstructor
public class ServicoController {

    private final ServicoService servicoService;

    @GetMapping
    public ResponseEntity<List<ServicoResponse>> listar() {
        return ResponseEntity.ok(servicoService.listar());
    }

    @PostMapping
    public ResponseEntity<ServicoResponse> criar(@Valid @RequestBody ServicoRequest request) {
        return ResponseEntity.status(201).body(servicoService.criar(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServicoResponse> atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody ServicoRequest request) {
        return ResponseEntity.ok(servicoService.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desativar(@PathVariable UUID id) {
        servicoService.desativar(id);
        return ResponseEntity.noContent().build();
    }
}