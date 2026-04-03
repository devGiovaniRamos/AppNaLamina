package com.nalamina.api.controller;

import com.nalamina.api.dto.auth.LoginRequest;
import com.nalamina.api.dto.auth.LoginResponse;
import com.nalamina.api.dto.auth.RefreshRequest;
import com.nalamina.api.dto.auth.RegistroRequest;
import com.nalamina.api.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request) {

        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(
            @Valid @RequestBody RefreshRequest request) {

        return ResponseEntity.ok(authService.refresh(request.getRefreshToken()));
    }

    @GetMapping("/hash")
    public String hash(@RequestParam String senha) {
        return new BCryptPasswordEncoder().encode(senha);
    }

    @PostMapping("/registro")
    public ResponseEntity<LoginResponse> registro(
            @Valid @RequestBody RegistroRequest request) {

        return ResponseEntity.status(201).body(authService.registro(request));
    }
}