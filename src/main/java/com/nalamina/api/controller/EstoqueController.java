package com.nalamina.api.controller;

import com.nalamina.api.dto.estoque.MovimentoEstoqueResponse;
import com.nalamina.api.dto.estoque.RelatorioEstoqueResponse;
import com.nalamina.api.service.EstoqueService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/estoque")
@RequiredArgsConstructor
public class EstoqueController {

    private final EstoqueService estoqueService;

    @GetMapping("/movimentos")
    public ResponseEntity<List<MovimentoEstoqueResponse>> listarMovimentos(
            @RequestParam(required = false) UUID produtoId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        return ResponseEntity.ok(estoqueService.listarMovimentos(produtoId, dataInicio, dataFim));
    }

    @GetMapping("/relatorio")
    public ResponseEntity<RelatorioEstoqueResponse> relatorio(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        return ResponseEntity.ok(estoqueService.relatorio(dataInicio, dataFim));
    }
}
