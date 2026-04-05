package com.nalamina.api.service;

import com.nalamina.api.dto.pagamento.PagamentoRequest;
import com.nalamina.api.dto.pagamento.PagamentoResponse;
import com.nalamina.api.entity.AgendamentoEntity;
import com.nalamina.api.entity.PagamentoEntity;
import com.nalamina.api.entity.TenantEntity;
import com.nalamina.api.entity.enums.StatusAgendamento;
import com.nalamina.api.entity.enums.StatusPagamento;
import com.nalamina.api.repository.AgendamentoRepository;
import com.nalamina.api.repository.PagamentoRepository;
import com.nalamina.api.repository.TenantRepository;
import com.nalamina.api.security.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PagamentoService {

    private final PagamentoRepository pagamentoRepository;
    private final AgendamentoRepository agendamentoRepository;
    private final TenantRepository tenantRepository;

    private BigDecimal calcularTaxa(BigDecimal valorServico, BigDecimal taxaPct) {
        if (taxaPct == null || taxaPct.compareTo(BigDecimal.ZERO) <= 0) return BigDecimal.ZERO;
        return valorServico
                .multiply(taxaPct)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    @Transactional
    public PagamentoResponse registrar(UUID agendamentoId, PagamentoRequest request) {
        UUID tenantId = TenantContextHolder.getTenantId();

        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barbearia não encontrada"));

        AgendamentoEntity agendamento = agendamentoRepository.findByIdAndTenantEntity_Id(agendamentoId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agendamento não encontrado"));

        if (pagamentoRepository.existsByAgendamentoEntity_Id(agendamentoId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Agendamento já possui pagamento registrado");
        }

        BigDecimal valorServico = agendamento.getServicoEntity().getPreco();
        BigDecimal taxaPct = tenant.getTaxaAgendamentoPct();
        BigDecimal valorTaxa = calcularTaxa(valorServico, taxaPct);
        BigDecimal valorTotal = valorServico.add(valorTaxa);

        PagamentoEntity pagamento = PagamentoEntity.builder()
                .agendamentoEntity(agendamento)
                .valor(valorTotal)
                .metodo(request.getMetodo())
                .status(StatusPagamento.PAGO)
                .pagoEm(LocalDateTime.now())
                .build();

        pagamentoRepository.save(pagamento);

        agendamento.setStatus(StatusAgendamento.CONCLUIDO);
        agendamentoRepository.save(agendamento);

        return toResponse(pagamento, valorServico, taxaPct, valorTaxa, valorTotal);
    }

    public PagamentoResponse buscarPorAgendamento(UUID agendamentoId) {
        UUID tenantId = TenantContextHolder.getTenantId();

        agendamentoRepository.findByIdAndTenantEntity_Id(agendamentoId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agendamento não encontrado"));

        PagamentoEntity pagamento = pagamentoRepository.findByAgendamentoEntity_Id(agendamentoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pagamento não encontrado"));

        BigDecimal valorServico = pagamento.getAgendamentoEntity().getServicoEntity().getPreco();
        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barbearia não encontrada"));
        BigDecimal taxaPct = tenant.getTaxaAgendamentoPct();
        BigDecimal valorTaxa = calcularTaxa(valorServico, taxaPct);
        BigDecimal valorTotal = valorServico.add(valorTaxa);

        return toResponse(pagamento, valorServico, taxaPct, valorTaxa, valorTotal);
    }

    private PagamentoResponse toResponse(
            PagamentoEntity p,
            BigDecimal valorServico,
            BigDecimal taxaPct,
            BigDecimal valorTaxa,
            BigDecimal valorTotal) {

        AgendamentoEntity a = p.getAgendamentoEntity();
        return PagamentoResponse.builder()
                .id(p.getId())
                .agendamentoId(a.getId())
                .clienteNome(a.getClienteNome())
                .servicoNome(a.getServicoEntity().getNome())
                .valorServico(valorServico)
                .taxaPct(taxaPct)
                .valorTaxa(valorTaxa)
                .valorTotal(valorTotal)
                .metodo(p.getMetodo())
                .status(p.getStatus())
                .pagoEm(p.getPagoEm())
                .criadoEm(p.getCriadoEm())
                .build();
    }
}