package com.nalamina.api.dto.agendamento;

import com.nalamina.api.dto.pagamento.PagamentoResponse;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AgendamentoPublicoResponse {
    private AgendamentoResponse agendamento;
    private PagamentoResponse sinal;
}
