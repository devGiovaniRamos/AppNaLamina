package com.nalamina.api.controller;

import com.nalamina.api.dto.campeonato.CampeonatoRequest;
import com.nalamina.api.dto.campeonato.CampeonatoResponse;
import com.nalamina.api.dto.campeonato.RankingItemResponse;
import com.nalamina.api.service.CampeonatoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/campeonatos")
@RequiredArgsConstructor
public class CampeonatoController {

    private final CampeonatoService campeonatoService;

    @PostMapping
    public ResponseEntity<CampeonatoResponse> iniciar(@Valid @RequestBody CampeonatoRequest request) {
        return ResponseEntity.status(201).body(campeonatoService.iniciar(request));
    }

    @GetMapping("/ativo")
    public ResponseEntity<CampeonatoResponse> buscarAtivo() {
        return ResponseEntity.ok(campeonatoService.buscarAtivo());
    }

    @GetMapping
    public ResponseEntity<List<CampeonatoResponse>> listar() {
        return ResponseEntity.ok(campeonatoService.listar());
    }

    @PostMapping("/{id}/encerrar")
    public ResponseEntity<Void> encerrar(@PathVariable UUID id) {
        campeonatoService.encerrar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/ranking")
    public ResponseEntity<List<RankingItemResponse>> ranking(@PathVariable UUID id) {
        return ResponseEntity.ok(campeonatoService.ranking(id));
    }
}
