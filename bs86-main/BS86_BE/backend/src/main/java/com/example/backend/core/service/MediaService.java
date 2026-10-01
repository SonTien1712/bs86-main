package com.example.backend.core.service;

import com.example.backend.core.enums.MediaType;
import com.example.backend.core.enums.OwnerType;
import com.example.backend.core.entity.Media;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
public interface MediaService {

    Media upload(MultipartFile file, OwnerType ownerType, Long ownerId, MediaType type);

    List<Media> getMedia(OwnerType ownerType, Long ownerId);

    void deleteMedia(Long mediaId);
}

