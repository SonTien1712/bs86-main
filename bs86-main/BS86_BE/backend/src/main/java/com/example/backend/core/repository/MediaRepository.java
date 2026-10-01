package com.example.backend.core.repository;

import com.example.backend.core.entity.Media;
import com.example.backend.core.enums.OwnerType;

import java.util.List;
import java.util.Optional;

public interface MediaRepository {
    Media save(Media media);

    Optional<Media> findById(Long id);

    List<Media> findAll();

    void deleteById(Long id);

    List<Media> findByOwnerTypeAndOwnerId(OwnerType ownerType, Long ownerId);
}
