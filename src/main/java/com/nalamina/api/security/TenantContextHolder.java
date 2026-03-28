package com.nalamina.api.security;

import java.util.UUID;

public class TenantContextHolder {

    private static final ThreadLocal<UUID> CONTEXT = new ThreadLocal<>();

    public static void setTenantId(UUID tenantId) {
        CONTEXT.set(tenantId);
    }

    public static UUID getTenantId() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
