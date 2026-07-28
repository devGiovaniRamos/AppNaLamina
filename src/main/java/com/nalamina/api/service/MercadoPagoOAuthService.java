package com.nalamina.api.service;

import com.nalamina.api.entity.TenantEntity;
import com.nalamina.api.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Conecta cada barbearia à própria conta Mercado Pago (modelo marketplace/OAuth), para que o
 * dinheiro dos agendamentos caia direto na conta do dono da barbearia, não em uma conta central.
 */
@Service
@RequiredArgsConstructor
public class MercadoPagoOAuthService {

    private static final long STATE_VALIDADE_MS = 10 * 60 * 1000; // 10 minutos

    private final MercadoPagoService mercadoPagoService;
    private final TenantRepository tenantRepository;
    private final CryptoService cryptoService;

    @Value("${jwt.secret}")
    private String stateSecret;

    public String gerarUrlConexao(UUID tenantId) {
        return mercadoPagoService.gerarUrlAutorizacao(assinarState(tenantId));
    }

    @Transactional
    public void processarCallback(String code, String state) {
        UUID tenantId = validarState(state);
        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barbearia não encontrada"));

        MercadoPagoService.MercadoPagoTokens tokens = mercadoPagoService.trocarCodigoPorToken(code);
        salvarTokens(tenant, tokens);
    }

    @Transactional
    public void desconectar(UUID tenantId) {
        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barbearia não encontrada"));
        tenant.setMercadoPagoAccessToken(null);
        tenant.setMercadoPagoRefreshToken(null);
        tenant.setMercadoPagoPublicKey(null);
        tenant.setMercadoPagoUserId(null);
        tenant.setMercadoPagoTokenExpiraEm(null);
        tenantRepository.save(tenant);
    }

    /**
     * Retorna um access token válido (já decifrado) da barbearia, renovando via refresh token
     * quando estiver perto de expirar.
     */
    @Transactional
    public String obterAccessTokenValido(TenantEntity tenant) {
        if (tenant.getMercadoPagoAccessToken() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Esta barbearia ainda não conectou uma conta Mercado Pago. Acesse Configurações para conectar.");
        }

        if (tenant.getMercadoPagoTokenExpiraEm() != null
                && tenant.getMercadoPagoTokenExpiraEm().isBefore(LocalDateTime.now().plusDays(1))) {
            String refreshToken = cryptoService.decrypt(tenant.getMercadoPagoRefreshToken());
            MercadoPagoService.MercadoPagoTokens tokens = mercadoPagoService.renovarToken(refreshToken);
            salvarTokens(tenant, tokens);
        }

        return cryptoService.decrypt(tenant.getMercadoPagoAccessToken());
    }

    private void salvarTokens(TenantEntity tenant, MercadoPagoService.MercadoPagoTokens tokens) {
        tenant.setMercadoPagoAccessToken(cryptoService.encrypt(tokens.accessToken()));
        if (tokens.refreshToken() != null) {
            tenant.setMercadoPagoRefreshToken(cryptoService.encrypt(tokens.refreshToken()));
        }
        tenant.setMercadoPagoPublicKey(tokens.publicKey());
        tenant.setMercadoPagoUserId(tokens.userId());
        tenant.setMercadoPagoTokenExpiraEm(tokens.expiraEm());
        tenantRepository.save(tenant);
    }

    /**
     * State = "tenantId:timestamp" assinado com HMAC. O timestamp limita a janela em que um state
     * vazado (ex: log de proxy, histórico do navegador) poderia ser reaproveitado por alguém que
     * complete o login no Mercado Pago com a própria conta antes de expirar.
     */
    private String assinarState(UUID tenantId) {
        String payload = tenantId + ":" + System.currentTimeMillis();
        return payload + "." + hmac(payload);
    }

    private UUID validarState(String state) {
        String[] partes = state != null ? state.split("\\.", 2) : new String[0];
        if (partes.length != 2 || !hmac(partes[0]).equals(partes[1])) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "state inválido");
        }

        String[] payload = partes[0].split(":", 2);
        if (payload.length != 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "state inválido");
        }

        UUID tenantId;
        long timestamp;
        try {
            tenantId = UUID.fromString(payload[0]);
            timestamp = Long.parseLong(payload[1]);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "state inválido");
        }

        if (System.currentTimeMillis() - timestamp > STATE_VALIDADE_MS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Link de conexão expirado. Volte em Configurações e clique em Conectar novamente.");
        }

        return tenantId;
    }

    private String hmac(String valor) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(stateSecret.getBytes(), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(valor.getBytes()));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
