package com.nalamina.api.dto.pagamento;

import com.nalamina.api.entity.enums.MetodoPagamento;
import com.nalamina.api.entity.enums.StatusPagamento;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PagamentoResponse {
    private UUID id;
    private UUID agendamentoId;
    private String clienteNome;
    private String servicoNome;
    private BigDecimal valorServico;
    private BigDecimal taxaPct;
    private BigDecimal valorTaxa;
    private BigDecimal valorTotal;
    private MetodoPagamento metodo;
    private StatusPagamento status;
    private LocalDateTime pagoEm;
    private LocalDateTime criadoEm;
}