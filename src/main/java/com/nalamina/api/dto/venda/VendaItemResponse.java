package com.nalamina.api.dto.venda;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class VendaItemResponse {
    private UUID produtoId;
    private String produtoNome;
    private String produtoSku;
    private BigDecimal quantidade;
    private BigDecimal precoUnitario;
    private BigDecimal subtotal;
}
