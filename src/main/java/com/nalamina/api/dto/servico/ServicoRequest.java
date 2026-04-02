package com.nalamina.api.dto.servico;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ServicoRequest {

    @NotBlank
    @Size(max = 100)
    private String nome;

    private String descricao;

    @NotNull
    @Min(1)
    private Integer duracaoMin;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal preco;
}