package com.nalamina.api.repository;

import com.nalamina.api.entity.FilaEsperaEntity;
import com.nalamina.api.entity.enums.StatusFila;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FilaEsperaRepository extends JpaRepository<FilaEsperaEntity, UUID> {

    List<FilaEsperaEntity> findByTenantEntity_IdAndStatusInOrderByCriadoEmAsc(UUID tenantId, List<StatusFila> status);

    Optional<FilaEsperaEntity> findByIdAndTenantEntity_Id(UUID id, UUID tenantId);

    Optional<FilaEsperaEntity> findFirstByTenantEntity_IdAndClienteTelAndStatusInOrderByCriadoEmDesc(
            UUID tenantId, String clienteTel, List<StatusFila> status);

    @Query("SELECT MAX(f.numeroTicket) FROM FilaEsperaEntity f " +
           "WHERE f.tenantEntity.id = :tenantId AND f.criadoEm >= :inicioDoDia")
    Optional<Integer> buscarMaiorTicketDoDia(@Param("tenantId") UUID tenantId, @Param("inicioDoDia") LocalDateTime inicioDoDia);

    long countByTenantEntity_IdAndStatusIn(UUID tenantId, List<StatusFila> status);
}
