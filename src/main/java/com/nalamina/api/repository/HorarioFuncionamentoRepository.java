package com.nalamina.api.repository;

import com.nalamina.api.entity.HorarioFuncionamentoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HorarioFuncionamentoRepository extends JpaRepository<HorarioFuncionamentoEntity, UUID> {

    List<HorarioFuncionamentoEntity> findByTenantEntity_IdOrderByDiaSemana(UUID tenantId);

    Optional<HorarioFuncionamentoEntity> findByTenantEntity_IdAndDiaSemana(UUID tenantId, Integer diaSemana);
}