package com.nalamina.api.service;

import com.nalamina.api.dto.tenant.BarbeariaResponse;
import com.nalamina.api.dto.tenant.HorarioFuncionamentoRequest;
import com.nalamina.api.dto.tenant.PerfilBarbeariaRequest;
import com.nalamina.api.entity.HorarioFuncionamentoEntity;
import com.nalamina.api.entity.TenantEntity;
import com.nalamina.api.repository.HorarioFuncionamentoRepository;
import com.nalamina.api.repository.TenantRepository;
import com.nalamina.api.security.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final HorarioFuncionamentoRepository horarioRepository;

    public BarbeariaResponse getBarbearia() {
        UUID tenantId = TenantContextHolder.getTenantId();
        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Barbearia não encontrada"));

        List<HorarioFuncionamentoEntity> horarios = horarioRepository
                .findByTenantEntity_IdOrderByDiaSemana(tenantId);

        return toResponse(tenant, horarios);
    }

    @Transactional
    public BarbeariaResponse atualizarPerfil(PerfilBarbeariaRequest request) {
        UUID tenantId = TenantContextHolder.getTenantId();
        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Barbearia não encontrada"));

        tenant.setNome(request.getNome());
        tenant.setTelefone(request.getTelefone());
        tenant.setCnpj(request.getCnpj());
        tenant.setEmail(request.getEmail());
        tenant.setEndereco(request.getEndereco());
        tenant.setDescricao(request.getDescricao());
        tenantRepository.save(tenant);

        List<HorarioFuncionamentoEntity> horarios = horarioRepository
                .findByTenantEntity_IdOrderByDiaSemana(tenantId);

        return toResponse(tenant, horarios);
    }

    @Transactional
    public BarbeariaResponse atualizarHorario(HorarioFuncionamentoRequest request) {
        UUID tenantId = TenantContextHolder.getTenantId();
        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Barbearia não encontrada"));

        HorarioFuncionamentoEntity horario = horarioRepository
                .findByTenantEntity_IdAndDiaSemana(tenantId, request.getDiaSemana())
                .orElse(HorarioFuncionamentoEntity.builder()
                        .tenantEntity(tenant)
                        .diaSemana(request.getDiaSemana())
                        .build());

        horario.setAberto(request.getAberto());
        horario.setHoraInicio1(request.getHoraInicio1());
        horario.setHoraFim1(request.getHoraFim1());
        horario.setHoraInicio2(request.getHoraInicio2());
        horario.setHoraFim2(request.getHoraFim2());
        horarioRepository.save(horario);

        List<HorarioFuncionamentoEntity> horarios = horarioRepository
                .findByTenantEntity_IdOrderByDiaSemana(tenantId);

        return toResponse(tenant, horarios);
    }

    private BarbeariaResponse toResponse(TenantEntity tenant, List<HorarioFuncionamentoEntity> horarios) {
        return BarbeariaResponse.builder()
                .id(tenant.getId())
                .nome(tenant.getNome())
                .telefone(tenant.getTelefone())
                .cnpj(tenant.getCnpj())
                .email(tenant.getEmail())
                .endereco(tenant.getEndereco())
                .descricao(tenant.getDescricao())
                .horarios(horarios.stream().map(h -> BarbeariaResponse.HorarioResponse.builder()
                        .diaSemana(h.getDiaSemana())
                        .aberto(h.getAberto())
                        .horaInicio1(h.getHoraInicio1())
                        .horaFim1(h.getHoraFim1())
                        .horaInicio2(h.getHoraInicio2())
                        .horaFim2(h.getHoraFim2())
                        .build()).toList())
                .build();
    }
}