package com.nalamina.api.dto.tenant;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalTime;

@Data
public class HorarioFuncionamentoRequest {

    @NotNull
    @Min(0) @Max(6)
    private Integer diaSemana; // 0=domingo ... 6=sábado

    @NotNull
    private Boolean aberto;

    private LocalTime horaInicio1;
    private LocalTime horaFim1;
    private LocalTime horaInicio2;
    private LocalTime horaFim2;
}