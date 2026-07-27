package com.nalamina.api.repository;

import com.nalamina.api.entity.NotificacaoAdminEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificacaoAdminRepository extends JpaRepository<NotificacaoAdminEntity, UUID> {

    List<NotificacaoAdminEntity> findTop20ByTenantEntity_IdOrderByCriadoEmDesc(UUID tenantId);

    Optional<NotificacaoAdminEntity> findByIdAndTenantEntity_Id(UUID id, UUID tenantId);

    long countByTenantEntity_IdAndLidaFalse(UUID tenantId);

    List<NotificacaoAdminEntity> findByTenantEntity_IdAndLidaFalse(UUID tenantId);
}
