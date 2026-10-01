package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.core.enums.FieldStatus;
import com.example.backend.infrastructure.persistence.jpa.entity.FieldEntity;
import com.example.backend.presentation.dto.response.FieldMarkerResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FieldJpaRepository extends JpaRepository<FieldEntity, Long> {

    List<FieldEntity> findByStatus(FieldStatus status);

    List<FieldEntity> findByOwnerId(Long ownerId);

    Optional<FieldEntity> findBySlug(String slug);

    boolean existsBySlug(String slug);

    @Query("""
                select new com.example.backend.presentation.dto.response.FieldMarkerResponse(
                    f.id,
                    f.name,
                    f.slug,
                    f.sportType,
                    f.address,
                    f.latitude,
                    f.longitude,
                    d.openingHours,
                    d.phone,
                    d.coverImageUrl
                )
                from FieldEntity f
                left join f.detail d
                where f.status = :status
                  and (:sportType is null or f.sportType = :sportType)
                  and f.latitude is not null
                  and f.longitude is not null
                  and f.latitude between :minLat and :maxLat
                  and f.longitude between :minLng and :maxLng
            """)
    List<FieldMarkerResponse> findMarkersInBox(
            @Param("status") FieldStatus status,
            @Param("sportType") String sportType,
            @Param("minLat") double minLat,
            @Param("maxLat") double maxLat,
            @Param("minLng") double minLng,
            @Param("maxLng") double maxLng);

    List<FieldEntity> findByOwner_User_Id(Long userId);
}
