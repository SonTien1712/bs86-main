package com.example.backend.core.service;

import com.example.backend.core.entity.Post;
import com.example.backend.presentation.dto.request.CreatePostRequest;
import com.example.backend.presentation.dto.response.PostResponse;

import java.util.List;

public interface PostService {
    PostResponse createPost(CreatePostRequest request, Long authorId);
    List<PostResponse> getOwnerPosts(Long authorId);
    List<PostResponse> getFeedPosts();
}
