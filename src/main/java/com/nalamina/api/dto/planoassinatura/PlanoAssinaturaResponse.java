package com.nalamina.api.dto.planoassinatura;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class PlanoAssinaturaResponse {
    private UUID id;
    private String nome;
    private String descricao;
    private BigDecimal precoMensal;
    private Boolean ativo;
}
