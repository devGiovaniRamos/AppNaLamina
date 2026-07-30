package com.nalamina.api.service;

import com.nalamina.api.dto.fila.EntrarFilaRequest;
import com.nalamina.api.dto.fila.FilaTicketResponse;
import com.nalamina.api.entity.FilaEsperaEntity;
import com.nalamina.api.entity.ServicoEntity;
import com.nalamina.api.entity.enums.StatusFila;
import com.nalamina.api.repository.FilaEsperaRepository;
import com.nalamina.api.repository.ServicoRepository;
import com.nalamina.api.security.TenantContextHolder;
import com.nalamina.api.util.TelefoneUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FilaEsperaService {

    private static final List<StatusFila> STATUS_ATIVOS = List.of(StatusFila.AGUARDANDO, StatusFila.EM_ATENDIMENTO);

    private final FilaEsperaRepository filaEsperaRepository;
    private final ServicoRepository servicoRepository;
    private final NotificacaoAdminService notificacaoAdminService;

    @Transactional
    public FilaTicketResponse entrar(UUID tenantId, EntrarFilaRequest request) {
        String clienteTel = TelefoneUtil.normalizar(request.getClienteTel());

        filaEsperaRepository
                .findFirstByTenantEntity_IdAndClienteTelAndStatusInOrderByCriadoEmDesc(tenantId, clienteTel, STATUS_ATIVOS)
                .ifPresent(existente -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Este telefone já está na fila de espera");
                });

        ServicoEntity servico = servicoRepository.findByIdAndTenantEntity_Id(request.getServicoId(), tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado"));

        int proximoTicket = filaEsperaRepository.buscarMaiorTicketDoDia(tenantId, LocalDate.now().atStartOfDay())
                .map(n -> n + 1).orElse(1);

        FilaEsperaEntity ticket = FilaEsperaEntity.builder()
                .tenantEntity(servico.getTenantEntity())
                .numeroTicket(proximoTicket)
                .clienteNome(request.getClienteNome())
                .clienteTel(clienteTel)
                .servicoEntity(servico)
                .build();

        filaEsperaRepository.save(ticket);
        notificacaoAdminService.notificarEntradaFila(tenantId, ticket);
        return buscarComPosicao(ticket.getId(), tenantId);
    }

    @Transactional(readOnly = true)
    public FilaTicketResponse statusPublico(UUID tenantId, String clienteTelBruto) {
        String clienteTel = TelefoneUtil.normalizar(clienteTelBruto);
        return filaEsperaRepository
                .findFirstByTenantEntity_IdAndClienteTelAndStatusInOrderByCriadoEmDesc(tenantId, clienteTel, STATUS_ATIVOS)
                .map(t -> buscarComPosicao(t.getId(), tenantId))
                .orElse(null);
    }

    @Transactional
    public void sairDaFila(UUID tenantId, UUID id, String clienteTelBruto) {
        String clienteTel = TelefoneUtil.normalizar(clienteTelBruto);
        FilaEsperaEntity ticket = filaEsperaRepository.findByIdAndTenantEntity_Id(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket não encontrado"));

        if (!ticket.getClienteTel().equals(clienteTel)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este ticket não pertence a esse telefone");
        }

        ticket.setStatus(StatusFila.CANCELADO);
        filaEsperaRepository.save(ticket);
    }

    @Transactional(readOnly = true)
    public List<FilaTicketResponse> listar() {
        UUID tenantId = TenantContextHolder.getTenantId();
        List<FilaEsperaEntity> ativos = filaEsperaRepository.findByTenantEntity_IdAndStatusInOrderByCriadoEmAsc(tenantId, STATUS_ATIVOS);
        Map<UUID, Integer> posicoes = calcularPosicoes(ativos);
        return ativos.stream().map(t -> toResponse(t, posicoes.get(t.getId()))).toList();
    }

    @Transactional
    public FilaTicketResponse chamar(UUID id) {
        UUID tenantId = TenantContextHolder.getTenantId();
        FilaEsperaEntity ticket = buscarAdmin(id, tenantId);
        if (ticket.getStatus() != StatusFila.AGUARDANDO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ticket não está aguardando");
        }
        ticket.setStatus(StatusFila.EM_ATENDIMENTO);
        ticket.setIniciadoEm(java.time.LocalDateTime.now());
        filaEsperaRepository.save(ticket);
        return buscarComPosicao(ticket.getId(), tenantId);
    }

    @Transactional
    public FilaTicketResponse finalizar(UUID id) {
        UUID tenantId = TenantContextHolder.getTenantId();
        FilaEsperaEntity ticket = buscarAdmin(id, tenantId);
        ticket.setStatus(StatusFila.CONCLUIDO);
        ticket.setConcluidoEm(java.time.LocalDateTime.now());
        filaEsperaRepository.save(ticket);
        return toResponse(ticket, null);
    }

    @Transactional
    public FilaTicketResponse remover(UUID id) {
        UUID tenantId = TenantContextHolder.getTenantId();
        FilaEsperaEntity ticket = buscarAdmin(id, tenantId);
        ticket.setStatus(StatusFila.CANCELADO);
        filaEsperaRepository.save(ticket);
        return toResponse(ticket, null);
    }

    private FilaEsperaEntity buscarAdmin(UUID id, UUID tenantId) {
        return filaEsperaRepository.findByIdAndTenantEntity_Id(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket não encontrado"));
    }

    private FilaTicketResponse buscarComPosicao(UUID ticketId, UUID tenantId) {
        List<FilaEsperaEntity> ativos = filaEsperaRepository.findByTenantEntity_IdAndStatusInOrderByCriadoEmAsc(tenantId, STATUS_ATIVOS);
        Map<UUID, Integer> posicoes = calcularPosicoes(ativos);
        FilaEsperaEntity ticket = ativos.stream().filter(t -> t.getId().equals(ticketId)).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket não encontrado"));
        return toResponse(ticket, posicoes.get(ticketId));
    }

    /**
     * Só tickets AGUARDANDO ganham posição sequencial — quem está EM_ATENDIMENTO já não está mais
     * "esperando a vez", então não ocupa nem conta posição pra quem vem depois.
     */
    private Map<UUID, Integer> calcularPosicoes(List<FilaEsperaEntity> ticketsOrdenados) {
        Map<UUID, Integer> posicoes = new LinkedHashMap<>();
        int posicao = 1;
        for (FilaEsperaEntity t : ticketsOrdenados) {
            if (t.getStatus() == StatusFila.AGUARDANDO) {
                posicoes.put(t.getId(), posicao++);
            }
        }
        return posicoes;
    }

    private FilaTicketResponse toResponse(FilaEsperaEntity t, Integer posicao) {
        return FilaTicketResponse.builder()
                .id(t.getId())
                .numeroTicket(t.getNumeroTicket())
                .clienteNome(t.getClienteNome())
                .clienteTel(t.getClienteTel())
                .servicoNome(t.getServicoEntity().getNome())
                .status(t.getStatus())
                .posicao(posicao)
                .pessoasNaFrente(posicao != null ? posicao - 1 : null)
                .criadoEm(t.getCriadoEm())
                .build();
    }
}
