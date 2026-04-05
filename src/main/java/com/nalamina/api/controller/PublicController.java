package com.nalamina.api.controller;

import com.nalamina.api.dto.agendamento.AgendamentoRequest;
import com.nalamina.api.dto.agendamento.AgendamentoResponse;
import com.nalamina.api.dto.agendamento.SlotDisponivel;
import com.nalamina.api.dto.servico.ServicoResponse;
import com.nalamina.api.repository.ServicoRepository;
import com.nalamina.api.service.AgendamentoService;
import com.nalamina.api.service.SlotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.nalamina.api.dto.profissional.ProfissionalResponse;
import com.nalamina.api.repository.ProfissionalRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/public/{tenantId}")
@RequiredArgsConstructor
public class PublicController {

    private final ServicoRepository servicoRepository;
    private final SlotService slotService;
    private final AgendamentoService agendamentoService;
    private final ProfissionalRepository profissionalRepository;

    @GetMapping("/servicos")
    public ResponseEntity<List<ServicoResponse>> listarServicos(@PathVariable UUID tenantId) {
        List<ServicoResponse> servicos = servicoRepository
                .findByTenantEntity_IdAndAtivoTrue(tenantId)
                .stream()
                .map(s -> ServicoResponse.builder()
                        .id(s.getId())
                        .nome(s.getNome())
                        .descricao(s.getDescricao())
                        .duracaoMin(s.getDuracaoMin())
                        .preco(s.getPreco())
                        .ativo(s.getAtivo())
                        .build())
                .toList();
        return ResponseEntity.ok(servicos);
    }

    @GetMapping("/slots")
    public ResponseEntity<List<SlotDisponivel>> listarSlots(
            @PathVariable UUID tenantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @RequestParam UUID servicoId) {
        return ResponseEntity.ok(slotService.listarSlots(tenantId, data, servicoId));
    }

    @PostMapping("/agendamentos")
    public ResponseEntity<AgendamentoResponse> criar(
            @PathVariable UUID tenantId,
            @Valid @RequestBody AgendamentoRequest request) {
        return ResponseEntity.status(201).body(agendamentoService.criarPublico(tenantId, request));
    }

    @GetMapping("/profissionais")
    public ResponseEntity<List<ProfissionalResponse>> listarProfissionais(@PathVariable UUID tenantId) {
        List<ProfissionalResponse> profissionais = profissionalRepository
                .findByTenantEntity_IdAndAtivoTrue(tenantId)
                .stream()
                .map(p -> ProfissionalResponse.builder()
                        .id(p.getId())
                        .nome(p.getNome())
                        .fotoUrl(p.getFotoUrl())
                        .ativo(p.getAtivo())
                        .build())
                .toList();
        return ResponseEntity.ok(profissionais);
    }
}