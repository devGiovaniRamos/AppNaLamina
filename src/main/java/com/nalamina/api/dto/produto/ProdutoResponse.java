package com.nalamina.api.dto.produto;

import com.nalamina.api.entity.enums.CategoriaProduto;
import com.nalamina.api.entity.enums.TipoUsoProduto;
import com.nalamina.api.entity.enums.UnidadeMedida;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ProdutoResponse {
    private UUID id;
    private String nome;
    private CategoriaProduto categoria;
    private TipoUsoProduto tipoUso;
    private UnidadeMedida unidadeMedida;
    private BigDecimal estoqueAtual;
    private BigDecimal estoqueMinimo;
    private BigDecimal precoVenda;
    private Boolean estoqueBaixo;
    private Boolean ativo;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;
}
