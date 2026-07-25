package com.nalamina.api.entity;

import com.nalamina.api.entity.enums.OrigemPonto;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ponto_cliente")
public class PontoClienteEntity {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private TenantEntity tenantEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campeonato_id", nullable = false)
    private CampeonatoEntity campeonatoEntity;

    @Column(name = "cliente_tel", nullable = false, length = 11)
    private String clienteTel;

    @Column(name = "cliente_nome", length = 100)
    private String clienteNome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrigemPonto origem;

    @Column(name = "origem_id", nullable = false)
    private UUID origemId;

    @Column(name = "valor_gerador", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorGerador;

    @Column(nullable = false)
    private Integer pontos;

    @Builder.Default
    @Column(nullable = false)
    private Boolean estornado = false;

    @Builder.Default
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm = LocalDateTime.now();

    @PrePersist
    public void prePersist() {
        if (this.id == null) this.id = UUID.randomUUID();
    }
}
