package com.nalamina.api.service;

import com.nalamina.api.dto.agendamento.*;
import com.nalamina.api.entity.*;
import com.nalamina.api.entity.enums.OrigemPonto;
import com.nalamina.api.entity.enums.StatusAgendamento;
import com.nalamina.api.entity.enums.StatusPagamento;
import com.nalamina.api.entity.enums.TipoPagamento;
import com.nalamina.api.repository.*;
import com.nalamina.api.security.TenantContextHolder;
import com.nalamina.api.util.TelefoneUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AgendamentoService {

    private final AgendamentoRepository agendamentoRepository;
    private final TenantRepository tenantRepository;
    private final ServicoRepository servicoRepository;
    private final ProfissionalRepository profissionalRepository;
    private final PagamentoRepository pagamentoRepository;
    private final PontuacaoService pontuacaoService;
    private final NotificacaoAdminService notificacaoAdminService;
    private final PagamentoService pagamentoService;

    @Transactional(readOnly = true)
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
        AgendamentoResponse response = criarAgendamento(tenantId, request);
        notificacaoAdminService.notificarNovoAgendamento(tenantId, response);
        return response;
    }

    private AgendamentoResponse criarAgendamento(UUID tenantId, AgendamentoRequest request) {
        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barbearia não encontrada"));

        if (!request.getHoraFim().isAfter(request.getHoraInicio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Horário de fim deve ser após o início");
        }

        LocalDateTime agendamentoDateTime = LocalDateTime.of(request.getData(), request.getHoraInicio());
        if (agendamentoDateTime.isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não é possível agendar em um horário que já passou");
        }

        List<ServicoEntity> servicos = resolverServicos(request.getServicoIds(), tenantId);

        ProfissionalEntity profissional = resolverProfissional(request.getProfissionalId(), tenantId);

        if (profissional != null) {
            verificarConflito(profissional.getId(), request, null);
        }

        AgendamentoEntity agendamento = AgendamentoEntity.builder()
                .tenantEntity(tenant)
                .servicos(servicos)
                .profissionalEntity(profissional)
                .clienteNome(request.getClienteNome())
                .clienteTel(TelefoneUtil.normalizar(request.getClienteTel()))
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

        List<ServicoEntity> servicos = resolverServicos(request.getServicoIds(), tenantId);

        if (!request.getHoraFim().isAfter(request.getHoraInicio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Horário de fim deve ser após o início");
        }

        ProfissionalEntity profissional = resolverProfissional(request.getProfissionalId(), tenantId);

        if (profissional != null) {
            verificarConflito(profissional.getId(), request, id);
        }

        agendamento.getServicos().clear();
        agendamento.getServicos().addAll(servicos);
        agendamento.setProfissionalEntity(profissional);
        agendamento.setClienteNome(request.getClienteNome());
        agendamento.setClienteTel(TelefoneUtil.normalizar(request.getClienteTel()));
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
    public void cancelar(UUID id, String motivo) {
        UUID tenantId = TenantContextHolder.getTenantId();

        AgendamentoEntity agendamento = agendamentoRepository.findByIdAndTenantEntity_Id(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agendamento não encontrado"));

        cancelarInterno(agendamento, motivo, false);
    }

    @Transactional
    public void cancelarPublico(UUID tenantId, UUID id, String telefone) {
        AgendamentoEntity agendamento = agendamentoRepository.findByIdAndTenantEntity_Id(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agendamento não encontrado"));

        if (!agendamento.getClienteTel().equals(TelefoneUtil.normalizar(telefone))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Telefone não corresponde ao agendamento");
        }
        if (agendamento.getStatus() != StatusAgendamento.PENDENTE && agendamento.getStatus() != StatusAgendamento.CONFIRMADO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este agendamento não pode mais ser cancelado");
        }

        cancelarInterno(agendamento, "Cancelado pelo cliente", true);
    }

    private void cancelarInterno(AgendamentoEntity agendamento, String motivo, boolean canceladoPeloCliente) {
        UUID tenantId = agendamento.getTenantEntity().getId();

        agendamento.setStatus(StatusAgendamento.CANCELADO);
        agendamento.setMotivoCancelamento(motivo);
        agendamentoRepository.save(agendamento);

        pagamentoRepository.findByAgendamentoEntity_IdAndTipo(agendamento.getId(), TipoPagamento.TOTAL).ifPresent(pagamento -> {
            if (pagamento.getStatus() != StatusPagamento.CANCELADO) {
                pagamento.setStatus(StatusPagamento.CANCELADO);
                pagamentoRepository.save(pagamento);
                pontuacaoService.estornarPontos(tenantId, OrigemPonto.AGENDAMENTO, pagamento.getId());
            }
        });

        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barbearia não encontrada"));
        pagamentoService.processarCancelamento(agendamento, tenant, canceladoPeloCliente);
    }

    @Transactional(readOnly = true)
    public List<AgendamentoBuscaPublicaResponse> buscarPorTelefone(UUID tenantId, String telefone) {
        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barbearia não encontrada"));

        String telefoneNormalizado = TelefoneUtil.normalizar(telefone);
        List<StatusAgendamento> statusPermitidos = List.of(StatusAgendamento.PENDENTE, StatusAgendamento.CONFIRMADO);

        return agendamentoRepository
                .findFuturosPorTelefone(tenantId, telefoneNormalizado, LocalDate.now(), statusPermitidos)
                .stream()
                .map(a -> {
                    long horas = java.time.Duration.between(
                            LocalDateTime.now(), LocalDateTime.of(a.getData(), a.getHoraInicio())).toHours();
                    return AgendamentoBuscaPublicaResponse.builder()
                            .agendamento(toResponse(a))
                            .reembolsavelSeCancelado(horas >= tenant.getJanelaCancelamentoHoras())
                            .build();
                })
                .toList();
    }

    // — helpers —

    private ProfissionalEntity resolverProfissional(UUID profissionalId, UUID tenantId) {
        if (profissionalId == null) return null;
        return profissionalRepository.findByIdAndTenantEntity_Id(profissionalId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profissional não encontrado"));
    }

    private List<ServicoEntity> resolverServicos(List<UUID> servicoIds, UUID tenantId) {
        return servicoIds.stream()
                .map(servicoId -> servicoRepository.findByIdAndTenantEntity_Id(servicoId, tenantId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado")))
                .toList();
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
                .servicoIds(a.getServicos().stream().map(ServicoEntity::getId).toList())
                .servicoNome(a.getServicos().stream().map(ServicoEntity::getNome).collect(Collectors.joining(", ")))
                .profissionalId(a.getProfissionalEntity() != null ? a.getProfissionalEntity().getId() : null)
                .profissionalNome(a.getProfissionalEntity() != null ? a.getProfissionalEntity().getNome() : null)
                .clienteNome(a.getClienteNome())
                .clienteTel(a.getClienteTel())
                .data(a.getData())
                .horaInicio(a.getHoraInicio())
                .horaFim(a.getHoraFim())
                .status(a.getStatus())
                .observacao(a.getObservacao())
                .motivoCancelamento(a.getMotivoCancelamento())
                .criadoEm(a.getCriadoEm())
                .build();
    }
}