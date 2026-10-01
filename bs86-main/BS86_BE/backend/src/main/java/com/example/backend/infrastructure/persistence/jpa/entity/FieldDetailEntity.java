package com.example.backend.infrastructure.persistence.jpa.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "field_detail")
public class FieldDetailEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "field_id", nullable = false, unique = true)
    private FieldEntity field;

    @Column(length = 2000)
    private String description;

    @Column(length = 50)
    private String phone;

    @Column(length = 255)
    private String openingHours;

    @Column(length = 2000)
    private String bookingPolicy;

    @Column(length = 1000)
    private String coverImageUrl;
}
