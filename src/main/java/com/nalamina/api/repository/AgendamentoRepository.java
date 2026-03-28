package com.nalamina.api.repository;

import com.nalamina.api.entity.AgendamentoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface AgendamentoRepository extends JpaRepository<AgendamentoEntity, UUID> {
}
