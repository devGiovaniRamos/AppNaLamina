package com.nalamina.api.service;

import com.nalamina.api.dto.agendamento.*;
import com.nalamina.api.entity.*;
import com.nalamina.api.entity.enums.StatusAgendamento;
import com.nalamina.api.repository.*;
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
public class AgendamentoService {

    private final AgendamentoRepository agendamentoRepository;
    private final TenantRepository tenantRepository;
    private final ServicoRepository servicoRepository;
    private final ProfissionalRepository profissionalRepository;

    public List<AgendamentoResponse> listar() {
        UUID tenantId = TenantContextHolder.getTenantId();
        return agendamentoRepository.findByTenantEntity_IdOrderByDataAscHoraInicioAsc(tenantId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public AgendamentoResponse criar(AgendamentoRequest request) {
        UUID tenantId = TenantContextHolder.getTenantId();
        return criarAgendamento(tenantId, request);
    }

    @Transactional
    public AgendamentoResponse criarPublico(UUID tenantId, AgendamentoRequest request) {
        return criarAgendamento(tenantId, request);
    }

    private AgendamentoResponse criarAgendamento(UUID tenantId, AgendamentoRequest request) {
        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barbearia não encontrada"));

        ServicoEntity servico = servicoRepository.findByIdAndTenantEntity_Id(request.getServicoId(), tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado"));

        if (!request.getHoraFim().isAfter(request.getHoraInicio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Horário de fim deve ser após o início");
        }

        ProfissionalEntity profissional = resolverProfissional(request.getProfissionalId(), tenantId);

        if (profissional != null) {
            verificarConflito(profissional.getId(), request, null);
        }

        AgendamentoEntity agendamento = AgendamentoEntity.builder()
                .tenantEntity(tenant)
                .servicoEntity(servico)
                .profissionalEntity(profissional)
                .clienteNome(request.getClienteNome())
                .clienteTel(request.getClienteTel())
                .data(request.getData())
                .horaInicio(request.getHoraInicio())
                .horaFim(request.getHoraFim())
                .observacao(request.getObservacao())
                .build();

        return toResponse(agendamentoRepository.save(agendamento));
    }

    @Transactional
    public AgendamentoResponse atualizar(UUID id, AgendamentoRequest request) {
        UUID tenantId = TenantContextHolder.getTenantId();

        AgendamentoEntity agendamento = agendamentoRepository.findByIdAndTenantEntity_Id(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agendamento não encontrado"));

        ServicoEntity servico = servicoRepository.findByIdAndTenantEntity_Id(request.getServicoId(), tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado"));

        if (!request.getHoraFim().isAfter(request.getHoraInicio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Horário de fim deve ser após o início");
        }

        ProfissionalEntity profissional = resolverProfissional(request.getProfissionalId(), tenantId);

        if (profissional != null) {
            verificarConflito(profissional.getId(), request, id);
        }

        agendamento.setServicoEntity(servico);
        agendamento.setProfissionalEntity(profissional);
        agendamento.setClienteNome(request.getClienteNome());
        agendamento.setClienteTel(request.getClienteTel());
        agendamento.setData(request.getData());
        agendamento.setHoraInicio(request.getHoraInicio());
        agendamento.setHoraFim(request.getHoraFim());
        agendamento.setObservacao(request.getObservacao());

        return toResponse(agendamentoRepository.save(agendamento));
    }

    @Transactional
    public AgendamentoResponse atualizarStatus(UUID id, AgendamentoStatusRequest request) {
        UUID tenantId = TenantContextHolder.getTenantId();

        AgendamentoEntity agendamento = agendamentoRepository.findByIdAndTenantEntity_Id(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agendamento não encontrado"));

        agendamento.setStatus(request.getStatus());
        return toResponse(agendamentoRepository.save(agendamento));
    }

    @Transactional
    public void cancelar(UUID id) {
        UUID tenantId = TenantContextHolder.getTenantId();

        AgendamentoEntity agendamento = agendamentoRepository.findByIdAndTenantEntity_Id(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agendamento não encontrado"));

        agendamento.setStatus(StatusAgendamento.CANCELADO);
        agendamentoRepository.save(agendamento);
    }

    // — helpers —

    private ProfissionalEntity resolverProfissional(UUID profissionalId, UUID tenantId) {
        if (profissionalId == null) return null;
        return profissionalRepository.findByIdAndTenantEntity_Id(profissionalId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profissional não encontrado"));
    }

    private void verificarConflito(UUID profissionalId, AgendamentoRequest request, UUID excludeId) {
        boolean conflito = agendamentoRepository.existeConflito(
                profissionalId,
                request.getData(),
                request.getHoraInicio(),
                request.getHoraFim(),
                excludeId,
                StatusAgendamento.CANCELADO
        );
        if (conflito) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Profissional já possui agendamento neste horário");
        }
    }

    private AgendamentoResponse toResponse(AgendamentoEntity a) {
        return AgendamentoResponse.builder()
                .id(a.getId())
                .servicoId(a.getServicoEntity().getId())
                .servicoNome(a.getServicoEntity().getNome())
                .profissionalId(a.getProfissionalEntity() != null ? a.getProfissionalEntity().getId() : null)
                .profissionalNome(a.getProfissionalEntity() != null ? a.getProfissionalEntity().getNome() : null)
                .clienteNome(a.getClienteNome())
                .clienteTel(a.getClienteTel())
                .data(a.getData())
                .horaInicio(a.getHoraInicio())
                .horaFim(a.getHoraFim())
                .status(a.getStatus())
                .observacao(a.getObservacao())
                .criadoEm(a.getCriadoEm())
                .build();
    }
}