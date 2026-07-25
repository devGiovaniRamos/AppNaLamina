package com.nalamina.api.dto.campeonato;

import com.nalamina.api.entity.enums.StatusCampeonato;
import com.nalamina.api.entity.enums.TipoCampeonato;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CampeonatoResponse {
    private UUID id;
    private TipoCampeonato tipo;
    private LocalDate dataInicio;
    private LocalDate dataFim;
    private BigDecimal valorPorPonto;
    private String premiacao;
    private StatusCampeonato status;
    private LocalDateTime criadoEm;
}
