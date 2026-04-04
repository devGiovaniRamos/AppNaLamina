package com.nalamina.api.dto.agendamento;

import com.nalamina.api.entity.enums.StatusAgendamento;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
public class AgendamentoResponse {
    private UUID id;
    private UUID servicoId;
    private String servicoNome;
    private UUID profissionalId;
    private String profissionalNome;
    private String clienteNome;
    private String clienteTel;
    private LocalDate data;
    private LocalTime horaInicio;
    private LocalTime horaFim;
    private StatusAgendamento status;
    private String observacao;
    private LocalDateTime criadoEm;
}