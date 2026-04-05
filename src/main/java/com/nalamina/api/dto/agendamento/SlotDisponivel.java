package com.nalamina.api.dto.agendamento;

import lombok.Builder;
import lombok.Data;
import java.time.LocalTime;

@Data
@Builder
public class SlotDisponivel {
    private LocalTime horaInicio;
    private LocalTime horaFim;
}