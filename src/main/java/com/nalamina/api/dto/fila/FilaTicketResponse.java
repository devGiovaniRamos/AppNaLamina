package com.nalamina.api.dto.fila;

import com.nalamina.api.entity.enums.StatusFila;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class FilaTicketResponse {
    private UUID id;
    private Integer numeroTicket;
    private String clienteNome;
    private String clienteTel;
    private String servicoNome;
    private StatusFila status;
    private Integer posicao;
    private Integer pessoasNaFrente;
    private LocalDateTime criadoEm;
}
