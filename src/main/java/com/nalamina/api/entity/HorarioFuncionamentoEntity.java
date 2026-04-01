package com.nalamina.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "horario_funcionamento",
        uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "dia_semana"})
)
public class HorarioFuncionamentoEntity {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private TenantEntity tenantEntity;

    @Column(name = "dia_semana", nullable = false)
    private Integer diaSemana; // 0=domingo, 1=segunda ... 6=sábado

    @Column(nullable = false)
    private Boolean aberto;

    @Column(name = "hora_inicio_1")
    private LocalTime horaInicio1;

    @Column(name = "hora_fim_1")
    private LocalTime horaFim1;

    @Column(name = "hora_inicio_2")
    private LocalTime horaInicio2;

    @Column(name = "hora_fim_2")
    private LocalTime horaFim2;

    @PrePersist
    public void prePersist() {
        if (this.id == null) this.id = UUID.randomUUID();
    }
}