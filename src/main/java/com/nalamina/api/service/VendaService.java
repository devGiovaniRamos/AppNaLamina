package com.nalamina.api.service;

import com.nalamina.api.dto.venda.*;
import com.nalamina.api.entity.MovimentoEstoqueEntity;
import com.nalamina.api.entity.ProdutoEntity;
import com.nalamina.api.entity.TenantEntity;
import com.nalamina.api.entity.VendaEntity;
import com.nalamina.api.entity.VendaItemEntity;
import com.nalamina.api.entity.enums.OrigemPonto;
import com.nalamina.api.entity.enums.StatusVenda;
import com.nalamina.api.entity.enums.TipoMovimentoEstoque;
import com.nalamina.api.repository.MovimentoEstoqueRepository;
import com.nalamina.api.repository.ProdutoRepository;
import com.nalamina.api.repository.TenantRepository;
import com.nalamina.api.repository.VendaRepository;
import com.nalamina.api.security.TenantContextHolder;
import com.nalamina.api.util.TelefoneUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VendaService {

    private static final LocalDateTime DATA_MINIMA = LocalDateTime.of(1970, 1, 1, 0, 0);
    private static final LocalDateTime DATA_MAXIMA = LocalDateTime.of(9999, 12, 31, 23, 59, 59);

    private final VendaRepository vendaRepository;
    private final ProdutoRepository produtoRepository;
    private final MovimentoEstoqueRepository movimentoEstoqueRepository;
    private final TenantRepository tenantRepository;
    private final PontuacaoService pontuacaoService;

    @Transactional
    public VendaResponse criar(VendaRequest request) {
        UUID tenantId = TenantContextHolder.getTenantId();
        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barbearia não encontrada"));

        String clienteTel = TelefoneUtil.normalizar(request.getClienteTel());

        VendaEntity venda = VendaEntity.builder()
                .tenantEntity(tenant)
                .clienteNome(request.getClienteNome())
                .clienteTel(clienteTel)
                .metodo(request.getMetodo())
                .valorTotal(BigDecimal.ZERO)
                .build();

        BigDecimal valorTotal = BigDecimal.ZERO;
        List<VendaItemEntity> itens = new ArrayList<>();

        for (VendaItemRequest itemRequest : request.getItens()) {
            ProdutoEntity produto = produtoRepository.findByIdAndTenantEntity_Id(itemRequest.getProdutoId(), tenantId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));

            if (produto.getPrecoVenda() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto \"" + produto.getNome() + "\" não possui preço de venda cadastrado");
            }
            if (produto.getEstoqueAtual().compareTo(itemRequest.getQuantidade()) < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estoque insuficiente de \"" + produto.getNome() + "\"");
            }

            BigDecimal subtotal = produto.getPrecoVenda().multiply(itemRequest.getQuantidade());
            valorTotal = valorTotal.add(subtotal);

            BigDecimal novoSaldo = produto.getEstoqueAtual().subtract(itemRequest.getQuantidade());
            produto.setEstoqueAtual(novoSaldo);
            produtoRepository.save(produto);

            movimentoEstoqueRepository.save(MovimentoEstoqueEntity.builder()
                    .produtoEntity(produto)
                    .tipo(TipoMovimentoEstoque.SAIDA)
                    .quantidade(itemRequest.getQuantidade())
                    .saldoApos(novoSaldo)
                    .observacao("Venda")
                    .build());

            itens.add(VendaItemEntity.builder()
                    .vendaEntity(venda)
                    .produtoEntity(produto)
                    .quantidade(itemRequest.getQuantidade())
                    .precoUnitario(produto.getPrecoVenda())
                    .subtotal(subtotal)
                    .build());
        }

        venda.setValorTotal(valorTotal);
        venda.setItens(itens);

        VendaEntity salva = vendaRepository.save(venda);

        if (clienteTel != null) {
            pontuacaoService.gerarPontos(tenant, clienteTel, salva.getClienteNome(),
                    OrigemPonto.VENDA, salva.getId(), valorTotal);
        }

        return toResponse(salva);
    }

    @Transactional(readOnly = true)
    public List<VendaResponse> listar(LocalDate dataInicio, LocalDate dataFim) {
        UUID tenantId = TenantContextHolder.getTenantId();
        LocalDateTime inicio = dataInicio != null ? dataInicio.atStartOfDay() : DATA_MINIMA;
        LocalDateTime fim = dataFim != null ? dataFim.plusDays(1).atStartOfDay() : DATA_MAXIMA;

        return vendaRepository.findAllByTenant(tenantId, inicio, fim)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public VendaResponse buscar(UUID id) {
        UUID tenantId = TenantContextHolder.getTenantId();
        VendaEntity venda = vendaRepository.findByIdAndTenantEntity_Id(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Venda não encontrada"));
        return toResponse(venda);
    }

    @Transactional
    public void cancelar(UUID id, String motivo) {
        UUID tenantId = TenantContextHolder.getTenantId();
        VendaEntity venda = vendaRepository.findByIdAndTenantEntity_Id(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Venda não encontrada"));

        if (venda.getStatus() == StatusVenda.CANCELADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Venda já está cancelada");
        }

        for (VendaItemEntity item : venda.getItens()) {
            ProdutoEntity produto = item.getProdutoEntity();
            BigDecimal novoSaldo = produto.getEstoqueAtual().add(item.getQuantidade());
            produto.setEstoqueAtual(novoSaldo);
            produtoRepository.save(produto);

            movimentoEstoqueRepository.save(MovimentoEstoqueEntity.builder()
                    .produtoEntity(produto)
                    .tipo(TipoMovimentoEstoque.ENTRADA)
                    .quantidade(item.getQuantidade())
                    .saldoApos(novoSaldo)
                    .observacao("Estorno de venda cancelada")
                    .build());
        }

        venda.setStatus(StatusVenda.CANCELADA);
        venda.setMotivoCancelamento(motivo);
        vendaRepository.save(venda);

        pontuacaoService.estornarPontos(tenantId, OrigemPonto.VENDA, venda.getId());
    }

    private VendaResponse toResponse(VendaEntity venda) {
        List<VendaItemResponse> itens = venda.getItens().stream()
                .map(item -> VendaItemResponse.builder()
                        .produtoId(item.getProdutoEntity().getId())
                        .produtoNome(item.getProdutoEntity().getNome())
                        .produtoSku(item.getProdutoEntity().getSku())
                        .quantidade(item.getQuantidade())
                        .precoUnitario(item.getPrecoUnitario())
                        .subtotal(item.getSubtotal())
                        .build())
                .toList();

        return VendaResponse.builder()
                .id(venda.getId())
                .clienteNome(venda.getClienteNome())
                .clienteTel(venda.getClienteTel())
                .metodo(venda.getMetodo())
                .status(venda.getStatus())
                .motivoCancelamento(venda.getMotivoCancelamento())
                .valorTotal(venda.getValorTotal())
                .itens(itens)
                .criadoEm(venda.getCriadoEm())
                .build();
    }
}
