package com.example.backend.core.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.backend.core.enums.MediaType;
import com.example.backend.core.enums.OwnerType;
import com.example.backend.core.entity.Media;
import com.example.backend.core.repository.MediaRepository;
import com.example.backend.core.service.MediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MediaServiceImpl implements MediaService {

        private final Cloudinary cloudinary;
        private final MediaRepository mediaRepository;

        @Override
        public Media upload(MultipartFile file, OwnerType ownerType, Long ownerId, MediaType type) {
            try {
                String folder = buildFolder(ownerType, type);

                Map<String, Object> options = ObjectUtils.asMap(
                        "folder", folder,
                        "resource_type", type == MediaType.VIDEO ? "video" : "image"
                );

                Map result = cloudinary.uploader().upload(file.getBytes(), options);

                Media media = Media.builder()
                        .url(result.get("secure_url").toString())
                        .publicId(result.get("public_id").toString())
                        .type(type)
                        .ownerType(ownerType)
                        .ownerId(ownerId)
                        .folder(folder)
                        .createdAt(LocalDateTime.now())
                        .build();

                return mediaRepository.save(media);

            } catch (IOException e) {
                throw new RuntimeException("Upload failed", e);
            }
        }

        private String buildFolder(OwnerType ownerType, MediaType type) {
            return "booking_sport/" + ownerType.name().toLowerCase() + "/" + type.name().toLowerCase();
        }

    @Override
    public List<Media> getMedia(OwnerType ownerType, Long ownerId) {
        return mediaRepository.findByOwnerTypeAndOwnerId(ownerType, ownerId);
    }

        @Override
        public void deleteMedia(Long mediaId) {
            Media media = mediaRepository.findById(mediaId)
                    .orElseThrow(() -> new RuntimeException("Media not found"));

            try {
                cloudinary.uploader().destroy(media.getPublicId(), ObjectUtils.emptyMap());
            } catch (IOException e) {
                throw new RuntimeException("Cloud delete failed", e);
            }

            mediaRepository.deleteById(media.getId());        }
    }
