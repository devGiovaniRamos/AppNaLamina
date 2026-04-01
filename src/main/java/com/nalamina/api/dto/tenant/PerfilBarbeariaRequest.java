package com.nalamina.api.dto.tenant;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// DTO para atualizar perfil da barbearia
@Data
public class PerfilBarbeariaRequest {

    @NotBlank
    private String nome;

    private String telefone;

    private String cnpj;

    @Email
    private String email;

    private String endereco;

    private String descricao;
}