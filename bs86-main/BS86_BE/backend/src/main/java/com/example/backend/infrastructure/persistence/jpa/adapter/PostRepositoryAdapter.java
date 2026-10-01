package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.Post;
import com.example.backend.core.enums.PostStatus;
import com.example.backend.core.repository.PostRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.PostJpaRepository;
import com.example.backend.infrastructure.persistence.mapper.PostMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PostRepositoryAdapter implements PostRepository {

    private final PostJpaRepository jpaRepository;
    private final PostMapper mapper;

    @Override
    public Post save(Post post) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(post)));
    }

    @Override
    public Optional<Post> findById(Long id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<Post> findByAuthorId(Long authorId) {
        return jpaRepository.findByAuthorIdAndStatus(authorId, PostStatus.ACTIVE)
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Post> findAllActive() {
        return jpaRepository.findByStatus(PostStatus.ACTIVE)
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }
}
