package com.example.backend.core.repository;

import com.example.backend.core.entity.Post;

import java.util.List;
import java.util.Optional;

public interface PostRepository {
    Post save(Post post);
    Optional<Post> findById(Long id);
    List<Post> findByAuthorId(Long authorId);
    List<Post> findAllActive();
}
