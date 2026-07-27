package com.nalamina.api.dto.agendamento;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CancelamentoPublicoRequest {

    @NotBlank(message = "Telefone é obrigatório")
    private String telefone;
}
