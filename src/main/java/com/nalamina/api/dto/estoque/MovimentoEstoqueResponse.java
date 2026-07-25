package com.nalamina.api.dto.estoque;

import com.nalamina.api.entity.enums.TipoMovimentoEstoque;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MovimentoEstoqueResponse {
    private UUID id;
    private UUID produtoId;
    private String produtoNome;
    private TipoMovimentoEstoque tipo;
    private BigDecimal quantidade;
    private BigDecimal saldoApos;
    private String observacao;
    private LocalDateTime criadoEm;
}
