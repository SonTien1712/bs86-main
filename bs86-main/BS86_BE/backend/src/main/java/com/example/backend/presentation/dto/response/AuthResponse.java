package com.example.backend.presentation.dto.response;

import lombok.Data;

import java.util.List;

//@Data
//public class AuthResponse {
//
//    private Long id;
//    private String token;
//    private List<String> roles;
//    private String email;
//    private String message;
//    private boolean success;
//
//    public AuthResponse(String token, List<String> roles, String email) {
//        this(null, token, roles, email);
//    }
//
//    public AuthResponse(Long id, String token, List<String> roles, String email) {
//        this.id = id;
//        this.token = token;
//        this.roles = roles;
//        this.email = email;
//        this.success = true;
//    }
//
//    public AuthResponse(String token, List<String> roles, String email, String message, boolean success) {
//        this(null, token, roles, email, message, success);
//    }
//
//    public AuthResponse(Long id, String token, List<String> roles, String email, String message, boolean success) {
//        this.id = id;
//        this.token = token;
//        this.roles = roles;
//        this.email = email;
//        this.message = message;
//        this.success = success;
//    }
//
//    public AuthResponse(String email, String message, boolean success) {
//        this(null, email, message, success);
//    }
//
//    public AuthResponse(Long id, String email, String message, boolean success) {
//        this.id = id;
//        this.email = email;
//        this.message = message;
//        this.success = success;
//        this.roles = List.of();
//    }
//}


import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Unified auth response returned by every auth endpoint.
 *
 * Fields:
 *  id      – user's DB id (null when OTP is only sent, not yet verified)
 *  email   – user's email
 *  token   – JWT (null until the user is fully authenticated)
 *  roles   – e.g. ["CUSTOMER"] or ["OWNER"]
 *  status  – e.g. "ACTIVE", "PENDING", "BLOCKED"
 *  message – human-readable result message
 *  success – true / false
 */
@Getter
@NoArgsConstructor
public class AuthResponse {

    private Long         id;
    private String       email;
    private String       token;
    private List<String> roles;
    private String       status;
    private String       message;
    private boolean      success;

    // ------------------------------------------------------------------
    // Constructor A – full authenticated response (login / verify OTP)
    // ------------------------------------------------------------------
    public AuthResponse(Long id,
                        String token,
                        List<String> roles,
                        String email,
                        String status,
                        String message,
                        boolean success) {
        this.id      = id;
        this.token   = token;
        this.roles   = roles;
        this.email   = email;
        this.status  = status;
        this.message = message;
        this.success = success;
    }

    // ------------------------------------------------------------------
    // Constructor B – unauthenticated / OTP-sent response
    //                 (register, reset/request)
    // ------------------------------------------------------------------
    public AuthResponse(String email, String message, boolean success) {
        this.email   = email;
        this.message = message;
        this.success = success;
    }

    // ------------------------------------------------------------------
    // Legacy constructor kept for backward-compatibility
    //   AuthResponse(token, roles, email, message, success)
    // ------------------------------------------------------------------
    public AuthResponse(String token,
                        List<String> roles,
                        String email,
                        String message,
                        boolean success) {
        this.token   = token;
        this.roles   = roles;
        this.email   = email;
        this.message = message;
        this.success = success;
    }

    public AuthResponse(Long id, String token, List<String> roles, String email) {
    }
}