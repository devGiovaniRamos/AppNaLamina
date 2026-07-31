package com.nalamina.api.controller;

import com.nalamina.api.dto.financeiro.MovimentoFinanceiroResponse;
import com.nalamina.api.dto.financeiro.RelatorioFinanceiroGeralResponse;
import com.nalamina.api.service.FinanceiroService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/financeiro")
@RequiredArgsConstructor
public class FinanceiroController {

    private final FinanceiroService financeiroService;

    @GetMapping
    public ResponseEntity<List<MovimentoFinanceiroResponse>> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        return ResponseEntity.ok(financeiroService.listar(dataInicio, dataFim));
    }

    @GetMapping("/relatorio")
    public ResponseEntity<RelatorioFinanceiroGeralResponse> relatorio(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        return ResponseEntity.ok(financeiroService.relatorio(dataInicio, dataFim));
    }
}
