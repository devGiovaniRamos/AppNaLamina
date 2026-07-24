package com.nalamina.api.repository;

import com.nalamina.api.entity.MovimentoEstoqueEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MovimentoEstoqueRepository extends JpaRepository<MovimentoEstoqueEntity, UUID> {

    @Query("""
    SELECT m FROM MovimentoEstoqueEntity m
    JOIN FETCH m.produtoEntity p
    WHERE p.tenantEntity.id = :tenantId
      AND (:produtoId IS NULL OR p.id = :produtoId)
      AND m.criadoEm >= :dataInicio
      AND m.criadoEm < :dataFim
    ORDER BY m.criadoEm DESC
    """)
    List<MovimentoEstoqueEntity> findAllByTenant(
            @Param("tenantId") UUID tenantId,
            @Param("produtoId") UUID produtoId,
            @Param("dataInicio") LocalDateTime dataInicio,
            @Param("dataFim") LocalDateTime dataFim);
}
