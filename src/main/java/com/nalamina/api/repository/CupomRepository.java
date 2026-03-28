package com.nalamina.api.repository;

import com.nalamina.api.entity.CupomEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface CupomRepository extends JpaRepository<CupomEntity, UUID> {
}
