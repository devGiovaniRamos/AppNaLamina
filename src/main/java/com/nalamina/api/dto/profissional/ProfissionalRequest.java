package com.nalamina.api.dto.profissional;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProfissionalRequest {

    @NotBlank
    @Size(max = 100)
    private String nome;

    @Size(max = 255)
    private String fotoUrl;
}