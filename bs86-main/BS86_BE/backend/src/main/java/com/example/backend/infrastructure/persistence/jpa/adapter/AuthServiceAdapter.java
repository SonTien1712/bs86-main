package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.Otp;
import com.example.backend.core.entity.OwnerProfile;
import com.example.backend.core.entity.OwnerVerification;
import com.example.backend.core.entity.User;
import com.example.backend.core.enums.OtpType;
import com.example.backend.core.enums.Role;
import com.example.backend.core.enums.UserStatus;
import com.example.backend.core.enums.VerificationStatus;
import com.example.backend.core.repository.OtpRepository;
import com.example.backend.core.repository.OwnerProfileRepository;
import com.example.backend.core.repository.OwnerVerificationRepository;
import com.example.backend.core.repository.UserRepository;
import com.example.backend.core.service.NotificationService;
import com.example.backend.infrastructure.external.EmailService;
import com.example.backend.infrastructure.external.FirebaseService;
import com.example.backend.infrastructure.persistence.jpa.repository.AuthServiceRepository;
import com.example.backend.infrastructure.security.jwt.JwtService;
import com.example.backend.presentation.dto.request.CustomerRegisterRequest;
import com.example.backend.presentation.dto.request.GoogleLoginRequest;
import com.example.backend.presentation.dto.request.OwnerRegisterRequest;
import com.example.backend.presentation.dto.request.PasswordResetRequest;
import com.example.backend.presentation.dto.request.RegisterRequest;
import com.example.backend.presentation.dto.request.ResetPasswordConfirmRequest;
import com.example.backend.presentation.dto.request.VerifyOtpRequest;
import com.example.backend.presentation.exception.BusinessException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class AuthServiceAdapter implements AuthServiceRepository {

    private final UserRepository              userRepository;
    private final OtpRepository               otpRepository;
    private final EmailService                emailService;
    private final FirebaseService             firebaseService;
    private final JwtService                  jwtService;
    private final OwnerProfileRepository      ownerProfileRepository;
    private final OwnerVerificationRepository ownerVerificationRepository;
    private final NotificationService         notificationService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final Random                random          = new Random();

    @Value("${otp.expiry-minutes:5}")
    private int otpExpiryMinutes;

    public AuthServiceAdapter(UserRepository userRepository,
                              OtpRepository otpRepository,
                              EmailService emailService,
                              FirebaseService firebaseService,
                              JwtService jwtService,
                              OwnerProfileRepository ownerProfileRepository,
                              OwnerVerificationRepository ownerVerificationRepository,
                              NotificationService notificationService) {
        this.userRepository              = userRepository;
        this.otpRepository               = otpRepository;
        this.emailService                = emailService;
        this.firebaseService             = firebaseService;
        this.jwtService                  = jwtService;
        this.ownerProfileRepository      = ownerProfileRepository;
        this.ownerVerificationRepository = ownerVerificationRepository;
        this.notificationService         = notificationService;
    }

    // =========================================================================
    // Token generation — delegated to controller
    // =========================================================================

    /**
     * Generate a signed JWT for the given user.
     * Called by AuthController AFTER any successful authentication event
     * (verify OTP, login, Google login).
     */
    @Override
    public String generateToken(User user) {
        return jwtService.generateToken(user);
    }

    // =========================================================================
    // Register / OTP
    // =========================================================================

    @Transactional
    @Override
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email already registered");
        }

        otpRepository.invalidateAllForEmail(request.getEmail(), OtpType.REGISTER);
        String otpCode = generateOtp();
        Otp otp = buildOtp(request.getEmail(), otpCode, OtpType.REGISTER);
        otpRepository.save(otp);
        emailService.sendOtp(request.getEmail(), otpCode, "Verify your email");
    }

    /**
     * Verify OTP — pure business logic only.
     * Does NOT generate a JWT. The controller calls generateToken() separately.
     */
    @Transactional
    @Override
    public User verifyOtp(VerifyOtpRequest request) {
        Otp otp = otpRepository.findByEmailAndOtpCodeAndTypeAndUsedFalseAndExpiresAtAfter(
                        request.getEmail(),
                        request.getOtpCode(),
                        OtpType.REGISTER,
                        LocalDateTime.now())
                .orElseThrow(() -> new BusinessException("Invalid or expired OTP"));

        otp.setUsed(true);
        otpRepository.save(otp);

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setProvider("EMAIL");
        user.setStatus(UserStatus.ACTIVE);
        user.addRole(Role.CUSTOMER);
        user.setEmailVerified(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);
        notificationService.notifyNewUserRegistered(savedUser);
        return savedUser;
    }

    // =========================================================================
    // Google Login
    // =========================================================================

    @Override
    @Transactional
    public User googleLogin(GoogleLoginRequest request) {
        try {
            var firebaseToken = firebaseService.verifyGoogleToken(request.getIdToken());
            String email = firebaseToken.getEmail();
            String uid   = firebaseToken.getUid();
            AtomicBoolean created = new AtomicBoolean(false);

            User user = userRepository.findByProviderAndProviderId("GOOGLE", uid)
                    .orElseGet(() -> {
                        User newUser = new User();
                        newUser.setEmail(email);
                        newUser.setProvider("GOOGLE");
                        newUser.setProviderId(uid);
                        newUser.setStatus(UserStatus.ACTIVE);
                        newUser.addRole(Role.CUSTOMER);
                        newUser.setEmailVerified(true);
                        newUser.setCreatedAt(LocalDateTime.now());
                        newUser.setUpdatedAt(LocalDateTime.now());
                        created.set(true);
                        return userRepository.save(newUser);
                    });

            normalizeAuthenticatedUser(user, "GOOGLE", Role.CUSTOMER);
            User savedUser = userRepository.save(user);

            if (created.get()) {
                notificationService.notifyNewUserRegistered(savedUser);
            }
            return savedUser;

        } catch (Exception e) {
            throw new BusinessException("Invalid Google token: " + e.getMessage());
        }
    }

    // =========================================================================
    // Password reset
    // =========================================================================

    @Override
    @Transactional
    public void requestPasswordReset(PasswordResetRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isEmpty()) {
            throw new BusinessException("Email not found");
        }

        otpRepository.invalidateAllForEmail(request.getEmail(), OtpType.RESET_PASSWORD);
        String otpCode = generateOtp();
        Otp otp = buildOtp(request.getEmail(), otpCode, OtpType.RESET_PASSWORD);
        otpRepository.save(otp);
        emailService.sendOtp(request.getEmail(), otpCode, "Reset your password");
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordConfirmRequest request) {
        Otp otp = otpRepository.findByEmailAndOtpCodeAndTypeAndUsedFalseAndExpiresAtAfter(
                        request.getEmail(),
                        request.getOtpCode(),
                        OtpType.RESET_PASSWORD,
                        LocalDateTime.now())
                .orElseThrow(() -> new BusinessException("Invalid or expired OTP"));

        otp.setUsed(true);
        otpRepository.save(otp);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException("User not found"));
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    // =========================================================================
    // Login (email/password)
    // =========================================================================

    @Override
    public User login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Invalid email or password"));

        if (user.getProvider() != null && !user.getProvider().equals("EMAIL")) {
            throw new BusinessException("Account not registered with email/password");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BusinessException("Invalid email or password");
        }

        if (!user.isEmailVerified()) {
            throw new BusinessException("Email not verified. Please verify your email first.");
        }

        normalizeAuthenticatedUser(user, "EMAIL", null);
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    // =========================================================================
    // Misc
    // =========================================================================

    @Override
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found"));
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Transactional
    @Override
    public void registerCustomer(CustomerRegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new BusinessException("Email already registered");
        }

        User user = new User();
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setStatus(UserStatus.ACTIVE);
        user.addRole(Role.CUSTOMER);
        user.setProvider("EMAIL");
        user.setEmailVerified(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);
        notificationService.notifyNewUserRegistered(savedUser);
    }

    @Transactional
    @Override
    public void registerOwner(OwnerRegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new BusinessException("Email already registered");
        }

        User user = new User();
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setFullName(req.getOwnerName());
        user.setPhoneNumber(req.getPhoneNumber());
        user.setStatus(UserStatus.PENDING);
        user.addRole(Role.OWNER);
        user.setProvider("EMAIL");
        user.setEmailVerified(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        OwnerProfile profile = new OwnerProfile();
        profile.setUser(savedUser);
        OwnerProfile savedProfile = ownerProfileRepository.save(profile);

        OwnerVerification verification = new OwnerVerification();
        verification.setOwner(savedProfile);
        verification.setIdCardNumber(req.getIdCardNumber());
        verification.setIdCardFrontUrl(req.getIdCardFrontUrl());
        verification.setIdCardBackUrl(req.getIdCardBackUrl());
        verification.setBusinessLicenseUrl(req.getBusinessLicenseUrl());
        verification.setStatus(VerificationStatus.PENDING);
        verification.setAttemptCount(1); // Three-Strike: first submission counts as attempt #1
        ownerVerificationRepository.save(verification);

        notificationService.notifyNewUserRegistered(savedUser);
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    private String generateOtp() {
        return String.format("%06d", random.nextInt(1_000_000));
    }

    private Otp buildOtp(String email, String otpCode, OtpType type) {
        Otp otp = new Otp();
        otp.setEmail(email);
        otp.setOtpCode(otpCode);
        otp.setType(type);
        otp.setUsed(false);
        otp.setCreatedAt(LocalDateTime.now());
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(otpExpiryMinutes));
        return otp;
    }

    private void normalizeAuthenticatedUser(User user, String provider, Role fallbackRole) {
        if (user.getProvider() == null || user.getProvider().isBlank()) {
            user.setProvider(provider);
        }
        if (user.getStatus() == null) {
            user.setStatus(UserStatus.ACTIVE);
        }
        if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
        }
        if ((user.getRoles() == null || user.getRoles().isEmpty()) && fallbackRole != null) {
            user.addRole(fallbackRole);
        }
        if (user.getCreatedAt() == null) {
            user.setCreatedAt(LocalDateTime.now());
        }
        user.setUpdatedAt(LocalDateTime.now());
    }
}