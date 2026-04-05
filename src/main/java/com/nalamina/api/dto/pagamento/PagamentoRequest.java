package com.nalamina.api.dto.pagamento;

import com.nalamina.api.entity.enums.MetodoPagamento;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PagamentoRequest {

    @NotNull
    private MetodoPagamento metodo;
}