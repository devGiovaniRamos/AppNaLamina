package com.nalamina.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "venda_item")
public class VendaItemEntity {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venda_id", nullable = false)
    private VendaEntity vendaEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produto_id", nullable = false)
    private ProdutoEntity produtoEntity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantidade;

    @Column(name = "preco_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoUnitario;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @PrePersist
    public void prePersist() {
        if (this.id == null) this.id = UUID.randomUUID();
    }
}
