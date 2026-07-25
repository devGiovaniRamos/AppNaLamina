package com.nalamina.api.dto.estoque;

import com.nalamina.api.dto.produto.ProdutoResponse;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class RelatorioEstoqueResponse {
    private LocalDate inicio;
    private LocalDate fim;
    private long totalProdutosAtivos;
    private long produtosComEstoqueBaixo;
    private BigDecimal valorTotalEstoque;
    private BigDecimal totalEntradas;
    private BigDecimal totalSaidas;
    private long quantidadeMovimentos;
    private List<ProdutoResponse> produtosBaixoEstoque;
}
