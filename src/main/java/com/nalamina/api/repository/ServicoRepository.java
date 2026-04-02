package com.nalamina.api.repository;

import com.nalamina.api.entity.ServicoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ServicoRepository extends JpaRepository<ServicoEntity, UUID> {
    List<ServicoEntity> findByTenantEntity_IdAndAtivoTrue(UUID tenantId);
    Optional<ServicoEntity> findByIdAndTenantEntity_Id(UUID id, UUID tenantId);
}