package com.nalamina.api.controller;

import com.nalamina.api.dto.assinaturacliente.AssinaturaResponse;
import com.nalamina.api.service.AssinaturaClienteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/assinaturas")
@RequiredArgsConstructor
public class AssinaturaController {

    private final AssinaturaClienteService assinaturaClienteService;

    @GetMapping
    public ResponseEntity<List<AssinaturaResponse>> listar() {
        return ResponseEntity.ok(assinaturaClienteService.listar());
    }

    @PostMapping("/{id}/renovar")
    public ResponseEntity<AssinaturaResponse> renovar(@PathVariable UUID id) {
        return ResponseEntity.ok(assinaturaClienteService.renovarManual(id));
    }
}
