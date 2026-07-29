package com.nalamina.api.dto.planoassinatura;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PlanoAssinaturaRequest {

    @NotBlank
    @Size(max = 100)
    private String nome;

    @NotBlank
    private String descricao;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal precoMensal;
}
