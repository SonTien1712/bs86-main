package com.example.backend.infrastructure.persistence.jpa.entity;

import com.example.backend.core.enums.OtpType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "otps")
@Getter
@Setter
@NoArgsConstructor
public class OtpEntity {

    @Id  // ✅ dùng từ jakarta.persistence.* ở trên, không cần import riêng
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;
    private String otpCode;

    @Enumerated(EnumType.STRING)
    private OtpType type;

    private boolean used;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}