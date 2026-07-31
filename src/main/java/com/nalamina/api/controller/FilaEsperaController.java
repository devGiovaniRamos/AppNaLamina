package com.nalamina.api.controller;

import com.nalamina.api.dto.fila.EntrarFilaRequest;
import com.nalamina.api.dto.fila.FilaTicketResponse;
import com.nalamina.api.service.FilaEsperaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/fila")
@RequiredArgsConstructor
public class FilaEsperaController {

    private final FilaEsperaService filaEsperaService;

    @GetMapping
    public ResponseEntity<List<FilaTicketResponse>> listar() {
        return ResponseEntity.ok(filaEsperaService.listar());
    }

    @PostMapping
    public ResponseEntity<FilaTicketResponse> entrar(@Valid @RequestBody EntrarFilaRequest request) {
        return ResponseEntity.status(201).body(filaEsperaService.entrarAdmin(request));
    }

    @PostMapping("/{id}/chamar")
    public ResponseEntity<FilaTicketResponse> chamar(@PathVariable UUID id) {
        return ResponseEntity.ok(filaEsperaService.chamar(id));
    }

    @PostMapping("/{id}/finalizar")
    public ResponseEntity<FilaTicketResponse> finalizar(@PathVariable UUID id) {
        return ResponseEntity.ok(filaEsperaService.finalizar(id));
    }

    @PostMapping("/{id}/remover")
    public ResponseEntity<FilaTicketResponse> remover(@PathVariable UUID id) {
        return ResponseEntity.ok(filaEsperaService.remover(id));
    }
}
