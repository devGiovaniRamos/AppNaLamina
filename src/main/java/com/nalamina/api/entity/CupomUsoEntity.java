package com.nalamina.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "cupom_uso",
        uniqueConstraints = @UniqueConstraint(columnNames = {"cupom_id", "usuario_id"})
)
public class CupomUsoEntity {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cupom_id", nullable = false)
    private CupomEntity cupomEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private UsuarioEntity usuarioEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agendamento_id", nullable = false)
    private AgendamentoEntity agendamentoEntity;

    @Builder.Default
    @Column(name = "usado_em", nullable = false, updatable = false)
    private LocalDateTime usadoEm = LocalDateTime.now();

    @PrePersist
    public void prePersist() {
        if (this.id == null) this.id = UUID.randomUUID();
    }
}
