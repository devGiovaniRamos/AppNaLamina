package com.nalamina.api.service;

import com.nalamina.api.dto.financeiro.MovimentoFinanceiroResponse;
import com.nalamina.api.dto.financeiro.RelatorioFinanceiroGeralResponse;
import com.nalamina.api.entity.AssinaturaClienteEntity;
import com.nalamina.api.entity.PagamentoEntity;
import com.nalamina.api.entity.VendaEntity;
import com.nalamina.api.entity.enums.MetodoPagamento;
import com.nalamina.api.entity.enums.StatusAssinatura;
import com.nalamina.api.entity.enums.StatusPagamento;
import com.nalamina.api.entity.enums.StatusVenda;
import com.nalamina.api.entity.enums.TipoMovimentoFinanceiro;
import com.nalamina.api.entity.ServicoEntity;
import com.nalamina.api.repository.AssinaturaClienteRepository;
import com.nalamina.api.repository.PagamentoRepository;
import com.nalamina.api.repository.VendaRepository;
import com.nalamina.api.security.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Agrega toda a movimentação financeira do tenant (pagamentos de agendamento, vendas do PDV e
 * mensalidades de assinatura) em uma única visão. AssinaturaClienteEntity não guarda histórico de
 * cobranças — é uma linha por cliente atualizada a cada ciclo — então cada assinatura só aparece
 * aqui representando seu ciclo mais recente (via atualizadoEm), não o histórico completo de cobranças.
 */
@Service
@RequiredArgsConstructor
public class FinanceiroService {

    private static final LocalDateTime DATA_MINIMA = LocalDateTime.of(1970, 1, 1, 0, 0);
    private static final LocalDateTime DATA_MAXIMA = LocalDateTime.of(9999, 12, 31, 23, 59, 59);

    private final PagamentoRepository pagamentoRepository;
    private final VendaRepository vendaRepository;
    private final AssinaturaClienteRepository assinaturaClienteRepository;

    @Transactional(readOnly = true)
    public List<MovimentoFinanceiroResponse> listar(LocalDate dataInicio, LocalDate dataFim) {
        UUID tenantId = TenantContextHolder.getTenantId();
        LocalDateTime inicio = dataInicio != null ? dataInicio.atStartOfDay() : DATA_MINIMA;
        LocalDateTime fim = dataFim != null ? dataFim.plusDays(1).atStartOfDay() : DATA_MAXIMA;

        Stream<MovimentoFinanceiroResponse> deAgendamentos = pagamentoRepository
                .findAllByTenant(tenantId, inicio, fim).stream().map(this::deAgendamento);

        Stream<MovimentoFinanceiroResponse> deVendas = vendaRepository
                .findAllByTenant(tenantId, inicio, fim).stream().map(this::deVenda);

        Stream<MovimentoFinanceiroResponse> deAssinaturas = assinaturaClienteRepository
                .findByPlano_TenantEntity_Id(tenantId).stream()
                .filter(a -> a.getStatus() == StatusAssinatura.ATIVA
                        && a.getAtualizadoEm() != null
                        && !a.getAtualizadoEm().isBefore(inicio)
                        && a.getAtualizadoEm().isBefore(fim))
                .map(this::deAssinatura);

        return Stream.of(deAgendamentos, deVendas, deAssinaturas)
                .flatMap(s -> s)
                .sorted(Comparator.comparing(MovimentoFinanceiroResponse::getData).reversed())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RelatorioFinanceiroGeralResponse relatorio(LocalDate dataInicio, LocalDate dataFim) {
        List<MovimentoFinanceiroResponse> pagos = listar(dataInicio, dataFim).stream()
                .filter(this::isPago)
                .collect(Collectors.toList());

        BigDecimal totalFaturado = pagos.stream()
                .map(MovimentoFinanceiroResponse::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<MetodoPagamento, BigDecimal> porMetodo = pagos.stream()
                .filter(m -> m.getMetodo() != null)
                .collect(Collectors.groupingBy(
                        MovimentoFinanceiroResponse::getMetodo,
                        () -> new EnumMap<>(MetodoPagamento.class),
                        Collectors.reducing(BigDecimal.ZERO, MovimentoFinanceiroResponse::getValor, BigDecimal::add)));

        Map<TipoMovimentoFinanceiro, BigDecimal> porTipo = pagos.stream()
                .collect(Collectors.groupingBy(
                        MovimentoFinanceiroResponse::getTipo,
                        () -> new EnumMap<>(TipoMovimentoFinanceiro.class),
                        Collectors.reducing(BigDecimal.ZERO, MovimentoFinanceiroResponse::getValor, BigDecimal::add)));

        long quantidade = pagos.size();
        BigDecimal ticketMedio = quantidade > 0
                ? totalFaturado.divide(BigDecimal.valueOf(quantidade), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return RelatorioFinanceiroGeralResponse.builder()
                .inicio(dataInicio)
                .fim(dataFim)
                .totalFaturado(totalFaturado)
                .quantidadeMovimentos(quantidade)
                .ticketMedio(ticketMedio)
                .porMetodo(porMetodo)
                .porTipo(porTipo)
                .build();
    }

    private boolean isPago(MovimentoFinanceiroResponse m) {
        return switch (m.getTipo()) {
            case AGENDAMENTO -> StatusPagamento.PAGO.name().equals(m.getStatus());
            case VENDA -> StatusVenda.CONCLUIDA.name().equals(m.getStatus());
            case ASSINATURA -> StatusAssinatura.ATIVA.name().equals(m.getStatus());
        };
    }

    private MovimentoFinanceiroResponse deAgendamento(PagamentoEntity p) {
        String servicos = p.getAgendamentoEntity().getServicos().stream()
                .map(ServicoEntity::getNome)
                .collect(Collectors.joining(", "));
        return MovimentoFinanceiroResponse.builder()
                .id(p.getId())
                .tipo(TipoMovimentoFinanceiro.AGENDAMENTO)
                .descricao(servicos)
                .clienteNome(p.getAgendamentoEntity().getClienteNome())
                .metodo(p.getMetodo())
                .valor(p.getValor())
                .status(p.getStatus().name())
                .data(p.getPagoEm() != null ? p.getPagoEm() : p.getCriadoEm())
                .build();
    }

    private MovimentoFinanceiroResponse deVenda(VendaEntity v) {
        String descricao = v.getItens().stream()
                .map(item -> item.getProdutoEntity().getNome() + " x" + item.getQuantidade())
                .collect(Collectors.joining(", "));
        return MovimentoFinanceiroResponse.builder()
                .id(v.getId())
                .tipo(TipoMovimentoFinanceiro.VENDA)
                .descricao(descricao.isBlank() ? "Venda de produtos" : descricao)
                .clienteNome(v.getClienteNome() != null ? v.getClienteNome() : "Cliente balcão")
                .metodo(v.getMetodo())
                .valor(v.getValorTotal())
                .status(v.getStatus().name())
                .data(v.getCriadoEm())
                .build();
    }

    private MovimentoFinanceiroResponse deAssinatura(AssinaturaClienteEntity a) {
        return MovimentoFinanceiroResponse.builder()
                .id(a.getId())
                .tipo(TipoMovimentoFinanceiro.ASSINATURA)
                .descricao("Mensalidade - " + a.getPlano().getNome())
                .clienteNome(a.getClienteNome())
                .metodo(a.getMercadoPagoPaymentId() != null ? MetodoPagamento.PIX : null)
                .valor(a.getPlano().getPrecoMensal())
                .status(a.getStatus().name())
                .data(a.getAtualizadoEm())
                .build();
    }
}
