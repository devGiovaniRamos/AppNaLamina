package com.nalamina.api.repository;

import com.nalamina.api.entity.ProdutoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProdutoRepository extends JpaRepository<ProdutoEntity, UUID> {

    List<ProdutoEntity> findByTenantEntity_IdAndAtivoTrue(UUID tenantId);

    Optional<ProdutoEntity> findByIdAndTenantEntity_Id(UUID id, UUID tenantId);

    long countByTenantEntity_Id(UUID tenantId);

    boolean existsByTenantEntity_IdAndSku(UUID tenantId, String sku);

    boolean existsByTenantEntity_IdAndEan(UUID tenantId, String ean);

    boolean existsByTenantEntity_IdAndEanAndIdNot(UUID tenantId, String ean, UUID id);

    @Query("""
    SELECT p FROM ProdutoEntity p
    WHERE p.tenantEntity.id = :tenantId
      AND p.ativo = true
      AND p.estoqueAtual <= p.estoqueMinimo
    """)
    List<ProdutoEntity> findComEstoqueBaixo(@Param("tenantId") UUID tenantId);
}
