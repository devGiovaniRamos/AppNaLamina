package com.nalamina.api.dto.financeiro;

import com.nalamina.api.entity.enums.MetodoPagamento;
import com.nalamina.api.entity.enums.TipoMovimentoFinanceiro;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MovimentoFinanceiroResponse {
    private UUID id;
    private TipoMovimentoFinanceiro tipo;
    private String descricao;
    private String clienteNome;
    private MetodoPagamento metodo;
    private BigDecimal valor;
    private String status;
    private LocalDateTime data;
}
