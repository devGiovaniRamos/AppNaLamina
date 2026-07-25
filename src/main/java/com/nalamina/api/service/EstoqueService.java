package com.nalamina.api.service;

import com.nalamina.api.dto.estoque.AjusteEstoqueRequest;
import com.nalamina.api.dto.estoque.MovimentoEstoqueResponse;
import com.nalamina.api.dto.estoque.RelatorioEstoqueResponse;
import com.nalamina.api.dto.produto.ProdutoResponse;
import com.nalamina.api.entity.MovimentoEstoqueEntity;
import com.nalamina.api.entity.ProdutoEntity;
import com.nalamina.api.entity.enums.TipoMovimentoEstoque;
import com.nalamina.api.repository.MovimentoEstoqueRepository;
import com.nalamina.api.repository.ProdutoRepository;
import com.nalamina.api.security.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EstoqueService {

    private static final LocalDateTime DATA_MINIMA = LocalDateTime.of(1970, 1, 1, 0, 0);
    private static final LocalDateTime DATA_MAXIMA = LocalDateTime.of(9999, 12, 31, 23, 59, 59);

    private final ProdutoRepository produtoRepository;
    private final MovimentoEstoqueRepository movimentoEstoqueRepository;
    private final ProdutoService produtoService;

    @Transactional
    public ProdutoResponse ajustar(UUID produtoId, AjusteEstoqueRequest request) {
        UUID tenantId = TenantContextHolder.getTenantId();
        ProdutoEntity produto = produtoRepository.findByIdAndTenantEntity_Id(produtoId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));

        BigDecimal novoSaldo = request.getTipo() == TipoMovimentoEstoque.ENTRADA
                ? produto.getEstoqueAtual().add(request.getQuantidade())
                : produto.getEstoqueAtual().subtract(request.getQuantidade());

        if (novoSaldo.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estoque insuficiente para essa saída");
        }

        produto.setEstoqueAtual(novoSaldo);
        produtoRepository.save(produto);

        MovimentoEstoqueEntity movimento = MovimentoEstoqueEntity.builder()
                .produtoEntity(produto)
                .tipo(request.getTipo())
                .quantidade(request.getQuantidade())
                .saldoApos(novoSaldo)
                .observacao(request.getObservacao())
                .build();
        movimentoEstoqueRepository.save(movimento);

        return produtoService.toResponse(produto);
    }

    @Transactional(readOnly = true)
    public List<MovimentoEstoqueResponse> listarMovimentos(UUID produtoId, LocalDate dataInicio, LocalDate dataFim) {
        UUID tenantId = TenantContextHolder.getTenantId();
        LocalDateTime inicio = dataInicio != null ? dataInicio.atStartOfDay() : DATA_MINIMA;
        LocalDateTime fim = dataFim != null ? dataFim.plusDays(1).atStartOfDay() : DATA_MAXIMA;

        return movimentoEstoqueRepository.findAllByTenant(tenantId, produtoId, inicio, fim)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public RelatorioEstoqueResponse relatorio(LocalDate dataInicio, LocalDate dataFim) {
        UUID tenantId = TenantContextHolder.getTenantId();
        LocalDateTime inicio = dataInicio != null ? dataInicio.atStartOfDay() : DATA_MINIMA;
        LocalDateTime fim = dataFim != null ? dataFim.plusDays(1).atStartOfDay() : DATA_MAXIMA;

        List<ProdutoEntity> produtosAtivos = produtoRepository.findByTenantEntity_IdAndAtivoTrue(tenantId);
        List<ProdutoEntity> produtosBaixoEstoque = produtoRepository.findComEstoqueBaixo(tenantId);

        BigDecimal valorTotalEstoque = produtosAtivos.stream()
                .filter(p -> p.getPrecoVenda() != null)
                .map(p -> p.getPrecoVenda().multiply(p.getEstoqueAtual()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<MovimentoEstoqueEntity> movimentos = movimentoEstoqueRepository.findAllByTenant(tenantId, null, inicio, fim);

        BigDecimal totalEntradas = movimentos.stream()
                .filter(m -> m.getTipo() == TipoMovimentoEstoque.ENTRADA)
                .map(MovimentoEstoqueEntity::getQuantidade)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalSaidas = movimentos.stream()
                .filter(m -> m.getTipo() == TipoMovimentoEstoque.SAIDA)
                .map(MovimentoEstoqueEntity::getQuantidade)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return RelatorioEstoqueResponse.builder()
                .inicio(dataInicio)
                .fim(dataFim)
                .totalProdutosAtivos(produtosAtivos.size())
                .produtosComEstoqueBaixo(produtosBaixoEstoque.size())
                .valorTotalEstoque(valorTotalEstoque)
                .totalEntradas(totalEntradas)
                .totalSaidas(totalSaidas)
                .quantidadeMovimentos(movimentos.size())
                .produtosBaixoEstoque(produtosBaixoEstoque.stream().map(produtoService::toResponse).toList())
                .build();
    }

    private MovimentoEstoqueResponse toResponse(MovimentoEstoqueEntity m) {
        return MovimentoEstoqueResponse.builder()
                .id(m.getId())
                .produtoId(m.getProdutoEntity().getId())
                .produtoNome(m.getProdutoEntity().getNome())
                .tipo(m.getTipo())
                .quantidade(m.getQuantidade())
                .saldoApos(m.getSaldoApos())
                .observacao(m.getObservacao())
                .criadoEm(m.getCriadoEm())
                .build();
    }
}
