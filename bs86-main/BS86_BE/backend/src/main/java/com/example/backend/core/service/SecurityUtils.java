package com.example.backend.core.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

final class SecurityUtils {
    private SecurityUtils() {}

    static Long getCurrentUserId() {
        // Current JWT filter sets principal to email; userId may not be available here yet.
        return null;
    }

    static String getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        Object principal = auth.getPrincipal();
        return principal != null ? String.valueOf(principal) : null;
    }
}

