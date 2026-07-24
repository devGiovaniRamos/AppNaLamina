package com.nalamina.api.dto.venda;

import com.nalamina.api.entity.enums.MetodoPagamento;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class VendaRequest {

    @Size(max = 100)
    private String clienteNome;

    @NotNull
    private MetodoPagamento metodo;

    @NotEmpty
    @Valid
    private List<VendaItemRequest> itens;
}
