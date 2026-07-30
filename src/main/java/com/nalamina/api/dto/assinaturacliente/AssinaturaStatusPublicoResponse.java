package com.nalamina.api.dto.assinaturacliente;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AssinaturaStatusPublicoResponse {
    private boolean assinante;
    private String planoNome;
    private Long diasRestantes;
}
