package com.nalamina.api.controller;

import com.nalamina.api.dto.planoassinatura.PlanoAssinaturaRequest;
import com.nalamina.api.dto.planoassinatura.PlanoAssinaturaResponse;
import com.nalamina.api.service.PlanoAssinaturaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/planos")
@RequiredArgsConstructor
public class PlanoAssinaturaController {

    private final PlanoAssinaturaService planoAssinaturaService;

    @GetMapping
    public ResponseEntity<List<PlanoAssinaturaResponse>> listar() {
        return ResponseEntity.ok(planoAssinaturaService.listar());
    }

    @PostMapping
    public ResponseEntity<PlanoAssinaturaResponse> criar(@Valid @RequestBody PlanoAssinaturaRequest request) {
        return ResponseEntity.status(201).body(planoAssinaturaService.criar(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlanoAssinaturaResponse> atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody PlanoAssinaturaRequest request) {
        return ResponseEntity.ok(planoAssinaturaService.atualizar(id, request));
    }

    @PatchMapping("/{id}/ativo")
    public ResponseEntity<PlanoAssinaturaResponse> alternarAtivo(
            @PathVariable UUID id,
            @RequestBody Map<String, Boolean> body) {
        return ResponseEntity.ok(planoAssinaturaService.alternarAtivo(id, Boolean.TRUE.equals(body.get("ativo"))));
    }
}
