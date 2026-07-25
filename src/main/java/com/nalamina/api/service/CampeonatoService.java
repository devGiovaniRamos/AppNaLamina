package com.nalamina.api.service;

import com.nalamina.api.dto.campeonato.CampeonatoRequest;
import com.nalamina.api.dto.campeonato.CampeonatoResponse;
import com.nalamina.api.dto.campeonato.RankingItemResponse;
import com.nalamina.api.dto.campeonato.RankingPublicoItemResponse;
import com.nalamina.api.entity.CampeonatoEntity;
import com.nalamina.api.entity.TenantEntity;
import com.nalamina.api.entity.enums.StatusCampeonato;
import com.nalamina.api.repository.CampeonatoRepository;
import com.nalamina.api.repository.PontoClienteRepository;
import com.nalamina.api.repository.TenantRepository;
import com.nalamina.api.security.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CampeonatoService {

    private final CampeonatoRepository campeonatoRepository;
    private final PontoClienteRepository pontoClienteRepository;
    private final TenantRepository tenantRepository;

    @Transactional
    public CampeonatoResponse iniciar(CampeonatoRequest request) {
        UUID tenantId = TenantContextHolder.getTenantId();
        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barbearia não encontrada"));

        campeonatoRepository.findByTenantEntity_IdAndStatus(tenantId, StatusCampeonato.ATIVO)
                .ifPresent(atual -> {
                    if (!LocalDate.now().isAfter(atual.getDataFim())) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "Já existe um campeonato ativo. Encerre-o antes de iniciar um novo.");
                    }
                    atual.setStatus(StatusCampeonato.ENCERRADO);
                    campeonatoRepository.save(atual);
                });

        LocalDate dataInicio = LocalDate.now();
        LocalDate dataFim = switch (request.getTipo()) {
            case MENSAL -> dataInicio.plusMonths(1).minusDays(1);
            case BIMESTRAL -> dataInicio.plusMonths(2).minusDays(1);
            case TRIMESTRAL -> dataInicio.plusMonths(3).minusDays(1);
        };

        CampeonatoEntity campeonato = CampeonatoEntity.builder()
                .tenantEntity(tenant)
                .tipo(request.getTipo())
                .dataInicio(dataInicio)
                .dataFim(dataFim)
                .valorPorPonto(request.getValorPorPonto())
                .premiacao(request.getPremiacao())
                .build();

        return toResponse(campeonatoRepository.save(campeonato));
    }

    @Transactional
    public void encerrar(UUID id) {
        UUID tenantId = TenantContextHolder.getTenantId();
        CampeonatoEntity campeonato = campeonatoRepository.findByIdAndTenantEntity_Id(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Campeonato não encontrado"));

        if (campeonato.getStatus() == StatusCampeonato.ENCERRADO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Campeonato já está encerrado");
        }
        campeonato.setStatus(StatusCampeonato.ENCERRADO);
        campeonatoRepository.save(campeonato);
    }

    @Transactional(readOnly = true)
    public CampeonatoResponse buscarAtivo() {
        UUID tenantId = TenantContextHolder.getTenantId();
        CampeonatoEntity campeonato = campeonatoRepository.findByTenantEntity_IdAndStatus(tenantId, StatusCampeonato.ATIVO)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nenhum campeonato ativo"));
        return toResponse(campeonato);
    }

    @Transactional(readOnly = true)
    public List<CampeonatoResponse> listar() {
        UUID tenantId = TenantContextHolder.getTenantId();
        return campeonatoRepository.findByTenantEntity_IdOrderByCriadoEmDesc(tenantId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RankingItemResponse> ranking(UUID campeonatoId) {
        UUID tenantId = TenantContextHolder.getTenantId();
        campeonatoRepository.findByIdAndTenantEntity_Id(campeonatoId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Campeonato não encontrado"));

        List<PontoClienteRepository.RankingProjection> linhas = pontoClienteRepository.ranking(campeonatoId);
        return montarRanking(linhas, false).stream()
                .map(r -> RankingItemResponse.builder()
                        .posicao(r.posicao())
                        .clienteNome(r.nome())
                        .clienteTel(r.tel())
                        .pontos(r.pontos())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public CampeonatoResponse buscarAtivoPublico(UUID tenantId) {
        CampeonatoEntity campeonato = campeonatoRepository.findByTenantEntity_IdAndStatus(tenantId, StatusCampeonato.ATIVO)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nenhum campeonato ativo"));
        return toResponse(campeonato);
    }

    @Transactional(readOnly = true)
    public List<RankingPublicoItemResponse> rankingPublico(UUID tenantId) {
        CampeonatoEntity campeonato = campeonatoRepository.findByTenantEntity_IdAndStatus(tenantId, StatusCampeonato.ATIVO)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nenhum campeonato ativo"));

        List<PontoClienteRepository.RankingProjection> linhas = pontoClienteRepository.ranking(campeonato.getId());
        return montarRanking(linhas, true).stream()
                .map(r -> RankingPublicoItemResponse.builder()
                        .posicao(r.posicao())
                        .clienteNome(r.nome())
                        .pontos(r.pontos())
                        .build())
                .toList();
    }

    private record LinhaRanking(int posicao, String nome, String tel, long pontos) {
    }

    private List<LinhaRanking> montarRanking(List<PontoClienteRepository.RankingProjection> linhas, boolean mascarar) {
        List<LinhaRanking> resultado = new java.util.ArrayList<>();
        int posicao = 1;
        for (PontoClienteRepository.RankingProjection linha : linhas) {
            String nome = linha.getClienteNome() == null || linha.getClienteNome().isBlank()
                    ? "Cliente" : linha.getClienteNome();
            resultado.add(new LinhaRanking(posicao++, mascarar ? mascarar(nome) : nome, linha.getClienteTel(), linha.getTotalPontos()));
        }
        return resultado;
    }

    private String mascarar(String nome) {
        String[] partes = nome.trim().split("\\s+");
        if (partes.length == 1) return partes[0];
        return partes[0] + " " + Character.toUpperCase(partes[partes.length - 1].charAt(0)) + ".";
    }

    private CampeonatoResponse toResponse(CampeonatoEntity c) {
        return CampeonatoResponse.builder()
                .id(c.getId())
                .tipo(c.getTipo())
                .dataInicio(c.getDataInicio())
                .dataFim(c.getDataFim())
                .valorPorPonto(c.getValorPorPonto())
                .premiacao(c.getPremiacao())
                .status(c.getStatus())
                .criadoEm(c.getCriadoEm())
                .build();
    }
}
