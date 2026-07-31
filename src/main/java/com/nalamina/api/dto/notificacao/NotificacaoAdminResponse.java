package com.nalamina.api.dto.notificacao;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificacaoAdminResponse {
    private UUID id;
    private UUID agendamentoId;
    private UUID filaEsperaId;
    private String titulo;
    private String mensagem;
    private Boolean lida;
    private LocalDateTime criadoEm;
}
