package com.nalamina.api.repository;

import com.nalamina.api.entity.VendaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VendaRepository extends JpaRepository<VendaEntity, UUID> {

    Optional<VendaEntity> findByIdAndTenantEntity_Id(UUID id, UUID tenantId);

    @Query("""
    SELECT v FROM VendaEntity v
    WHERE v.tenantEntity.id = :tenantId
      AND v.criadoEm >= :dataInicio
      AND v.criadoEm < :dataFim
    ORDER BY v.criadoEm DESC
    """)
    List<VendaEntity> findAllByTenant(
            @Param("tenantId") UUID tenantId,
            @Param("dataInicio") LocalDateTime dataInicio,
            @Param("dataFim") LocalDateTime dataFim);
}
