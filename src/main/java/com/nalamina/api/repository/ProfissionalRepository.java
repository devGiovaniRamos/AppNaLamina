package com.nalamina.api.repository;

import com.nalamina.api.entity.ProfissionalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfissionalRepository extends JpaRepository<ProfissionalEntity, UUID> {
    List<ProfissionalEntity> findByTenantEntity_IdAndAtivoTrue(UUID tenantId);
    Optional<ProfissionalEntity> findByIdAndTenantEntity_Id(UUID id, UUID tenantId);
}