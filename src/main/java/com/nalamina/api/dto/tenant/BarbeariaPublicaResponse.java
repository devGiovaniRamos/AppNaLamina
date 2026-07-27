package com.nalamina.api.dto.tenant;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class BarbeariaPublicaResponse {
    private String nome;
    private String telefone;
    private String endereco;
    private String descricao;
    private Boolean sinalObrigatorio;
    private BigDecimal sinalPercentual;
    private Integer janelaCancelamentoHoras;
}
