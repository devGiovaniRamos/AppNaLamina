package com.nalamina.api.dto.pagamento;

import com.nalamina.api.entity.enums.MetodoPagamento;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@Data
@Builder
public class RelatorioFinanceiroResponse {
    private LocalDate inicio;
    private LocalDate fim;
    private BigDecimal totalFaturado;
    private long quantidadePagamentos;
    private BigDecimal ticketMedio;
    private Map<MetodoPagamento, BigDecimal> porMetodo;
}
