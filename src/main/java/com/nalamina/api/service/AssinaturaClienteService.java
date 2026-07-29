package com.nalamina.api.service;

import com.nalamina.api.dto.assinaturacliente.AssinarRequest;
import com.nalamina.api.dto.assinaturacliente.AssinaturaResponse;
import com.nalamina.api.dto.assinaturacliente.AssinaturaStatusPublicoResponse;
import com.nalamina.api.entity.AssinaturaClienteEntity;
import com.nalamina.api.entity.PlanoAssinaturaEntity;
import com.nalamina.api.entity.TenantEntity;
import com.nalamina.api.entity.enums.StatusAssinatura;
import com.nalamina.api.repository.AssinaturaClienteRepository;
import com.nalamina.api.repository.PlanoAssinaturaRepository;
import com.nalamina.api.security.TenantContextHolder;
import com.nalamina.api.util.TelefoneUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssinaturaClienteService {

    private static final int DURACAO_CICLO_DIAS = 30;
    private static final List<StatusAssinatura> STATUS_CONSIDERADOS_ATIVOS =
            List.of(StatusAssinatura.PENDENTE_PAGAMENTO, StatusAssinatura.ATIVA);

    private final AssinaturaClienteRepository assinaturaClienteRepository;
    private final PlanoAssinaturaRepository planoAssinaturaRepository;
    private final MercadoPagoService mercadoPagoService;
    private final MercadoPagoOAuthService mercadoPagoOAuthService;

    @Transactional
    public AssinaturaResponse assinar(TenantEntity tenant, AssinarRequest request) {
        UUID tenantId = tenant.getId();
        PlanoAssinaturaEntity plano = planoAssinaturaRepository.findByIdAndTenantEntity_Id(request.getPlanoId(), tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plano não encontrado"));

        if (!Boolean.TRUE.equals(plano.getAtivo())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este plano não está mais disponível");
        }

        String clienteTel = TelefoneUtil.normalizar(request.getClienteTel());

        assinaturaClienteRepository
                .findFirstByPlano_TenantEntity_IdAndClienteTelAndStatusInOrderByCriadoEmDesc(
                        tenantId, clienteTel, STATUS_CONSIDERADOS_ATIVOS)
                .ifPresent(existente -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            existente.getStatus() == StatusAssinatura.ATIVA
                                    ? "Este telefone já possui uma assinatura ativa"
                                    : "Este telefone já possui um pagamento de assinatura pendente");
                });

        String accessToken = mercadoPagoOAuthService.obterAccessTokenValido(tenant);

        UUID assinaturaId = UUID.randomUUID();
        AssinaturaClienteEntity assinatura = AssinaturaClienteEntity.builder()
                .id(assinaturaId)
                .plano(plano)
                .clienteNome(request.getClienteNome())
                .clienteTel(clienteTel)
                .status(StatusAssinatura.PENDENTE_PAGAMENTO)
                .build();

        MercadoPagoService.MercadoPagoPixResult pix = mercadoPagoService.criarPagamentoPix(
                accessToken, "Assinatura " + plano.getNome() + " - NaLâmina",
                request.getClienteNome(), clienteTel, plano.getPrecoMensal(), assinaturaId);

        assinatura.setMercadoPagoPaymentId(pix.paymentId());
        assinatura.setPixCopiaECola(pix.pixCopiaECola());
        assinatura.setPixQrCodeBase64(pix.qrCodeBase64());
        assinatura.setPixExpiraEm(pix.pixExpiraEm());

        return toResponse(assinaturaClienteRepository.save(assinatura));
    }

    /**
     * Ponto de entrada do webhook do Mercado Pago para pagamentos de assinatura — espelha
     * PagamentoService.processarWebhookMercadoPago, mas pra o ciclo de assinatura.
     *
     * @return true se o id recebido correspondia a uma assinatura (tratada ou não).
     */
    @Transactional
    public boolean processarWebhookMercadoPago(String mercadoPagoPaymentId) {
        AssinaturaClienteEntity assinatura = assinaturaClienteRepository.findByMercadoPagoPaymentId(mercadoPagoPaymentId)
                .orElse(null);
        if (assinatura == null) return false;
        if (assinatura.getStatus() != StatusAssinatura.PENDENTE_PAGAMENTO) return true;

        TenantEntity tenant = assinatura.getPlano().getTenantEntity();
        String accessToken = mercadoPagoOAuthService.obterAccessTokenValido(tenant);
        String status = mercadoPagoService.consultarStatus(accessToken, mercadoPagoPaymentId);
        if ("approved".equals(status)) {
            ativarCiclo(assinatura, LocalDate.now());
            assinaturaClienteRepository.save(assinatura);
        }
        return true;
    }

    @Transactional(readOnly = true)
    public List<AssinaturaResponse> listar() {
        UUID tenantId = TenantContextHolder.getTenantId();
        return assinaturaClienteRepository.findByPlano_TenantEntity_Id(tenantId).stream()
                .sorted(Comparator.comparing(AssinaturaClienteEntity::getExpiraEm, Comparator.nullsFirst(Comparator.naturalOrder())))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AssinaturaResponse renovarManual(UUID id) {
        UUID tenantId = TenantContextHolder.getTenantId();
        AssinaturaClienteEntity assinatura = assinaturaClienteRepository.findByIdAndPlano_TenantEntity_Id(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assinatura não encontrada"));

        LocalDate hoje = LocalDate.now();
        LocalDate baseRenovacao = (assinatura.getExpiraEm() != null && assinatura.getExpiraEm().isAfter(hoje))
                ? assinatura.getExpiraEm() : hoje;

        assinatura.setStatus(StatusAssinatura.ATIVA);
        if (assinatura.getInicio() == null) assinatura.setInicio(hoje);
        assinatura.setExpiraEm(baseRenovacao.plusDays(DURACAO_CICLO_DIAS));

        return toResponse(assinaturaClienteRepository.save(assinatura));
    }

    @Transactional(readOnly = true)
    public AssinaturaStatusPublicoResponse statusPublico(UUID tenantId, String clienteTelBruto) {
        String clienteTel = TelefoneUtil.normalizar(clienteTelBruto);

        return assinaturaClienteRepository
                .findFirstByPlano_TenantEntity_IdAndClienteTelAndStatusInOrderByCriadoEmDesc(
                        tenantId, clienteTel, STATUS_CONSIDERADOS_ATIVOS)
                .map(a -> AssinaturaStatusPublicoResponse.builder()
                        .assinante(a.getStatus() == StatusAssinatura.ATIVA)
                        .planoNome(a.getPlano().getNome())
                        .diasRestantes(calcularDiasRestantes(a.getExpiraEm()))
                        .build())
                .orElse(AssinaturaStatusPublicoResponse.builder().assinante(false).build());
    }

    private void ativarCiclo(AssinaturaClienteEntity assinatura, LocalDate inicio) {
        assinatura.setStatus(StatusAssinatura.ATIVA);
        assinatura.setInicio(inicio);
        assinatura.setExpiraEm(inicio.plusDays(DURACAO_CICLO_DIAS));
    }

    private Long calcularDiasRestantes(LocalDate expiraEm) {
        if (expiraEm == null) return null;
        return ChronoUnit.DAYS.between(LocalDate.now(), expiraEm);
    }

    private AssinaturaResponse toResponse(AssinaturaClienteEntity a) {
        return AssinaturaResponse.builder()
                .id(a.getId())
                .planoId(a.getPlano().getId())
                .planoNome(a.getPlano().getNome())
                .planoPrecoMensal(a.getPlano().getPrecoMensal())
                .clienteNome(a.getClienteNome())
                .clienteTel(a.getClienteTel())
                .status(a.getStatus())
                .inicio(a.getInicio())
                .expiraEm(a.getExpiraEm())
                .diasRestantes(calcularDiasRestantes(a.getExpiraEm()))
                .pixCopiaECola(a.getPixCopiaECola())
                .pixQrCodeBase64(a.getPixQrCodeBase64())
                .pixExpiraEm(a.getPixExpiraEm())
                .build();
    }
}
