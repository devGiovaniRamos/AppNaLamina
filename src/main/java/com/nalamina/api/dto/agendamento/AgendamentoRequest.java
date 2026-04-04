package com.nalamina.api.dto.agendamento;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
public class AgendamentoRequest {

    @NotNull
    private UUID servicoId;

    private UUID profissionalId;

    @NotBlank
    @Size(max = 100)
    private String clienteNome;

    @Size(max = 20)
    private String clienteTel;

    @NotNull
    private LocalDate data;

    @NotNull
    private LocalTime horaInicio;

    @NotNull
    private LocalTime horaFim;

    @Size(max = 500)
    private String observacao;
}