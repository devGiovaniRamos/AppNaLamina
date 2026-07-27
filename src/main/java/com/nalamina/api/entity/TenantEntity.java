package com.nalamina.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.domain.Persistable;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tenant")
public class TenantEntity implements Persistable<UUID> {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(length = 20)
    private String telefone;

    @Column(unique = true, length = 18)
    private String cnpj;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(length = 255)
    private String endereco;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "mensagem_boas_vindas", columnDefinition = "TEXT")
    private String mensagemBoasVindas;

    @Builder.Default
    @Column(nullable = false)
    private Boolean ativo = true;

    @Builder.Default
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm = LocalDateTime.now();

    @Column(unique = true, length = 100)
    private String slug;

    @Column(name = "taxa_agendamento_pct", precision = 5, scale = 2)
    private java.math.BigDecimal taxaAgendamentoPct;

    @Builder.Default
    @Column(name = "sinal_obrigatorio", nullable = false)
    private Boolean sinalObrigatorio = false;

    @Column(name = "sinal_percentual", precision = 5, scale = 2)
    private java.math.BigDecimal sinalPercentual;

    @Builder.Default
    @Column(name = "janela_cancelamento_horas", nullable = false)
    private Integer janelaCancelamentoHoras = 12;

    @Transient
    @Builder.Default
    @EqualsAndHashCode.Exclude
    private boolean isNew = true;

    @Override
    public boolean isNew() {
        return isNew;
    }

    @PostPersist
    @PostLoad
    void markNotNew() {
        this.isNew = false;
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) this.id = UUID.randomUUID();
    }
}
