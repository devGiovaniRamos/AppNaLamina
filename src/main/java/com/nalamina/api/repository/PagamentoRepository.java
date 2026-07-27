package com.nalamina.api.repository;

import com.nalamina.api.entity.PagamentoEntity;
import com.nalamina.api.entity.enums.TipoPagamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PagamentoRepository extends JpaRepository<PagamentoEntity, UUID> {

    Optional<PagamentoEntity> findByAgendamentoEntity_IdAndTipo(UUID agendamentoId, TipoPagamento tipo);

    boolean existsByAgendamentoEntity_IdAndTipo(UUID agendamentoId, TipoPagamento tipo);

    Optional<PagamentoEntity> findByMercadoPagoPaymentId(String mercadoPagoPaymentId);

    @Query("SELECT DISTINCT p FROM PagamentoEntity p " +
           "JOIN FETCH p.agendamentoEntity a " +
           "JOIN FETCH a.servicos " +
           "WHERE a.tenantEntity.id = :tenantId " +
           "AND p.criadoEm >= :dataInicio " +
           "AND p.criadoEm < :dataFim " +
           "ORDER BY p.criadoEm DESC")
    List<PagamentoEntity> findAllByTenant(
            @Param("tenantId") UUID tenantId,
            @Param("dataInicio") LocalDateTime dataInicio,
            @Param("dataFim") LocalDateTime dataFim);
}
