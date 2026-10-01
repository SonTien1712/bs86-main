package com.example.backend.core.repository;

import com.example.backend.presentation.dto.response.FieldMarkerResponse;
import com.example.backend.core.entity.Field;
import com.example.backend.core.enums.FieldStatus;
import java.util.List;
import java.util.Optional;

import java.util.List;

public interface FieldRepository {

    Field save(Field field);

    Optional<Field> findById(Long id);

    Optional<Field> findBySlug(String slug);

    List<Field> findAll();

    void deleteById(Long id);

    List<Field> findByStatus(FieldStatus status);

    List<Field> findByOwnerId(Long ownerId);

    boolean existsBySlug(String slug);

    List<FieldMarkerResponse> findMarkersInBox(
            FieldStatus status,
            String sportType,
            double minLat,
            double maxLat,
            double minLng,
            double maxLng);

    List<Field> findByOwner_User_Id(Long userId);

    long countField();
}
