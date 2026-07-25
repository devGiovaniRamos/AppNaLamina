package com.nalamina.api.dto.venda;

import com.nalamina.api.entity.enums.MetodoPagamento;
import com.nalamina.api.entity.enums.StatusVenda;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class VendaResponse {
    private UUID id;
    private String clienteNome;
    private MetodoPagamento metodo;
    private StatusVenda status;
    private String motivoCancelamento;
    private BigDecimal valorTotal;
    private List<VendaItemResponse> itens;
    private LocalDateTime criadoEm;
}
