package com.nalamina.api.service;

import com.nalamina.api.dto.servico.ServicoRequest;
import com.nalamina.api.dto.servico.ServicoResponse;
import com.nalamina.api.entity.ServicoEntity;
import com.nalamina.api.entity.TenantEntity;
import com.nalamina.api.repository.ServicoRepository;
import com.nalamina.api.repository.TenantRepository;
import com.nalamina.api.security.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ServicoService {

    private final ServicoRepository servicoRepository;
    private final TenantRepository tenantRepository;

    public List<ServicoResponse> listar() {
        UUID tenantId = TenantContextHolder.getTenantId();
        return servicoRepository.findByTenantEntity_IdAndAtivoTrue(tenantId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public ServicoResponse criar(ServicoRequest request) {
        UUID tenantId = TenantContextHolder.getTenantId();
        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Barbearia não encontrada"));

        ServicoEntity servico = ServicoEntity.builder()
                .tenantEntity(tenant)
                .nome(request.getNome())
                .descricao(request.getDescricao())
                .duracaoMin(request.getDuracaoMin())
                .preco(request.getPreco())
                .build();

        return toResponse(servicoRepository.save(servico));
    }

    @Transactional
    public ServicoResponse atualizar(UUID id, ServicoRequest request) {
        UUID tenantId = TenantContextHolder.getTenantId();
        ServicoEntity servico = servicoRepository.findByIdAndTenantEntity_Id(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Serviço não encontrado"));

        servico.setNome(request.getNome());
        servico.setDescricao(request.getDescricao());
        servico.setDuracaoMin(request.getDuracaoMin());
        servico.setPreco(request.getPreco());

        return toResponse(servicoRepository.save(servico));
    }

    @Transactional
    public void desativar(UUID id) {
        UUID tenantId = TenantContextHolder.getTenantId();
        ServicoEntity servico = servicoRepository.findByIdAndTenantEntity_Id(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Serviço não encontrado"));

        servico.setAtivo(false);
        servicoRepository.save(servico);
    }

    private ServicoResponse toResponse(ServicoEntity servico) {
        return ServicoResponse.builder()
                .id(servico.getId())
                .nome(servico.getNome())
                .descricao(servico.getDescricao())
                .duracaoMin(servico.getDuracaoMin())
                .preco(servico.getPreco())
                .ativo(servico.getAtivo())
                .build();
    }
}