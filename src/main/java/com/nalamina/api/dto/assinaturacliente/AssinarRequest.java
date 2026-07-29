package com.nalamina.api.dto.assinaturacliente;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AssinarRequest {

    @NotNull
    private UUID planoId;

    @NotBlank
    private String clienteNome;

    @NotBlank
    private String clienteTel;
}
