package com.nalamina.api.dto.notificacao;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ContagemNaoLidasResponse {
    private long naoLidas;
}
