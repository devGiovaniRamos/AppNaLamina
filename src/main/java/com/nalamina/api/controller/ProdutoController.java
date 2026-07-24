package com.nalamina.api.controller;

import com.nalamina.api.dto.estoque.AjusteEstoqueRequest;
import com.nalamina.api.dto.produto.ProdutoRequest;
import com.nalamina.api.dto.produto.ProdutoResponse;
import com.nalamina.api.service.EstoqueService;
import com.nalamina.api.service.ProdutoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/produtos")
@RequiredArgsConstructor
public class ProdutoController {

    private final ProdutoService produtoService;
    private final EstoqueService estoqueService;

    @GetMapping
    public ResponseEntity<List<ProdutoResponse>> listar() {
        return ResponseEntity.ok(produtoService.listar());
    }

    @PostMapping
    public ResponseEntity<ProdutoResponse> criar(@Valid @RequestBody ProdutoRequest request) {
        return ResponseEntity.status(201).body(produtoService.criar(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProdutoResponse> atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody ProdutoRequest request) {
        return ResponseEntity.ok(produtoService.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desativar(@PathVariable UUID id) {
        produtoService.desativar(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/estoque/ajuste")
    public ResponseEntity<ProdutoResponse> ajustarEstoque(
            @PathVariable UUID id,
            @Valid @RequestBody AjusteEstoqueRequest request) {
        return ResponseEntity.ok(estoqueService.ajustar(id, request));
    }
}
