package com.example.backend.presentation.controller;

import com.example.backend.core.entity.User;
import com.example.backend.infrastructure.persistence.jpa.adapter.AuthServiceAdapter;
import com.example.backend.presentation.dto.request.CustomerRegisterRequest;
import com.example.backend.presentation.dto.request.GoogleLoginRequest;
import com.example.backend.presentation.dto.request.LoginRequest;
import com.example.backend.presentation.dto.request.OwnerRegisterRequest;
import com.example.backend.presentation.dto.request.PasswordResetRequest;
import com.example.backend.presentation.dto.request.RegisterRequest;
import com.example.backend.presentation.dto.request.ResetPasswordConfirmRequest;
import com.example.backend.presentation.dto.request.VerifyOtpRequest;
import com.example.backend.presentation.dto.response.ApiResponse;
import com.example.backend.presentation.dto.response.AuthResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthServiceAdapter authService;

    // -------------------------------------------------------------------------
    // Register — only sends OTP, no token yet
    // -------------------------------------------------------------------------

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.OK)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return new AuthResponse(request.getEmail(), "OTP sent to email", true);
    }

    // -------------------------------------------------------------------------
    // Verify OTP — activates account + auto-login (returns JWT)
    // -------------------------------------------------------------------------

    @PostMapping("/verify")
    @ResponseStatus(HttpStatus.OK)          // 200 — client can auto-login immediately
    public AuthResponse verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        // 1. Business logic: validate OTP, create & activate user
        User user = authService.verifyOtp(request);

        // 2. Generate token here in the controller (single responsibility)
        String token = authService.generateToken(user);

        return toAuthenticatedResponse(user, token, "Account verified successfully");
    }

    // -------------------------------------------------------------------------
    // Login
    // -------------------------------------------------------------------------

    @PostMapping("/login")
    @ResponseStatus(HttpStatus.OK)
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        User user  = authService.login(request.getEmail(), request.getPassword());
        String token = authService.generateToken(user);
        return toAuthenticatedResponse(user, token, "Login successful");
    }

    // -------------------------------------------------------------------------
    // Google OAuth
    // -------------------------------------------------------------------------

    @PostMapping("/google")
    @ResponseStatus(HttpStatus.OK)
    public AuthResponse googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        User user  = authService.googleLogin(request);
        String token = authService.generateToken(user);
        return toAuthenticatedResponse(user, token, "Google login successful");
    }

    // -------------------------------------------------------------------------
    // Password reset (no JWT needed)
    // -------------------------------------------------------------------------

    @PostMapping("/reset/request")
    public AuthResponse requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        authService.requestPasswordReset(request);
        return new AuthResponse(request.getEmail(), "Password reset OTP sent", true);
    }

    @PostMapping("/reset/confirm")
    public AuthResponse resetPassword(@Valid @RequestBody ResetPasswordConfirmRequest request) {
        authService.resetPassword(request);
        return new AuthResponse(request.getEmail(), "Password reset successful", true);
    }

    // -------------------------------------------------------------------------
    // Quick-register helpers (admin / internal use)
    // -------------------------------------------------------------------------

    @PostMapping("/register/customer")
    public ResponseEntity<ApiResponse<Void>> registerCustomer(
            @RequestBody CustomerRegisterRequest req) {
        try {
            authService.registerCustomer(req);
            return ResponseEntity.ok(new ApiResponse<>("Customer registered successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(e.getMessage(), null));
        }
    }

    @PostMapping("/register/owner")
    public ResponseEntity<ApiResponse<Void>> registerOwner(
            @RequestBody OwnerRegisterRequest req) {
        try {
            authService.registerOwner(req);
            return ResponseEntity.ok(new ApiResponse<>("Owner registered. Waiting for approval", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(e.getMessage(), null));
        }
    }

    // -------------------------------------------------------------------------
    // Utilities
    // -------------------------------------------------------------------------

    /** Check whether an email is already taken (used during registration). */
    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<Boolean>> checkEmail(@RequestParam String email) {
        boolean taken = authService.existsByEmail(email.trim().toLowerCase());
        return ResponseEntity.ok(new ApiResponse<>(taken ? "taken" : "available", taken));
    }

    // -------------------------------------------------------------------------
    // Private helper
    // -------------------------------------------------------------------------

    /**
     * Build a fully-populated AuthResponse for any successful authentication.
     * id, token, roles, status are all included so the frontend can auto-login.
     */
    private AuthResponse toAuthenticatedResponse(User user, String token, String message) {
        List<String> roles = user.getRoles() == null
                ? List.of()
                : user.getRoles().stream()
                .map(ur -> ur.getRole().name())
                .toList();

        String status = user.getStatus() != null ? user.getStatus().name() : "ACTIVE";

        return new AuthResponse(
                user.getId(),
                token,
                roles,
                user.getEmail(),
                status,
                message,
                true
        );
    }
}