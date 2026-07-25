package com.nalamina.api.repository;

import com.nalamina.api.entity.PontoClienteEntity;
import com.nalamina.api.entity.enums.OrigemPonto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PontoClienteRepository extends JpaRepository<PontoClienteEntity, UUID> {

    Optional<PontoClienteEntity> findByCampeonatoEntity_IdAndOrigemAndOrigemId(UUID campeonatoId, OrigemPonto origem, UUID origemId);

    interface RankingProjection {
        String getClienteTel();
        String getClienteNome();
        Long getTotalPontos();
    }

    @Query(value = """
    SELECT pc.cliente_tel AS clienteTel,
           (SELECT pc2.cliente_nome FROM ponto_cliente pc2
            WHERE pc2.cliente_tel = pc.cliente_tel AND pc2.campeonato_id = pc.campeonato_id
            ORDER BY pc2.criado_em DESC LIMIT 1) AS clienteNome,
           SUM(pc.pontos) AS totalPontos
    FROM ponto_cliente pc
    WHERE pc.campeonato_id = :campeonatoId AND pc.estornado = false
    GROUP BY pc.cliente_tel, pc.campeonato_id
    ORDER BY totalPontos DESC
    """, nativeQuery = true)
    List<RankingProjection> ranking(@Param("campeonatoId") UUID campeonatoId);
}
