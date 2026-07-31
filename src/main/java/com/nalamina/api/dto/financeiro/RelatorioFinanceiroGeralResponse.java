package com.nalamina.api.dto.financeiro;

import com.nalamina.api.entity.enums.MetodoPagamento;
import com.nalamina.api.entity.enums.TipoMovimentoFinanceiro;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@Data
@Builder
public class RelatorioFinanceiroGeralResponse {
    private LocalDate inicio;
    private LocalDate fim;
    private BigDecimal totalFaturado;
    private long quantidadeMovimentos;
    private BigDecimal ticketMedio;
    private Map<MetodoPagamento, BigDecimal> porMetodo;
    private Map<TipoMovimentoFinanceiro, BigDecimal> porTipo;
}
