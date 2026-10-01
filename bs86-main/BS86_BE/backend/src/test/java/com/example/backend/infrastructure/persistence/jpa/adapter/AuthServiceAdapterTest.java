package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.OwnerProfile;
import com.example.backend.core.entity.User;
import com.example.backend.core.enums.Role;
import com.example.backend.core.enums.UserStatus;
import com.example.backend.core.repository.OtpRepository;
import com.example.backend.core.repository.OwnerProfileRepository;
import com.example.backend.core.repository.UserRepository;
import com.example.backend.core.service.NotificationService;
import com.example.backend.infrastructure.external.EmailService;
import com.example.backend.infrastructure.external.FirebaseService;
import com.example.backend.infrastructure.security.jwt.JwtUtil;
import com.example.backend.presentation.dto.request.OwnerRegisterRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceAdapterTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OtpRepository otpRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private FirebaseService firebaseService;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private NotificationService notificationService;

    @Mock
    private OwnerProfileRepository ownerProfileRepository;

    @InjectMocks
    private AuthServiceAdapter authServiceAdapter;

    @Test
    void registerOwner_createsOwnerProfileForNewOwner() {
        OwnerRegisterRequest request = new OwnerRegisterRequest();
        request.setEmail("owner-new@example.com");
        request.setPassword("secret123");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(99L);
            return saved;
        });
        when(ownerProfileRepository.save(any(OwnerProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authServiceAdapter.registerOwner(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertEquals(UserStatus.PENDING, savedUser.getStatus());
        assertTrue(savedUser.getRoles().stream().anyMatch(role -> role.getRole() == Role.OWNER));

        ArgumentCaptor<OwnerProfile> profileCaptor = ArgumentCaptor.forClass(OwnerProfile.class);
        verify(ownerProfileRepository).save(profileCaptor.capture());
        OwnerProfile profile = profileCaptor.getValue();
        assertNotNull(profile.getUser());
        assertEquals(99L, profile.getUser().getId());
        assertEquals(request.getEmail(), profile.getUser().getEmail());
    }
}
