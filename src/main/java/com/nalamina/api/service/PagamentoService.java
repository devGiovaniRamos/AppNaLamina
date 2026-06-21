package com.nalamina.api.service;

import com.nalamina.api.dto.pagamento.PagamentoRequest;
import com.nalamina.api.dto.pagamento.PagamentoResponse;
import com.nalamina.api.dto.pagamento.RelatorioFinanceiroResponse;
import com.nalamina.api.entity.AgendamentoEntity;
import com.nalamina.api.entity.PagamentoEntity;
import com.nalamina.api.entity.TenantEntity;
import com.nalamina.api.entity.enums.MetodoPagamento;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PagamentoService {

    private final PagamentoRepository pagamentoRepository;
    private final AgendamentoRepository agendamentoRepository;
    private final TenantRepository tenantRepository;
    private final PagarmeService pagarmeService;

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

        PagamentoEntity.PagamentoEntityBuilder builder = PagamentoEntity.builder()
                .agendamentoEntity(agendamento)
                .valor(valorTotal)
                .metodo(request.getMetodo());

        if (request.getMetodo() == MetodoPagamento.PIX) {
            PagarmeService.PagarmePixResult pix = pagarmeService.criarCobrancaPix(
                    agendamento.getClienteNome(), valorTotal, agendamentoId);
            builder.status(StatusPagamento.PENDENTE)
                   .pagarmeChargeId(pix.chargeId())
                   .pixCopiaECola(pix.pixCopiaECola())
                   .pixExpiraEm(pix.pixExpiraEm());
        } else {
            builder.status(StatusPagamento.PAGO)
                   .pagoEm(LocalDateTime.now());
        }

        PagamentoEntity pagamento = pagamentoRepository.save(builder.build());
        return toResponse(pagamento, valorServico, taxaPct, valorTaxa, valorTotal);
    }

    @Transactional(readOnly = true)
    public PagamentoResponse buscarPorAgendamento(UUID agendamentoId) {
        UUID tenantId = TenantContextHolder.getTenantId();

        agendamentoRepository.findByIdAndTenantEntity_Id(agendamentoId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agendamento não encontrado"));

        PagamentoEntity pagamento = pagamentoRepository.findByAgendamentoEntity_Id(agendamentoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pagamento não encontrado"));

        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barbearia não encontrada"));

        BigDecimal valorServico = pagamento.getAgendamentoEntity().getServicoEntity().getPreco();
        BigDecimal taxaPct = tenant.getTaxaAgendamentoPct();
        BigDecimal valorTaxa = calcularTaxa(valorServico, taxaPct);
        BigDecimal valorTotal = valorServico.add(valorTaxa);

        return toResponse(pagamento, valorServico, taxaPct, valorTaxa, valorTotal);
    }

    @Transactional(readOnly = true)
    public List<PagamentoResponse> listar(LocalDate dataInicio, LocalDate dataFim) {
        UUID tenantId = TenantContextHolder.getTenantId();
        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barbearia não encontrada"));

        LocalDateTime inicio = dataInicio != null ? dataInicio.atStartOfDay() : null;
        LocalDateTime fim = dataFim != null ? dataFim.plusDays(1).atStartOfDay() : null;

        return pagamentoRepository.findAllByTenant(tenantId, inicio, fim)
                .stream()
                .map(p -> {
                    BigDecimal vs = p.getAgendamentoEntity().getServicoEntity().getPreco();
                    BigDecimal taxa = tenant.getTaxaAgendamentoPct();
                    BigDecimal vt = calcularTaxa(vs, taxa);
                    return toResponse(p, vs, taxa, vt, vs.add(vt));
                })
                .collect(Collectors.toList());
    }

    public RelatorioFinanceiroResponse relatorio(LocalDate dataInicio, LocalDate dataFim) {
        UUID tenantId = TenantContextHolder.getTenantId();
        LocalDateTime inicio = dataInicio != null ? dataInicio.atStartOfDay() : null;
        LocalDateTime fim = dataFim != null ? dataFim.plusDays(1).atStartOfDay() : null;

        List<PagamentoEntity> pagamentos = pagamentoRepository.findAllByTenant(tenantId, inicio, fim)
                .stream()
                .filter(p -> p.getStatus() == StatusPagamento.PAGO)
                .collect(Collectors.toList());

        BigDecimal totalFaturado = pagamentos.stream()
                .map(PagamentoEntity::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<MetodoPagamento, BigDecimal> porMetodo = pagamentos.stream()
                .collect(Collectors.groupingBy(
                        PagamentoEntity::getMetodo,
                        Collectors.reducing(BigDecimal.ZERO, PagamentoEntity::getValor, BigDecimal::add)));

        long quantidade = pagamentos.size();
        BigDecimal ticketMedio = quantidade > 0
                ? totalFaturado.divide(BigDecimal.valueOf(quantidade), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return RelatorioFinanceiroResponse.builder()
                .inicio(dataInicio)
                .fim(dataFim)
                .totalFaturado(totalFaturado)
                .quantidadePagamentos(quantidade)
                .ticketMedio(ticketMedio)
                .porMetodo(porMetodo)
                .build();
    }

    @Transactional
    public void confirmarPagamento(String pagarmeChargeId) {
        PagamentoEntity pagamento = pagamentoRepository.findByPagarmeChargeId(pagarmeChargeId)
                .orElse(null);
        if (pagamento == null || pagamento.getStatus() == StatusPagamento.PAGO) return;

        pagamento.setStatus(StatusPagamento.PAGO);
        pagamento.setPagoEm(LocalDateTime.now());
        pagamentoRepository.save(pagamento);

        AgendamentoEntity agendamento = pagamento.getAgendamentoEntity();
        agendamento.setStatus(StatusAgendamento.CONCLUIDO);
        agendamentoRepository.save(agendamento);
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
                .agendamentoData(a.getData())
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
                .pixCopiaECola(p.getPixCopiaECola())
                .pixExpiraEm(p.getPixExpiraEm())
                .build();
    }
}
