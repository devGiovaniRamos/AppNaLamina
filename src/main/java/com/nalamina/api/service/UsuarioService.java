package com.nalamina.api.service;

import com.nalamina.api.entity.UsuarioEntity;
import com.nalamina.api.entity.UsuarioEntity;
import com.nalamina.api.repository.UsuarioRepository;
import com.nalamina.api.security.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsuarioService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UUID tenantId = TenantContextHolder.getTenantId();

        if (tenantId == null) {
            throw new UsernameNotFoundException("Tenant não identificado");
        }

        UsuarioEntity usuario = usuarioRepository
                .findByEmailAndTenantEntity_IdAndAtivoTrue(email, tenantId)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + email));

        return new User(
                usuario.getId().toString(),
                usuario.getSenhaHash(),
                List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getRole().name()))
        );
    }

    public UsuarioEntity findById(UUID id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + id));
    }
}