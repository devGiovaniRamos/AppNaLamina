package com.nalamina.api.service;

import com.nalamina.api.dto.auth.LoginRequest;
import com.nalamina.api.dto.auth.LoginResponse;
import com.nalamina.api.entity.UsuarioEntity;
import com.nalamina.api.repository.UsuarioRepository;
import com.nalamina.api.security.JwtService;
import com.nalamina.api.security.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;

    public LoginResponse login(LoginRequest request, UUID tenantId) {
        TenantContextHolder.setTenantId(tenantId);

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getSenha())
            );
        } finally {
            TenantContextHolder.clear();
        }

        UsuarioEntity usuario = usuarioRepository
                .findByEmailAndTenantEntity_IdAndAtivoTrue(request.getEmail(), tenantId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        String accessToken = jwtService.generateAccessToken(usuario.getId(), tenantId, usuario.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(usuario.getId(), tenantId);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .role(usuario.getRole().name())
                .nome(usuario.getNome())
                .build();
    }

    public LoginResponse refresh(String refreshToken) {
        if (!jwtService.isTokenValid(refreshToken) || !jwtService.isRefreshToken(refreshToken)) {
            throw new RuntimeException("Refresh token inválido");
        }

        UUID userId = jwtService.extractUserId(refreshToken);
        UUID tenantId = jwtService.extractTenantId(refreshToken);

        UsuarioEntity usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        String novoAccessToken = jwtService.generateAccessToken(usuario.getId(), tenantId, usuario.getRole().name());
        String novoRefreshToken = jwtService.generateRefreshToken(usuario.getId(), tenantId);

        return LoginResponse.builder()
                .accessToken(novoAccessToken)
                .refreshToken(novoRefreshToken)
                .role(usuario.getRole().name())
                .nome(usuario.getNome())
                .build();
    }
}
