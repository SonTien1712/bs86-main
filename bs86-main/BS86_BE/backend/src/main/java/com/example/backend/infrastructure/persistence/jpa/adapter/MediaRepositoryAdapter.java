package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.Media;
import com.example.backend.core.enums.OwnerType;
import com.example.backend.core.repository.MediaRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.MediaEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.MediaJpaRepository;
import com.example.backend.infrastructure.persistence.mapper.MediaMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class MediaRepositoryAdapter implements MediaRepository {
    private final MediaJpaRepository repo;
    private final MediaMapper mapper;

    @Override
    public Media save(Media media) {
        MediaEntity saved = repo.save(mapper.toEntity(media));
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<Media> findById(Long id) {
        return repo.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<Media> findAll() {
        return repo.findAll().stream().map(mapper::toDomain).collect(Collectors.toList());
    }

    @Override
    public void deleteById(Long id) {
        repo.deleteById(id);
    }

    @Override
    public List<Media> findByOwnerTypeAndOwnerId(OwnerType ownerType, Long ownerId) {
        return repo.findByOwnerTypeAndOwnerId(ownerType, ownerId).stream().map(mapper::toDomain)
                .collect(Collectors.toList());
    }
}
