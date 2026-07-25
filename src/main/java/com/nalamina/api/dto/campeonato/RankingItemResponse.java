package com.nalamina.api.dto.campeonato;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RankingItemResponse {
    private int posicao;
    private String clienteNome;
    private String clienteTel;
    private long pontos;
}
