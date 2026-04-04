package com.nalamina.api.dto.agendamento;

import com.nalamina.api.entity.enums.StatusAgendamento;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AgendamentoStatusRequest {
    @NotNull
    private StatusAgendamento status;
}