package com.example.backend.infrastructure.persistence.jpa.entity;

import com.example.backend.core.enums.CourtStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "courts", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "field_id", "court_number" })
})
public class CourtEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "field_id", nullable = false)
    private FieldEntity field;

    private Integer courtNumber; // 1,2,3,4,5...

    @Enumerated(EnumType.STRING)
    private CourtStatus status; // ACTIVE, MAINTENANCE
}
