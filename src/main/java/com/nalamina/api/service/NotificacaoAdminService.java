package com.nalamina.api.service;

import com.nalamina.api.dto.agendamento.AgendamentoResponse;
import com.nalamina.api.dto.notificacao.ContagemNaoLidasResponse;
import com.nalamina.api.dto.notificacao.NotificacaoAdminResponse;
import com.nalamina.api.entity.FilaEsperaEntity;
import com.nalamina.api.entity.NotificacaoAdminEntity;
import com.nalamina.api.repository.AgendamentoRepository;
import com.nalamina.api.repository.NotificacaoAdminRepository;
import com.nalamina.api.repository.TenantRepository;
import com.nalamina.api.security.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificacaoAdminService {

    private static final DateTimeFormatter FMT_DATA = DateTimeFormatter.ofPattern("dd/MM");
    private static final DateTimeFormatter FMT_HORA = DateTimeFormatter.ofPattern("HH:mm");

    private final NotificacaoAdminRepository notificacaoAdminRepository;
    private final TenantRepository tenantRepository;
    private final AgendamentoRepository agendamentoRepository;

    @Transactional
    public void notificarNovoAgendamento(UUID tenantId, AgendamentoResponse agendamento) {
        String mensagem = "%s agendou %s para %s às %s".formatted(
                agendamento.getClienteNome(),
                agendamento.getServicoNome(),
                agendamento.getData().format(FMT_DATA),
                agendamento.getHoraInicio().format(FMT_HORA));

        notificacaoAdminRepository.save(NotificacaoAdminEntity.builder()
                .tenantEntity(tenantRepository.getReferenceById(tenantId))
                .agendamentoEntity(agendamentoRepository.getReferenceById(agendamento.getId()))
                .titulo("Novo agendamento")
                .mensagem(mensagem)
                .build());
    }

    @Transactional
    public void notificarEntradaFila(UUID tenantId, FilaEsperaEntity ticket) {
        String mensagem = "%s entrou na fila de espera (senha #%d) para %s".formatted(
                ticket.getClienteNome(), ticket.getNumeroTicket(), ticket.getServicoEntity().getNome());

        notificacaoAdminRepository.save(NotificacaoAdminEntity.builder()
                .tenantEntity(tenantRepository.getReferenceById(tenantId))
                .filaEsperaEntity(ticket)
                .titulo("Nova entrada na fila")
                .mensagem(mensagem)
                .build());
    }

    @Transactional(readOnly = true)
    public List<NotificacaoAdminResponse> listar() {
        UUID tenantId = TenantContextHolder.getTenantId();
        return notificacaoAdminRepository.findTop20ByTenantEntity_IdOrderByCriadoEmDesc(tenantId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ContagemNaoLidasResponse contarNaoLidas() {
        UUID tenantId = TenantContextHolder.getTenantId();
        return ContagemNaoLidasResponse.builder()
                .naoLidas(notificacaoAdminRepository.countByTenantEntity_IdAndLidaFalse(tenantId))
                .build();
    }

    @Transactional
    public void marcarComoLida(UUID id) {
        UUID tenantId = TenantContextHolder.getTenantId();
        NotificacaoAdminEntity notificacao = notificacaoAdminRepository.findByIdAndTenantEntity_Id(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notificação não encontrada"));
        notificacao.setLida(true);
        notificacaoAdminRepository.save(notificacao);
    }

    @Transactional
    public void marcarTodasComoLidas() {
        UUID tenantId = TenantContextHolder.getTenantId();
        List<NotificacaoAdminEntity> naoLidas = notificacaoAdminRepository.findByTenantEntity_IdAndLidaFalse(tenantId);
        naoLidas.forEach(n -> n.setLida(true));
        notificacaoAdminRepository.saveAll(naoLidas);
    }

    private NotificacaoAdminResponse toResponse(NotificacaoAdminEntity n) {
        return NotificacaoAdminResponse.builder()
                .id(n.getId())
                .agendamentoId(n.getAgendamentoEntity() != null ? n.getAgendamentoEntity().getId() : null)
                .filaEsperaId(n.getFilaEsperaEntity() != null ? n.getFilaEsperaEntity().getId() : null)
                .titulo(n.getTitulo())
                .mensagem(n.getMensagem())
                .lida(n.getLida())
                .criadoEm(n.getCriadoEm())
                .build();
    }
}
