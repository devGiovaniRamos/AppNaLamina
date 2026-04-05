package com.nalamina.api.controller;

import com.nalamina.api.dto.tenant.BarbeariaResponse;
import com.nalamina.api.dto.tenant.HorarioFuncionamentoRequest;
import com.nalamina.api.dto.tenant.HorarioTodosRequest;
import com.nalamina.api.dto.tenant.PerfilBarbeariaRequest;
import com.nalamina.api.service.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/barbearia")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    @GetMapping
    public ResponseEntity<BarbeariaResponse> getBarbearia() {
        return ResponseEntity.ok(tenantService.getBarbearia());
    }

    @PutMapping("/perfil")
    public ResponseEntity<BarbeariaResponse> atualizarPerfil(
            @Valid @RequestBody PerfilBarbeariaRequest request) {
        return ResponseEntity.ok(tenantService.atualizarPerfil(request));
    }

    @PutMapping("/horario")
    public ResponseEntity<BarbeariaResponse> atualizarHorario(
            @Valid @RequestBody HorarioFuncionamentoRequest request) {
        return ResponseEntity.ok(tenantService.atualizarHorario(request));
    }

    @PutMapping("/horario/todos")
    public ResponseEntity<BarbeariaResponse> atualizarTodosHorarios(
            @Valid @RequestBody HorarioTodosRequest request) {
        return ResponseEntity.ok(tenantService.atualizarTodosHorarios(request));
    }
}