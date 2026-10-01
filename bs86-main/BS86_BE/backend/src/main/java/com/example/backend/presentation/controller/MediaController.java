package com.example.backend.presentation.controller;

import com.example.backend.core.enums.MediaType;
import com.example.backend.core.enums.OwnerType;
import com.example.backend.core.entity.Media;
import com.example.backend.core.service.MediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;

    // UPLOAD — cho phép cả unauthenticated (dùng khi đăng ký owner chưa có token)
    @PostMapping("/upload")
    public Media upload(
            @RequestParam MultipartFile file,
            @RequestParam OwnerType ownerType,
            @RequestParam Long ownerId,
            @RequestParam MediaType type) {

        return mediaService.upload(file, ownerType, ownerId, type);
    }

    // GET MEDIA BY ENTITY — public, không cần đăng nhập
    @GetMapping
    public List<Media> getMedia(
            @RequestParam OwnerType ownerType,
            @RequestParam Long ownerId) {

        return mediaService.getMedia(ownerType, ownerId);
    }

    // DELETE MEDIA — chỉ OWNER hoặc ADMIN
    @PreAuthorize("hasAnyAuthority('OWNER', 'ADMIN')")
    @DeleteMapping("/{mediaId}")
    public ResponseEntity<String> delete(@PathVariable Long mediaId) {
        mediaService.deleteMedia(mediaId);
        return ResponseEntity.ok("Deleted successfully");
    }
}
