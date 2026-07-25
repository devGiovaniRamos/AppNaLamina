package com.nalamina.api.dto.venda;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class VendaItemRequest {

    @NotNull
    private UUID produtoId;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal quantidade;
}
