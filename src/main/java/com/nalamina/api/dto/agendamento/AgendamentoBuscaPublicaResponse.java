package com.nalamina.api.dto.agendamento;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AgendamentoBuscaPublicaResponse {
    private AgendamentoResponse agendamento;
    private boolean reembolsavelSeCancelado;
}
