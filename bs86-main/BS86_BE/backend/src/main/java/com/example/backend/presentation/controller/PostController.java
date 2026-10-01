package com.example.backend.presentation.controller;

import com.example.backend.core.entity.User;
import com.example.backend.core.repository.UserRepository;
import com.example.backend.core.service.PostService;
import com.example.backend.presentation.dto.request.CreatePostRequest;
import com.example.backend.presentation.dto.response.PostResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final UserRepository userRepository;

    /**
     * Owner creates an empty-court announcement post.
     * POST /api/posts
     */
    @PreAuthorize("hasRole('OWNER')")
    @PostMapping
    public ResponseEntity<PostResponse> createPost(
            @RequestBody CreatePostRequest request,
            Authentication auth
    ) {
        User author = userRepository.findByEmail(auth.getName()).orElseThrow(
                () -> new RuntimeException("User not found")
        );
        PostResponse response = postService.createPost(request, author.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * Owner views their own posts.
     * GET /api/posts/my
     */
    @PreAuthorize("hasRole('OWNER')")
    @GetMapping("/my")
    public ResponseEntity<List<PostResponse>> getMyPosts(Authentication auth) {
        User author = userRepository.findByEmail(auth.getName()).orElseThrow(
                () -> new RuntimeException("User not found")
        );
        return ResponseEntity.ok(postService.getOwnerPosts(author.getId()));
    }

    /**
     * Public feed — all ACTIVE posts, newest first.
     * GET /api/posts
     */
    @GetMapping
    public ResponseEntity<List<PostResponse>> getFeed() {
        return ResponseEntity.ok(postService.getFeedPosts());
    }
}
