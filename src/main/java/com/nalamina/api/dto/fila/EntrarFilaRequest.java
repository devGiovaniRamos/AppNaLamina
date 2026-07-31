package com.nalamina.api.dto.fila;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class EntrarFilaRequest {

    @NotNull
    private UUID servicoId;

    @NotBlank
    private String clienteNome;

    @NotBlank
    private String clienteTel;
}
