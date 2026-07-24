package com.nalamina.api.dto.estoque;

import com.nalamina.api.entity.enums.TipoMovimentoEstoque;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AjusteEstoqueRequest {

    @NotNull
    private TipoMovimentoEstoque tipo;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal quantidade;

    @Size(max = 500)
    private String observacao;
}
