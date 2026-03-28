package com.nalamina.api.repository;

import com.nalamina.api.entity.NotificacaoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface NotificacaoRepository extends JpaRepository<NotificacaoEntity, UUID> {
}
