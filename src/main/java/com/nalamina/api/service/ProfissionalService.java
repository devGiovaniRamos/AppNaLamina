package com.nalamina.api.service;

import com.nalamina.api.dto.profissional.ProfissionalRequest;
import com.nalamina.api.dto.profissional.ProfissionalResponse;
import com.nalamina.api.entity.ProfissionalEntity;
import com.nalamina.api.entity.TenantEntity;
import com.nalamina.api.repository.ProfissionalRepository;
import com.nalamina.api.repository.TenantRepository;
import com.nalamina.api.security.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfissionalService {

    private final ProfissionalRepository profissionalRepository;
    private final TenantRepository tenantRepository;

    public List<ProfissionalResponse> listar() {
        UUID tenantId = TenantContextHolder.getTenantId();
        return profissionalRepository.findByTenantEntity_IdAndAtivoTrue(tenantId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public ProfissionalResponse criar(ProfissionalRequest request) {
        UUID tenantId = TenantContextHolder.getTenantId();
        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barbearia não encontrada"));

        ProfissionalEntity profissional = ProfissionalEntity.builder()
                .tenantEntity(tenant)
                .nome(request.getNome())
                .fotoUrl(request.getFotoUrl())
                .build();

        return toResponse(profissionalRepository.save(profissional));
    }

    @Transactional
    public ProfissionalResponse atualizar(UUID id, ProfissionalRequest request) {
        UUID tenantId = TenantContextHolder.getTenantId();
        ProfissionalEntity profissional = profissionalRepository.findByIdAndTenantEntity_Id(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profissional não encontrado"));

        profissional.setNome(request.getNome());
        profissional.setFotoUrl(request.getFotoUrl());

        return toResponse(profissionalRepository.save(profissional));
    }

    @Transactional
    public void desativar(UUID id) {
        UUID tenantId = TenantContextHolder.getTenantId();
        ProfissionalEntity profissional = profissionalRepository.findByIdAndTenantEntity_Id(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profissional não encontrado"));

        profissional.setAtivo(false);
        profissionalRepository.save(profissional);
    }

    private ProfissionalResponse toResponse(ProfissionalEntity profissional) {
        return ProfissionalResponse.builder()
                .id(profissional.getId())
                .nome(profissional.getNome())
                .fotoUrl(profissional.getFotoUrl())
                .ativo(profissional.getAtivo())
                .build();
    }
}