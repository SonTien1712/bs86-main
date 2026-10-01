package com.example.backend.infrastructure.security.auth;

import com.example.backend.core.enums.Role;
import com.example.backend.core.entity.CustomerProfile;
import com.example.backend.core.entity.OwnerProfile;
import com.example.backend.core.entity.OwnerVerification;
import com.example.backend.core.entity.User;
import com.example.backend.presentation.dto.response.AuthResponse;
import com.example.backend.presentation.dto.request.CustomerRegisterRequest;
import com.example.backend.presentation.dto.request.LoginRequest;
import com.example.backend.presentation.dto.request.OwnerRegisterRequest;
import com.example.backend.core.enums.UserStatus;
import com.example.backend.core.enums.VerificationStatus;
import com.example.backend.core.factory.UserFactory;
import com.example.backend.infrastructure.security.jwt.JwtUtil;

import com.example.backend.infrastructure.persistence.mapper.CustomerProfileMapper;
import com.example.backend.infrastructure.persistence.jpa.entity.UserEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.CustomerProfileEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.CustomerProfileJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.UserJpaRepository;

import com.example.backend.core.repository.OwnerProfileRepository;
import com.example.backend.core.repository.OwnerVerificationRepository;
import com.example.backend.core.repository.UserRepository;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo; // domain repo
    private final UserJpaRepository userJpaRepo; // ✅ dùng để lấy Entity

    private final PasswordEncoder encoder;
    private final UserFactory factory;
    private final JwtUtil jwtUtil;

    private final OwnerProfileRepository ownerRepo;
    private final OwnerVerificationRepository ownerVerRepo;

    private final CustomerProfileMapper customerProfileMapper;
    private final CustomerProfileJpaRepository customerProfileRepo;

    @PostConstruct
    public void checkEncoder() {
        System.out.println("PasswordEncoder = " + encoder.getClass().getName());
    }

    // ================= REGISTER CUSTOMER =================
    @Transactional
    public void registerCustomer(CustomerRegisterRequest req) {

        if (userRepo.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // 1. DOMAIN USER
        User user = new User();
        user.setEmail(req.getEmail());
        user.setPassword(encoder.encode(req.getPassword()));
        user.setStatus(UserStatus.ACTIVE);
        user.addRole(Role.CUSTOMER);

        // 2. SAVE (qua adapter → JPA)
        userRepo.save(user);

        // 3. LẤY LẠI ENTITY (🔥 QUAN TRỌNG)
        UserEntity savedUserEntity = userJpaRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found after save"));

        // 4. DOMAIN PROFILE
        CustomerProfile profile = factory.createCustomer(user, req);

        // 5. MAP → ENTITY
        CustomerProfileEntity entity = customerProfileMapper.toEntity(profile);

        // 6. SET USER ENTITY (🔥 QUAN TRỌNG NHẤT)
        entity.setUser(savedUserEntity);

        // 7. SAVE
        customerProfileRepo.save(entity);
    }

    // ================= REGISTER OWNER =================
    @Transactional
    public void registerOwner(OwnerRegisterRequest req) {

        if (userRepo.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setEmail(req.getEmail());
        user.setPassword(encoder.encode(req.getPassword()));
        user.setStatus(UserStatus.PENDING);
        user.addRole(Role.OWNER);

        userRepo.save(user);

        OwnerProfile owner = new OwnerProfile();
        owner.setUser(user);
        ownerRepo.save(owner);

        OwnerVerification ov = new OwnerVerification();
        ov.setOwner(owner);
        ov.setIdCardNumber(req.getIdCardNumber());
        ov.setBusinessLicenseUrl(req.getBusinessLicenseUrl());
        ov.setStatus(VerificationStatus.PENDING);

        ownerVerRepo.save(ov);
    }

    // ================= LOGIN =================
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {

        User user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!encoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        boolean isOwner = user.getRoles().stream()
                .anyMatch(ur -> ur.getRole() == Role.OWNER);

        if (!isOwner && user.getStatus() != UserStatus.ACTIVE) {
            throw new RuntimeException("Account is not active");
        }

        List<String> roles = user.getRoles()
                .stream()
                .map(ur -> ur.getRole().name())
                .toList();

        String status = user.getStatus() != null ? user.getStatus().name() : "ACTIVE";
        String token = jwtUtil.generateToken(
                user.getId(),
                user.getEmail(),
                roles,
                status);

        return new AuthResponse(
                user.getId(),
                token,
                roles,
                user.getEmail());
    }
}
