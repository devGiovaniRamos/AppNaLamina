package com.nalamina.api.dto.cliente;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ClienteConhecidoResponse {
    private boolean conhecido;
    private String nome;
    private String telefoneNormalizado;
}
