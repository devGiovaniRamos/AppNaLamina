package com.nalamina.api.controller;

import com.nalamina.api.dto.venda.VendaCancelamentoRequest;
import com.nalamina.api.dto.venda.VendaRequest;
import com.nalamina.api.dto.venda.VendaResponse;
import com.nalamina.api.service.VendaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/vendas")
@RequiredArgsConstructor
public class VendaController {

    private final VendaService vendaService;

    @GetMapping
    public ResponseEntity<List<VendaResponse>> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        return ResponseEntity.ok(vendaService.listar(dataInicio, dataFim));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VendaResponse> buscar(@PathVariable UUID id) {
        return ResponseEntity.ok(vendaService.buscar(id));
    }

    @PostMapping
    public ResponseEntity<VendaResponse> criar(@Valid @RequestBody VendaRequest request) {
        return ResponseEntity.status(201).body(vendaService.criar(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelar(
            @PathVariable UUID id,
            @RequestBody(required = false) VendaCancelamentoRequest request) {
        vendaService.cancelar(id, request != null ? request.getMotivo() : null);
        return ResponseEntity.noContent().build();
    }
}
