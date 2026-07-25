package com.nalamina.api.service;

import com.nalamina.api.entity.CampeonatoEntity;
import com.nalamina.api.entity.PontoClienteEntity;
import com.nalamina.api.entity.TenantEntity;
import com.nalamina.api.entity.enums.OrigemPonto;
import com.nalamina.api.entity.enums.StatusCampeonato;
import com.nalamina.api.repository.CampeonatoRepository;
import com.nalamina.api.repository.PontoClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PontuacaoService {

    private final CampeonatoRepository campeonatoRepository;
    private final PontoClienteRepository pontoClienteRepository;

    @Transactional
    public void gerarPontos(TenantEntity tenant, String clienteTel, String clienteNome,
                             OrigemPonto origem, UUID origemId, BigDecimal valorGerador) {
        if (clienteTel == null || clienteTel.isBlank()) return;

        Optional<CampeonatoEntity> campeonatoOpt = campeonatoVigente(tenant.getId());
        if (campeonatoOpt.isEmpty()) return;
        CampeonatoEntity campeonato = campeonatoOpt.get();

        int pontos = valorGerador.divide(campeonato.getValorPorPonto(), 0, RoundingMode.DOWN).intValue();
        if (pontos <= 0) return;

        try {
            pontoClienteRepository.save(PontoClienteEntity.builder()
                    .tenantEntity(tenant)
                    .campeonatoEntity(campeonato)
                    .clienteTel(clienteTel)
                    .clienteNome(clienteNome)
                    .origem(origem)
                    .origemId(origemId)
                    .valorGerador(valorGerador)
                    .pontos(pontos)
                    .build());
        } catch (DataIntegrityViolationException ignored) {
            // pontos já gerados para essa origem — evita duplicidade em reenvios
        }
    }

    @Transactional
    public void estornarPontos(UUID tenantId, OrigemPonto origem, UUID origemId) {
        Optional<CampeonatoEntity> campeonatoOpt = campeonatoVigente(tenantId);
        campeonatoOpt.ifPresent(campeonato ->
                pontoClienteRepository.findByCampeonatoEntity_IdAndOrigemAndOrigemId(campeonato.getId(), origem, origemId)
                        .filter(p -> !p.getEstornado())
                        .ifPresent(p -> {
                            p.setEstornado(true);
                            pontoClienteRepository.save(p);
                        }));
    }

    private Optional<CampeonatoEntity> campeonatoVigente(UUID tenantId) {
        return campeonatoRepository.findByTenantEntity_IdAndStatus(tenantId, StatusCampeonato.ATIVO)
                .filter(c -> !LocalDate.now().isBefore(c.getDataInicio()) && !LocalDate.now().isAfter(c.getDataFim()));
    }
}
