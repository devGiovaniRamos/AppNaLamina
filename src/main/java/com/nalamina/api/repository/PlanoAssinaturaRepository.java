package com.nalamina.api.repository;

import com.nalamina.api.entity.PlanoAssinaturaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlanoAssinaturaRepository extends JpaRepository<PlanoAssinaturaEntity, UUID> {

    List<PlanoAssinaturaEntity> findByTenantEntity_IdOrderByCriadoEmDesc(UUID tenantId);

    List<PlanoAssinaturaEntity> findByTenantEntity_IdAndAtivoTrueOrderByPrecoMensalAsc(UUID tenantId);

    Optional<PlanoAssinaturaEntity> findByIdAndTenantEntity_Id(UUID id, UUID tenantId);
}
