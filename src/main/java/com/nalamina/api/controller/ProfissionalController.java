package com.nalamina.api.controller;

import com.nalamina.api.dto.profissional.ProfissionalRequest;
import com.nalamina.api.dto.profissional.ProfissionalResponse;
import com.nalamina.api.service.ProfissionalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/profissionais")
@RequiredArgsConstructor
public class ProfissionalController {

    private final ProfissionalService profissionalService;

    @GetMapping
    public ResponseEntity<List<ProfissionalResponse>> listar() {
        return ResponseEntity.ok(profissionalService.listar());
    }

    @PostMapping
    public ResponseEntity<ProfissionalResponse> criar(@Valid @RequestBody ProfissionalRequest request) {
        return ResponseEntity.status(201).body(profissionalService.criar(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProfissionalResponse> atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody ProfissionalRequest request) {
        return ResponseEntity.ok(profissionalService.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desativar(@PathVariable UUID id) {
        profissionalService.desativar(id);
        return ResponseEntity.noContent().build();
    }
}