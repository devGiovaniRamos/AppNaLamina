package com.nalamina.api.service;

import com.nalamina.api.entity.AssinaturaClienteEntity;
import com.nalamina.api.entity.PagamentoEntity;
import com.nalamina.api.entity.enums.StatusAssinatura;
import com.nalamina.api.entity.enums.StatusPagamento;
import com.nalamina.api.repository.AssinaturaClienteRepository;
import com.nalamina.api.repository.PagamentoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * PIX gerado (agendamento ou assinatura) tem um prazo pra ser pago (mercadopago.pix-expiracao-minutos).
 * Passado esse prazo sem confirmação, esse job marca o pagamento/assinatura como expirado, liberando o
 * cliente pra tentar de novo — sem isso, um telefone/agendamento ficaria travado pra sempre num PIX
 * pendente que ninguém nunca pagou.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PixExpiracaoScheduler {

    private final PagamentoRepository pagamentoRepository;
    private final AssinaturaClienteRepository assinaturaClienteRepository;

    @Scheduled(fixedDelay = 5 * 60 * 1000, initialDelay = 60 * 1000)
    @Transactional
    public void expirarPendencias() {
        LocalDateTime agora = LocalDateTime.now();

        List<PagamentoEntity> pagamentosVencidos =
                pagamentoRepository.findByStatusAndPixExpiraEmBefore(StatusPagamento.PENDENTE, agora);
        pagamentosVencidos.forEach(p -> p.setStatus(StatusPagamento.EXPIRADO));
        if (!pagamentosVencidos.isEmpty()) {
            pagamentoRepository.saveAll(pagamentosVencidos);
            log.info("{} pagamento(s) PIX de agendamento expirado(s)", pagamentosVencidos.size());
        }

        List<AssinaturaClienteEntity> assinaturasVencidas = assinaturaClienteRepository
                .findByStatusAndPixExpiraEmBefore(StatusAssinatura.PENDENTE_PAGAMENTO, agora);
        assinaturasVencidas.forEach(a -> a.setStatus(StatusAssinatura.EXPIRADA));
        if (!assinaturasVencidas.isEmpty()) {
            assinaturaClienteRepository.saveAll(assinaturasVencidas);
            log.info("{} assinatura(s) com PIX expirado", assinaturasVencidas.size());
        }
    }
}
