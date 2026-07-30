package com.nalamina.api.dto.assinaturacliente;

import com.nalamina.api.entity.enums.StatusAssinatura;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AssinaturaResponse {
    private UUID id;
    private UUID planoId;
    private String planoNome;
    private BigDecimal planoPrecoMensal;
    private String clienteNome;
    private String clienteTel;
    private StatusAssinatura status;
    private LocalDate inicio;
    private LocalDate expiraEm;
    private Long diasRestantes;
    private String pixCopiaECola;
    private String pixQrCodeBase64;
    private LocalDateTime pixExpiraEm;
}
