package com.nalamina.api.dto.campeonato;

import com.nalamina.api.entity.enums.TipoCampeonato;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CampeonatoRequest {

    @NotNull
    private TipoCampeonato tipo;

    @NotNull
    @DecimalMin(value = "0.01", message = "Valor por ponto deve ser maior que zero")
    private BigDecimal valorPorPonto;

    @Size(max = 1000)
    private String premiacao;
}
