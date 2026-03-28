package com.nalamina.api.repository;

import com.nalamina.api.entity.CupomUsoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface CupomUsoRepository extends JpaRepository<CupomUsoEntity, UUID> {
}
