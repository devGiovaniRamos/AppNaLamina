package com.nalamina.api.dto.agendamento;

import com.nalamina.api.entity.enums.MetodoPagamento;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
public class PublicAgendamentoRequest {

    @NotBlank(message = "Nome do cliente é obrigatório")
    private String clienteNome;

    @NotBlank(message = "Telefone do cliente é obrigatório")
    private String clienteTel;

    @NotNull(message = "Serviço é obrigatório")
    private UUID servicoId;

    private UUID profissionalId;

    @NotNull(message = "Data é obrigatória")
    private LocalDate data;

    @NotNull(message = "Hora de início é obrigatória")
    private LocalTime horaInicio;

    @NotNull(message = "Hora de fim é obrigatória")
    private LocalTime horaFim;

    private String observacao;

    private MetodoPagamento metodoSinal;
}