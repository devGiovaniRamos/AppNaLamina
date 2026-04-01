package com.nalamina.api.dto.tenant;

import lombok.Builder;
import lombok.Data;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class BarbeariaResponse {

    private UUID id;
    private String nome;
    private String telefone;
    private String cnpj;
    private String email;
    private String endereco;
    private String descricao;
    private List<HorarioResponse> horarios;

    @Data
    @Builder
    public static class HorarioResponse {
        private Integer diaSemana;
        private Boolean aberto;
        private LocalTime horaInicio1;
        private LocalTime horaFim1;
        private LocalTime horaInicio2;
        private LocalTime horaFim2;
    }
}