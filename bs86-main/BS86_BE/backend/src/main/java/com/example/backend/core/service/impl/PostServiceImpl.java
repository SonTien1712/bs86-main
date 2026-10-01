package com.example.backend.core.service.impl;

import com.example.backend.core.entity.Field;
import com.example.backend.core.entity.Post;
import com.example.backend.core.enums.PostStatus;
import com.example.backend.core.repository.FieldRepository;
import com.example.backend.core.repository.PostRepository;
import com.example.backend.core.service.PostService;
import com.example.backend.presentation.dto.request.CreatePostRequest;
import com.example.backend.presentation.dto.response.PostResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final FieldRepository fieldRepository;

    @Override
    public PostResponse createPost(CreatePostRequest request, Long authorId) {
        if (request.getFieldId() == null) {
            throw new RuntimeException("Field is required");
        }

        if (request.getCategory() == null) {
            throw new RuntimeException("Post category is required");
        }

        Field field = fieldRepository.findById(request.getFieldId())
                .orElseThrow(() -> new RuntimeException("Field not found"));

        if (field.getOwner() == null
                || field.getOwner().getUser() == null
                || !authorId.equals(field.getOwner().getUser().getId())) {
            throw new RuntimeException("You can only create posts for your own field");
        }

        Post post = Post.builder()
                .authorId(authorId)
                .fieldId(request.getFieldId())
                .category(request.getCategory())
                .content(request.getContent())
                .status(PostStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        Post saved = postRepository.save(post);
        return toResponse(saved);
    }

    @Override
    public List<PostResponse> getOwnerPosts(Long authorId) {
        Map<Long, Field> fieldsById = new HashMap<>();

        return postRepository.findByAuthorId(authorId)
                .stream()
                .sorted(Comparator.comparing(Post::getCreatedAt).reversed())
                .map(post -> toResponse(post, getField(fieldsById, post.getFieldId())))
                .collect(Collectors.toList());
    }

    @Override
    public List<PostResponse> getFeedPosts() {
        Map<Long, Field> fieldsById = new HashMap<>();

        return postRepository.findAllActive()
                .stream()
                .sorted(Comparator.comparing(Post::getCreatedAt).reversed())
                .map(post -> toResponse(post, getField(fieldsById, post.getFieldId())))
                .collect(Collectors.toList());
    }

    private PostResponse toResponse(Post post) {
        return toResponse(post, getField(new HashMap<>(), post.getFieldId()));
    }

    private PostResponse toResponse(Post post, Field field) {
        return PostResponse.builder()
                .id(post.getId())
                .authorId(post.getAuthorId())
                .fieldId(post.getFieldId())
                .fieldName(field != null ? field.getName() : null)
                .fieldAddress(field != null ? field.getAddress() : null)
                .fieldImage(field != null && field.getDetail() != null ? field.getDetail().getCoverImageUrl() : null)
                .sportType(field != null ? field.getSportType() : null)
                .category(post.getCategory())
                .content(post.getContent())
                .status(post.getStatus())
                .createdAt(post.getCreatedAt())
                .build();
    }

    private Field getField(Map<Long, Field> fieldsById, Long fieldId) {
        if (fieldId == null) {
            return null;
        }

        if (fieldsById.containsKey(fieldId)) {
            return fieldsById.get(fieldId);
        }

        Field field = fieldRepository.findById(fieldId).orElse(null);
        fieldsById.put(fieldId, field);
        return field;
    }
}
