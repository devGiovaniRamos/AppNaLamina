package com.nalamina.api.service;

import com.nalamina.api.dto.cliente.ClienteConhecidoResponse;
import com.nalamina.api.entity.AgendamentoEntity;
import com.nalamina.api.entity.AssinaturaClienteEntity;
import com.nalamina.api.repository.AgendamentoRepository;
import com.nalamina.api.repository.AssinaturaClienteRepository;
import com.nalamina.api.util.TelefoneUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Reconhece se um telefone já é conhecido daquela barbearia (por já ter agendado ou assinado antes),
 * pra a página pública pular a pergunta do nome em visitas seguintes. O telefone já é o identificador
 * do cliente no sistema hoje (sem cadastro/senha); no futuro isso vira o passo de validação por
 * WhatsApp (backend envia código, cliente confirma).
 */
@Service
@RequiredArgsConstructor
public class ClientePublicoService {

    private final AgendamentoRepository agendamentoRepository;
    private final AssinaturaClienteRepository assinaturaClienteRepository;

    @Transactional(readOnly = true)
    public ClienteConhecidoResponse identificar(UUID tenantId, String telefoneBruto) {
        String telefone = TelefoneUtil.normalizar(telefoneBruto);

        Optional<AgendamentoEntity> ultimoAgendamento =
                agendamentoRepository.findFirstByTenantEntity_IdAndClienteTelOrderByCriadoEmDesc(tenantId, telefone);
        Optional<AssinaturaClienteEntity> ultimaAssinatura =
                assinaturaClienteRepository.findFirstByPlano_TenantEntity_IdAndClienteTelOrderByCriadoEmDesc(tenantId, telefone);

        LocalDateTime dataAgendamento = ultimoAgendamento.map(AgendamentoEntity::getCriadoEm).orElse(null);
        LocalDateTime dataAssinatura = ultimaAssinatura.map(AssinaturaClienteEntity::getCriadoEm).orElse(null);

        String nome = null;
        if (dataAgendamento != null && (dataAssinatura == null || dataAgendamento.isAfter(dataAssinatura))) {
            nome = ultimoAgendamento.get().getClienteNome();
        } else if (dataAssinatura != null) {
            nome = ultimaAssinatura.get().getClienteNome();
        }

        return ClienteConhecidoResponse.builder()
                .conhecido(nome != null)
                .nome(nome)
                .telefoneNormalizado(telefone)
                .build();
    }
}
