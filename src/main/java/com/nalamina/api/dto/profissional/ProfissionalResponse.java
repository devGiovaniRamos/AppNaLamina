package com.nalamina.api.dto.profissional;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class ProfissionalResponse {
    private UUID id;
    private String nome;
    private String fotoUrl;
    private Boolean ativo;
}