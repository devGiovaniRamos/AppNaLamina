package com.nalamina.api.dto.tenant;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BarbeariaPublicaResponse {
    private String nome;
    private String telefone;
    private String endereco;
    private String descricao;
}
