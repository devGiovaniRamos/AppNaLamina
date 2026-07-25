package com.nalamina.api.util;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class TelefoneUtil {

    private TelefoneUtil() {
    }

    public static String normalizar(String bruto) {
        if (bruto == null || bruto.isBlank()) return null;

        String digitos = bruto.replaceAll("\\D", "");

        if (digitos.length() >= 12 && digitos.startsWith("55")) {
            digitos = digitos.substring(2);
        }
        if (digitos.length() >= 11 && digitos.startsWith("0")) {
            digitos = digitos.substring(1);
        }

        if (digitos.length() < 10 || digitos.length() > 11) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Telefone inválido: informe DDD + número (ex: 21999998888)");
        }
        return digitos;
    }
}
