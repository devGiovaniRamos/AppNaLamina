package com.nalamina.api.dto.tenant;

import lombok.Data;
import java.time.LocalTime;

@Data
public class HorarioTodosRequest {
    private Boolean aberto;
    private LocalTime horaInicio1;
    private LocalTime horaFim1;
    private LocalTime horaInicio2;
    private LocalTime horaFim2;
}