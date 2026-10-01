package com.example.backend.infrastructure.persistence.jpa.entity;

import com.example.backend.core.enums.FieldStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(
        name = "field",
        uniqueConstraints = @UniqueConstraint(name = "uk_field_slug", columnNames = "slug")
)
public class FieldEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private OwnerProfileEntity owner;

    private String name;
    @Column(unique = true, length = 140)
    private String slug;
    private String address;
    private String sportType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FieldStatus status;

    @OneToOne(mappedBy = "field", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private FieldVerificationEntity verification;

    @OneToOne(mappedBy = "field", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private FieldDetailEntity detail;

    private Double latitude;
    private Double longitude;
}
