package com.example.backend.presentation.controller;

import com.example.backend.core.service.pass.PassConversationService;
import com.example.backend.core.service.pass.PassPostService;
import com.example.backend.presentation.dto.request.pass.ContactPassPostRequest;
import com.example.backend.presentation.dto.request.pass.CreatePassPostRequest;
import com.example.backend.presentation.dto.response.pass.PassConversationDetailResponse;
import com.example.backend.presentation.dto.response.pass.PassPostResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/pass-posts")
@RequiredArgsConstructor
public class PassPostController {

    private final PassPostService passPostService;
    private final PassConversationService passConversationService;

    @PostMapping
    public ResponseEntity<PassPostResponse> createPassPost(@Valid @RequestBody CreatePassPostRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(passPostService.createPassPost(request));
    }

    @GetMapping
    public List<PassPostResponse> listPassPosts() {
        return passPostService.listActivePassPosts();
    }

    @PostMapping("/{passPostId}/contact")
    public PassConversationDetailResponse contactPassPost(
            @PathVariable Long passPostId,
            @Valid @RequestBody(required = false) ContactPassPostRequest request
    ) {
        return passConversationService.contactPassPost(passPostId, request);
    }
}
