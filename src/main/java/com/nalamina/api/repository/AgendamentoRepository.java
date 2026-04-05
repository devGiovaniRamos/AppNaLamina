package com.nalamina.api.repository;

import com.nalamina.api.entity.AgendamentoEntity;
import com.nalamina.api.entity.enums.StatusAgendamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AgendamentoRepository extends JpaRepository<AgendamentoEntity, UUID> {

    List<AgendamentoEntity> findByTenantEntity_IdOrderByDataAscHoraInicioAsc(UUID tenantId);

    Optional<AgendamentoEntity> findByIdAndTenantEntity_Id(UUID id, UUID tenantId);

    @Query("""
    SELECT COUNT(a) > 0 FROM AgendamentoEntity a
    WHERE a.profissionalEntity.id = :profissionalId
      AND (:excludeId IS NULL OR a.id <> :excludeId)
      AND a.status <> :cancelado
      AND a.data = :data
      AND a.horaInicio < :horaFim
      AND a.horaFim > :horaInicio
""")
    boolean existeConflito(
            @Param("profissionalId") UUID profissionalId,
            @Param("data") LocalDate data,
            @Param("horaInicio") LocalTime horaInicio,
            @Param("horaFim") LocalTime horaFim,
            @Param("excludeId") UUID excludeId,
            @Param("cancelado") StatusAgendamento cancelado
    );

    @Query("""
    SELECT a FROM AgendamentoEntity a
    WHERE a.tenantEntity.id = :tenantId
      AND a.data = :data
      AND a.status <> :cancelado
""")
    List<AgendamentoEntity> findAgendamentosAtivos(
            @Param("tenantId") UUID tenantId,
            @Param("data") LocalDate data,
            @Param("cancelado") StatusAgendamento cancelado
    );
}