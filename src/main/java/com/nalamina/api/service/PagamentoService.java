package com.nalamina.api.service;

import com.nalamina.api.dto.pagamento.PagamentoRequest;
import com.nalamina.api.dto.pagamento.PagamentoResponse;
import com.nalamina.api.dto.pagamento.RelatorioFinanceiroResponse;
import com.nalamina.api.entity.AgendamentoEntity;
import com.nalamina.api.entity.PagamentoEntity;
import com.nalamina.api.entity.ServicoEntity;
import com.nalamina.api.entity.TenantEntity;
import com.nalamina.api.entity.enums.MetodoPagamento;
import com.nalamina.api.entity.enums.OrigemPonto;
import com.nalamina.api.entity.enums.StatusAgendamento;
import com.nalamina.api.entity.enums.StatusPagamento;
import com.nalamina.api.entity.enums.TipoPagamento;
import com.nalamina.api.repository.AgendamentoRepository;
import com.nalamina.api.repository.PagamentoRepository;
import com.nalamina.api.repository.TenantRepository;
import com.nalamina.api.security.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PagamentoService {

    private static final LocalDateTime DATA_MINIMA = LocalDateTime.of(1970, 1, 1, 0, 0);
    private static final LocalDateTime DATA_MAXIMA = LocalDateTime.of(9999, 12, 31, 23, 59, 59);

    private final PagamentoRepository pagamentoRepository;
    private final AgendamentoRepository agendamentoRepository;
    private final TenantRepository tenantRepository;
    private final MercadoPagoService mercadoPagoService;
    private final PontuacaoService pontuacaoService;

    private BigDecimal calcularTaxa(BigDecimal valorServico, BigDecimal taxaPct) {
        if (taxaPct == null || taxaPct.compareTo(BigDecimal.ZERO) <= 0) return BigDecimal.ZERO;
        return valorServico
                .multiply(taxaPct)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal somarValorServicos(AgendamentoEntity agendamento) {
        return agendamento.getServicos().stream()
                .map(ServicoEntity::getPreco)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional
    public PagamentoResponse registrar(UUID agendamentoId, PagamentoRequest request) {
        UUID tenantId = TenantContextHolder.getTenantId();

        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barbearia não encontrada"));

        AgendamentoEntity agendamento = agendamentoRepository.findByIdAndTenantEntity_Id(agendamentoId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agendamento não encontrado"));

        if (agendamento.getStatus() != StatusAgendamento.CONFIRMADO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Agendamento precisa estar confirmado para registrar pagamento (status atual: " + agendamento.getStatus() + ")");
        }

        if (pagamentoRepository.existsByAgendamentoEntity_IdAndTipo(agendamentoId, TipoPagamento.TOTAL)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Agendamento já possui pagamento registrado");
        }

        BigDecimal valorServico = somarValorServicos(agendamento);
        BigDecimal taxaPct = tenant.getTaxaAgendamentoPct();
        BigDecimal valorTaxa = calcularTaxa(valorServico, taxaPct);
        BigDecimal valorTotal = valorServico.add(valorTaxa);

        PagamentoEntity.PagamentoEntityBuilder builder = PagamentoEntity.builder()
                .agendamentoEntity(agendamento)
                .valor(valorTotal)
                .tipo(TipoPagamento.TOTAL)
                .metodo(request.getMetodo());

        if (request.getMetodo() == MetodoPagamento.PIX) {
            MercadoPagoService.MercadoPagoPixResult pix = mercadoPagoService.criarCobrancaPix(
                    agendamento.getClienteNome(), agendamento.getClienteTel(), valorTotal, agendamentoId.toString());
            builder.status(StatusPagamento.PENDENTE)
                   .mercadoPagoPaymentId(pix.paymentId())
                   .pixCopiaECola(pix.pixCopiaECola())
                   .pixQrCodeBase64(pix.qrCodeBase64())
                   .pixExpiraEm(pix.pixExpiraEm());
        } else {
            builder.status(StatusPagamento.PAGO)
                   .pagoEm(LocalDateTime.now());
        }

        PagamentoEntity pagamento = pagamentoRepository.save(builder.build());

        if (pagamento.getStatus() == StatusPagamento.PAGO) {
            pontuacaoService.gerarPontos(tenant, agendamento.getClienteTel(), agendamento.getClienteNome(),
                    OrigemPonto.AGENDAMENTO, pagamento.getId(), valorTotal);
        }

        return toResponse(pagamento, valorServico, taxaPct, valorTaxa, valorTotal);
    }

    @Transactional
    public PagamentoResponse registrarSinal(UUID tenantId, UUID agendamentoId, MetodoPagamento metodo) {
        if (metodo != MetodoPagamento.PIX && metodo != MetodoPagamento.DINHEIRO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O sinal só pode ser pago via Pix ou Dinheiro");
        }

        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barbearia não encontrada"));

        AgendamentoEntity agendamento = agendamentoRepository.findByIdAndTenantEntity_Id(agendamentoId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agendamento não encontrado"));

        BigDecimal valorServico = somarValorServicos(agendamento);
        BigDecimal percentual = tenant.getSinalPercentual() != null ? tenant.getSinalPercentual() : BigDecimal.ZERO;
        BigDecimal valorSinal = valorServico
                .multiply(percentual)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        PagamentoEntity.PagamentoEntityBuilder builder = PagamentoEntity.builder()
                .agendamentoEntity(agendamento)
                .valor(valorSinal)
                .tipo(TipoPagamento.SINAL)
                .metodo(metodo)
                .status(StatusPagamento.PENDENTE);

        if (metodo == MetodoPagamento.PIX) {
            MercadoPagoService.MercadoPagoPixResult pix = mercadoPagoService.criarCobrancaPix(
                    agendamento.getClienteNome(), agendamento.getClienteTel(), valorSinal, agendamentoId.toString());
            builder.mercadoPagoPaymentId(pix.paymentId())
                   .pixCopiaECola(pix.pixCopiaECola())
                   .pixQrCodeBase64(pix.qrCodeBase64())
                   .pixExpiraEm(pix.pixExpiraEm());
        }

        PagamentoEntity pagamento = pagamentoRepository.save(builder.build());
        return toResponse(pagamento, valorSinal, null, BigDecimal.ZERO, valorSinal);
    }

    @Transactional
    public PagamentoResponse confirmarSinalDinheiro(UUID agendamentoId) {
        UUID tenantId = TenantContextHolder.getTenantId();

        AgendamentoEntity agendamento = agendamentoRepository.findByIdAndTenantEntity_Id(agendamentoId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agendamento não encontrado"));

        if (agendamento.getStatus() == StatusAgendamento.CANCELADO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Agendamento está cancelado");
        }

        PagamentoEntity pagamento = pagamentoRepository.findByAgendamentoEntity_IdAndTipo(agendamentoId, TipoPagamento.SINAL)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sinal não encontrado"));

        if (pagamento.getMetodo() != MetodoPagamento.DINHEIRO || pagamento.getStatus() != StatusPagamento.PENDENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Sinal não está pendente em dinheiro");
        }

        pagamento.setStatus(StatusPagamento.PAGO);
        pagamento.setPagoEm(LocalDateTime.now());
        pagamentoRepository.save(pagamento);

        return toResponse(pagamento, pagamento.getValor(), null, BigDecimal.ZERO, pagamento.getValor());
    }

    @Transactional(readOnly = true)
    public PagamentoResponse buscarPorAgendamento(UUID agendamentoId) {
        UUID tenantId = TenantContextHolder.getTenantId();

        agendamentoRepository.findByIdAndTenantEntity_Id(agendamentoId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agendamento não encontrado"));

        PagamentoEntity pagamento = pagamentoRepository.findByAgendamentoEntity_IdAndTipo(agendamentoId, TipoPagamento.TOTAL)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pagamento não encontrado"));

        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barbearia não encontrada"));

        BigDecimal valorServico = somarValorServicos(pagamento.getAgendamentoEntity());
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

        LocalDateTime inicio = dataInicio != null ? dataInicio.atStartOfDay() : DATA_MINIMA;
        LocalDateTime fim = dataFim != null ? dataFim.plusDays(1).atStartOfDay() : DATA_MAXIMA;

        return pagamentoRepository.findAllByTenant(tenantId, inicio, fim)
                .stream()
                .map(p -> {
                    BigDecimal vs = somarValorServicos(p.getAgendamentoEntity());
                    BigDecimal taxa = tenant.getTaxaAgendamentoPct();
                    BigDecimal vt = calcularTaxa(vs, taxa);
                    return toResponse(p, vs, taxa, vt, vs.add(vt));
                })
                .collect(Collectors.toList());
    }

    public RelatorioFinanceiroResponse relatorio(LocalDate dataInicio, LocalDate dataFim) {
        UUID tenantId = TenantContextHolder.getTenantId();
        LocalDateTime inicio = dataInicio != null ? dataInicio.atStartOfDay() : DATA_MINIMA;
        LocalDateTime fim = dataFim != null ? dataFim.plusDays(1).atStartOfDay() : DATA_MAXIMA;

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
    public void confirmarPagamento(String mercadoPagoPaymentId) {
        PagamentoEntity pagamento = pagamentoRepository.findByMercadoPagoPaymentId(mercadoPagoPaymentId)
                .orElse(null);
        if (pagamento == null || pagamento.getStatus() == StatusPagamento.PAGO) return;

        pagamento.setStatus(StatusPagamento.PAGO);
        pagamento.setPagoEm(LocalDateTime.now());
        pagamentoRepository.save(pagamento);

        if (pagamento.getTipo() == TipoPagamento.SINAL) {
            // sinal pago só confirma o dinheiro; o aceite do agendamento continua manual pelo barbeiro
            return;
        }

        AgendamentoEntity agendamento = pagamento.getAgendamentoEntity();
        agendamento.setStatus(StatusAgendamento.CONCLUIDO);
        agendamentoRepository.save(agendamento);

        pontuacaoService.gerarPontos(agendamento.getTenantEntity(), agendamento.getClienteTel(), agendamento.getClienteNome(),
                OrigemPonto.AGENDAMENTO, pagamento.getId(), pagamento.getValor());
    }

    @Transactional
    public void processarCancelamento(AgendamentoEntity agendamento, TenantEntity tenant, boolean canceladoPeloCliente) {
        PagamentoEntity sinal = pagamentoRepository
                .findByAgendamentoEntity_IdAndTipo(agendamento.getId(), TipoPagamento.SINAL)
                .orElse(null);
        if (sinal == null || sinal.getStatus() != StatusPagamento.PAGO) return;

        boolean elegivelReembolso = !canceladoPeloCliente || horasAteAgendamento(agendamento) >= tenant.getJanelaCancelamentoHoras();
        if (!elegivelReembolso) {
            log.info("Sinal do agendamento {} retido: cancelamento do cliente fora da janela de {}h",
                    agendamento.getId(), tenant.getJanelaCancelamentoHoras());
            return;
        }

        if (sinal.getMetodo() == MetodoPagamento.PIX) {
            boolean estornado = mercadoPagoService.estornarPagamento(sinal.getMercadoPagoPaymentId());
            if (estornado) {
                sinal.setStatus(StatusPagamento.REEMBOLSADO);
                pagamentoRepository.save(sinal);
            } else {
                log.error("Falha ao estornar sinal PIX {} do agendamento {} — requer acompanhamento manual",
                        sinal.getMercadoPagoPaymentId(), agendamento.getId());
            }
        } else {
            sinal.setStatus(StatusPagamento.REEMBOLSADO);
            pagamentoRepository.save(sinal);
        }
    }

    private long horasAteAgendamento(AgendamentoEntity agendamento) {
        LocalDateTime dataHora = LocalDateTime.of(agendamento.getData(), agendamento.getHoraInicio());
        return Duration.between(LocalDateTime.now(), dataHora).toHours();
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
                .servicoNome(a.getServicos().stream().map(ServicoEntity::getNome).collect(Collectors.joining(", ")))
                .valorServico(valorServico)
                .taxaPct(taxaPct)
                .valorTaxa(valorTaxa)
                .valorTotal(valorTotal)
                .metodo(p.getMetodo())
                .status(p.getStatus())
                .tipo(p.getTipo())
                .pagoEm(p.getPagoEm())
                .criadoEm(p.getCriadoEm())
                .pixCopiaECola(p.getPixCopiaECola())
                .pixQrCodeBase64(p.getPixQrCodeBase64())
                .pixExpiraEm(p.getPixExpiraEm())
                .build();
    }
}
