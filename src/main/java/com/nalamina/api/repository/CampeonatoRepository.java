package com.nalamina.api.repository;

import com.nalamina.api.entity.CampeonatoEntity;
import com.nalamina.api.entity.enums.StatusCampeonato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CampeonatoRepository extends JpaRepository<CampeonatoEntity, UUID> {

    Optional<CampeonatoEntity> findByTenantEntity_IdAndStatus(UUID tenantId, StatusCampeonato status);

    Optional<CampeonatoEntity> findByIdAndTenantEntity_Id(UUID id, UUID tenantId);

    List<CampeonatoEntity> findByTenantEntity_IdOrderByCriadoEmDesc(UUID tenantId);
}
