package com.nalamina.api.service;

import com.nalamina.api.dto.produto.ProdutoRequest;
import com.nalamina.api.dto.produto.ProdutoResponse;
import com.nalamina.api.entity.ProdutoEntity;
import com.nalamina.api.entity.TenantEntity;
import com.nalamina.api.repository.ProdutoRepository;
import com.nalamina.api.repository.TenantRepository;
import com.nalamina.api.security.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProdutoService {

    private final ProdutoRepository produtoRepository;
    private final TenantRepository tenantRepository;

    @Transactional(readOnly = true)
    public List<ProdutoResponse> listar(String q) {
        UUID tenantId = TenantContextHolder.getTenantId();
        List<ProdutoEntity> produtos = (q == null || q.isBlank())
                ? produtoRepository.findByTenantEntity_IdAndAtivoTrue(tenantId)
                : produtoRepository.buscar(tenantId, q.trim());
        return produtos.stream().map(this::toResponse).toList();
    }

    @Transactional
    public ProdutoResponse criar(ProdutoRequest request) {
        UUID tenantId = TenantContextHolder.getTenantId();
        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barbearia não encontrada"));

        validarEanDisponivel(tenantId, request.getEan(), null);

        ProdutoEntity produto = ProdutoEntity.builder()
                .tenantEntity(tenant)
                .nome(request.getNome())
                .sku(gerarProximoSku(tenantId))
                .ean(request.getEan())
                .categoria(request.getCategoria())
                .tipoUso(request.getTipoUso())
                .unidadeMedida(request.getUnidadeMedida())
                .estoqueAtual(request.getEstoqueAtual())
                .estoqueMinimo(request.getEstoqueMinimo())
                .precoVenda(request.getPrecoVenda())
                .build();

        try {
            return toResponse(produtoRepository.saveAndFlush(produto));
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Conflito ao gerar identificadores do produto, tente novamente");
        }
    }

    @Transactional
    public ProdutoResponse atualizar(UUID id, ProdutoRequest request) {
        UUID tenantId = TenantContextHolder.getTenantId();
        ProdutoEntity produto = produtoRepository.findByIdAndTenantEntity_Id(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));

        validarEanDisponivel(tenantId, request.getEan(), id);

        produto.setNome(request.getNome());
        produto.setEan(request.getEan());
        produto.setCategoria(request.getCategoria());
        produto.setTipoUso(request.getTipoUso());
        produto.setUnidadeMedida(request.getUnidadeMedida());
        produto.setEstoqueAtual(request.getEstoqueAtual());
        produto.setEstoqueMinimo(request.getEstoqueMinimo());
        produto.setPrecoVenda(request.getPrecoVenda());

        return toResponse(produtoRepository.save(produto));
    }

    private void validarEanDisponivel(UUID tenantId, String ean, UUID idAtual) {
        if (ean == null) return;
        boolean emUso = idAtual == null
                ? produtoRepository.existsByTenantEntity_IdAndEan(tenantId, ean)
                : produtoRepository.existsByTenantEntity_IdAndEanAndIdNot(tenantId, ean, idAtual);
        if (emUso) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe um produto com esse EAN");
        }
    }

    private String gerarProximoSku(UUID tenantId) {
        long numero = produtoRepository.countByTenantEntity_Id(tenantId) + 1;
        String sku = "PRD-" + String.format("%04d", numero);
        while (produtoRepository.existsByTenantEntity_IdAndSku(tenantId, sku)) {
            numero++;
            sku = "PRD-" + String.format("%04d", numero);
        }
        return sku;
    }

    @Transactional
    public void desativar(UUID id) {
        UUID tenantId = TenantContextHolder.getTenantId();
        ProdutoEntity produto = produtoRepository.findByIdAndTenantEntity_Id(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));

        produto.setAtivo(false);
        produtoRepository.save(produto);
    }

    ProdutoResponse toResponse(ProdutoEntity produto) {
        return ProdutoResponse.builder()
                .id(produto.getId())
                .nome(produto.getNome())
                .sku(produto.getSku())
                .ean(produto.getEan())
                .categoria(produto.getCategoria())
                .tipoUso(produto.getTipoUso())
                .unidadeMedida(produto.getUnidadeMedida())
                .estoqueAtual(produto.getEstoqueAtual())
                .estoqueMinimo(produto.getEstoqueMinimo())
                .precoVenda(produto.getPrecoVenda())
                .estoqueBaixo(produto.getEstoqueAtual().compareTo(produto.getEstoqueMinimo()) <= 0)
                .ativo(produto.getAtivo())
                .criadoEm(produto.getCriadoEm())
                .atualizadoEm(produto.getAtualizadoEm())
                .build();
    }
}
