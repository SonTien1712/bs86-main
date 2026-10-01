package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.core.enums.PostStatus;
import com.example.backend.infrastructure.persistence.jpa.entity.PostEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostJpaRepository extends JpaRepository<PostEntity, Long> {
    List<PostEntity> findByAuthorIdAndStatus(Long authorId, PostStatus status);
    List<PostEntity> findByStatus(PostStatus status);
}
