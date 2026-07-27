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

    private final MercadoPagoService mercadoPagoService;
    private final TenantRepository tenantRepository;

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
     * Retorna um access token válido da barbearia, renovando via refresh token quando estiver perto de expirar.
     */
    @Transactional
    public String obterAccessTokenValido(TenantEntity tenant) {
        if (tenant.getMercadoPagoAccessToken() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Esta barbearia ainda não conectou uma conta Mercado Pago. Acesse Configurações para conectar.");
        }

        if (tenant.getMercadoPagoTokenExpiraEm() != null
                && tenant.getMercadoPagoTokenExpiraEm().isBefore(LocalDateTime.now().plusDays(1))) {
            MercadoPagoService.MercadoPagoTokens tokens = mercadoPagoService.renovarToken(tenant.getMercadoPagoRefreshToken());
            salvarTokens(tenant, tokens);
        }

        return tenant.getMercadoPagoAccessToken();
    }

    private void salvarTokens(TenantEntity tenant, MercadoPagoService.MercadoPagoTokens tokens) {
        tenant.setMercadoPagoAccessToken(tokens.accessToken());
        if (tokens.refreshToken() != null) {
            tenant.setMercadoPagoRefreshToken(tokens.refreshToken());
        }
        tenant.setMercadoPagoPublicKey(tokens.publicKey());
        tenant.setMercadoPagoUserId(tokens.userId());
        tenant.setMercadoPagoTokenExpiraEm(tokens.expiraEm());
        tenantRepository.save(tenant);
    }

    private String assinarState(UUID tenantId) {
        return tenantId + "." + hmac(tenantId.toString());
    }

    private UUID validarState(String state) {
        String[] partes = state != null ? state.split("\\.", 2) : new String[0];
        if (partes.length != 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "state inválido");
        }
        UUID tenantId;
        try {
            tenantId = UUID.fromString(partes[0]);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "state inválido");
        }
        if (!hmac(tenantId.toString()).equals(partes[1])) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "state inválido");
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
