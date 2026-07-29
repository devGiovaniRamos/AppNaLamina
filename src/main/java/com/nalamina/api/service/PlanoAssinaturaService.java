package com.nalamina.api.service;

import com.nalamina.api.dto.planoassinatura.PlanoAssinaturaRequest;
import com.nalamina.api.dto.planoassinatura.PlanoAssinaturaResponse;
import com.nalamina.api.entity.PlanoAssinaturaEntity;
import com.nalamina.api.entity.TenantEntity;
import com.nalamina.api.repository.PlanoAssinaturaRepository;
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
public class PlanoAssinaturaService {

    private final PlanoAssinaturaRepository planoAssinaturaRepository;
    private final TenantRepository tenantRepository;

    @Transactional(readOnly = true)
    public List<PlanoAssinaturaResponse> listar() {
        UUID tenantId = TenantContextHolder.getTenantId();
        return planoAssinaturaRepository.findByTenantEntity_IdOrderByCriadoEmDesc(tenantId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<PlanoAssinaturaResponse> listarPublico(UUID tenantId) {
        return planoAssinaturaRepository.findByTenantEntity_IdAndAtivoTrueOrderByPrecoMensalAsc(tenantId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public PlanoAssinaturaResponse criar(PlanoAssinaturaRequest request) {
        UUID tenantId = TenantContextHolder.getTenantId();
        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barbearia não encontrada"));

        PlanoAssinaturaEntity plano = PlanoAssinaturaEntity.builder()
                .tenantEntity(tenant)
                .nome(request.getNome())
                .descricao(request.getDescricao())
                .precoMensal(request.getPrecoMensal())
                .build();

        return toResponse(planoAssinaturaRepository.save(plano));
    }

    @Transactional
    public PlanoAssinaturaResponse atualizar(UUID id, PlanoAssinaturaRequest request) {
        UUID tenantId = TenantContextHolder.getTenantId();
        PlanoAssinaturaEntity plano = planoAssinaturaRepository.findByIdAndTenantEntity_Id(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plano não encontrado"));

        plano.setNome(request.getNome());
        plano.setDescricao(request.getDescricao());
        plano.setPrecoMensal(request.getPrecoMensal());

        return toResponse(planoAssinaturaRepository.save(plano));
    }

    @Transactional
    public PlanoAssinaturaResponse alternarAtivo(UUID id, boolean ativo) {
        UUID tenantId = TenantContextHolder.getTenantId();
        PlanoAssinaturaEntity plano = planoAssinaturaRepository.findByIdAndTenantEntity_Id(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plano não encontrado"));

        plano.setAtivo(ativo);
        return toResponse(planoAssinaturaRepository.save(plano));
    }

    private PlanoAssinaturaResponse toResponse(PlanoAssinaturaEntity plano) {
        return PlanoAssinaturaResponse.builder()
                .id(plano.getId())
                .nome(plano.getNome())
                .descricao(plano.getDescricao())
                .precoMensal(plano.getPrecoMensal())
                .ativo(plano.getAtivo())
                .build();
    }
}
