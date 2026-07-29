package com.nalamina.api.repository;

import com.nalamina.api.entity.AssinaturaClienteEntity;
import com.nalamina.api.entity.enums.StatusAssinatura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssinaturaClienteRepository extends JpaRepository<AssinaturaClienteEntity, UUID> {

    List<AssinaturaClienteEntity> findByPlano_TenantEntity_Id(UUID tenantId);

    Optional<AssinaturaClienteEntity> findByIdAndPlano_TenantEntity_Id(UUID id, UUID tenantId);

    Optional<AssinaturaClienteEntity> findByMercadoPagoPaymentId(String mercadoPagoPaymentId);

    Optional<AssinaturaClienteEntity> findFirstByPlano_TenantEntity_IdAndClienteTelAndStatusInOrderByCriadoEmDesc(
            UUID tenantId, String clienteTel, List<StatusAssinatura> status);

    List<AssinaturaClienteEntity> findByStatusAndPixExpiraEmBefore(StatusAssinatura status, LocalDateTime momento);
}
