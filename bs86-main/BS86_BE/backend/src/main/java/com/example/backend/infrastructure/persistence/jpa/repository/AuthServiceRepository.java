package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.core.entity.User;
import com.example.backend.presentation.dto.request.CustomerRegisterRequest;
import com.example.backend.presentation.dto.request.GoogleLoginRequest;
import com.example.backend.presentation.dto.request.OwnerRegisterRequest;
import com.example.backend.presentation.dto.request.PasswordResetRequest;
import com.example.backend.presentation.dto.request.RegisterRequest;
import com.example.backend.presentation.dto.request.ResetPasswordConfirmRequest;
import com.example.backend.presentation.dto.request.VerifyOtpRequest;
import jakarta.transaction.Transactional;

public interface AuthServiceRepository {

    @Transactional
    void register(RegisterRequest request);

    @Transactional
    User verifyOtp(VerifyOtpRequest request);

    User googleLogin(GoogleLoginRequest request);

    void requestPasswordReset(PasswordResetRequest request);

    void resetPassword(ResetPasswordConfirmRequest request);

    User getUserByEmail(String email);

    User login(String email, String password);

    void registerCustomer(CustomerRegisterRequest req);

    void registerOwner(OwnerRegisterRequest req);

    /** Generate a signed JWT for an already-authenticated user. */
    String generateToken(User user);
}