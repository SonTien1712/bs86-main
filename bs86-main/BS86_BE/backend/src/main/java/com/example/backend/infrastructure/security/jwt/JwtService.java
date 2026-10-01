package com.example.backend.infrastructure.security.jwt;


import com.example.backend.core.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.List;

/**
 * Centralized JWT service.
 *
 * Payload:
 * {
 *   "id":     1,
 *   "sub":    "user@gmail.com",
 *   "roles":  ["CUSTOMER"],
 *   "status": "ACTIVE",
 *   "iat":    ...,
 *   "exp":    ...
 * }
 */
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms:86400000}") // default 24h
    private long expirationMs;

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /** Generate a signed JWT for the given user. */
    public String generateToken(User user) {
        List<String> roles = extractRoles(user);
        String status = user.getStatus() != null ? user.getStatus().name() : "ACTIVE";

        return Jwts.builder()
                .setSubject(user.getEmail())
                .claim("id",     user.getId())
                .claim("roles",  roles)
                .claim("status", status)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /** Extract all claims from a token (throws if invalid/expired). */
    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /** Extract email (subject) from token. */
    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    /** Extract user id from token. */
    public Long extractUserId(String token) {
        return extractAllClaims(token).get("id", Long.class);
    }

    /** Extract roles list from token. */
    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        return (List<String>) extractAllClaims(token).get("roles");
    }

    /** Extract status from token. */
    public String extractStatus(String token) {
        return extractAllClaims(token).get("status", String.class);
    }

    /** Returns true if the token is valid (not expired, signature matches). */
    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    private List<String> extractRoles(User user) {
        if (user.getRoles() == null) return List.of();
        return user.getRoles().stream()
                .map(ur -> ur.getRole().name())
                .toList();
    }
}