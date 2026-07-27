package com.nalamina.api.dto.tenant;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ConfigSinalRequest {

    @NotNull
    private Boolean sinalObrigatorio;

    private BigDecimal sinalPercentual;

    @NotNull
    @Min(0)
    @Max(12)
    private Integer janelaCancelamentoHoras;
}
