package com.nalamina.api.entity;

import com.nalamina.api.entity.enums.StatusAssinatura;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "assinatura_cliente")
public class AssinaturaClienteEntity {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plano_id", nullable = false)
    private PlanoAssinaturaEntity plano;

    @Column(name = "cliente_nome", nullable = false, length = 100)
    private String clienteNome;

    @Column(name = "cliente_tel", nullable = false, length = 20)
    private String clienteTel;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusAssinatura status = StatusAssinatura.PENDENTE_PAGAMENTO;

    private LocalDate inicio;

    @Column(name = "expira_em")
    private LocalDate expiraEm;

    @Column(name = "mercado_pago_payment_id", length = 255)
    private String mercadoPagoPaymentId;

    @Column(name = "pix_copia_e_cola", columnDefinition = "TEXT")
    private String pixCopiaECola;

    @Column(name = "pix_qr_code_base64", columnDefinition = "TEXT")
    private String pixQrCodeBase64;

    @Column(name = "pix_expira_em")
    private LocalDateTime pixExpiraEm;

    @Builder.Default
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm = LocalDateTime.now();

    @Builder.Default
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm = LocalDateTime.now();

    @PrePersist
    public void prePersist() {
        if (this.id == null) this.id = UUID.randomUUID();
    }

    @PreUpdate
    public void preUpdate() {
        this.atualizadoEm = LocalDateTime.now();
    }
}
