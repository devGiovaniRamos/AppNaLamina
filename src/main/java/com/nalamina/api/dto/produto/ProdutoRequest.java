package com.nalamina.api.dto.produto;

import com.nalamina.api.entity.enums.CategoriaProduto;
import com.nalamina.api.entity.enums.TipoUsoProduto;
import com.nalamina.api.entity.enums.UnidadeMedida;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProdutoRequest {

    @NotBlank
    @Size(max = 100)
    private String nome;

    @NotNull
    private CategoriaProduto categoria;

    @NotNull
    private TipoUsoProduto tipoUso;

    @NotNull
    private UnidadeMedida unidadeMedida;

    @NotNull
    @DecimalMin(value = "0.00")
    private BigDecimal estoqueAtual;

    @NotNull
    @DecimalMin(value = "0.00")
    private BigDecimal estoqueMinimo;

    @DecimalMin(value = "0.01")
    private BigDecimal precoVenda;
}
