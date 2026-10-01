package com.example.backend.core.service.impl;

import com.example.backend.core.entity.CustomerProfile;
import com.example.backend.core.repository.CustomerProfileRepository;
import com.example.backend.core.service.CloudinaryService;
import com.example.backend.core.service.CustomerProfileService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
@Service
public class CustomerProfileServiceImpl implements CustomerProfileService {

    private final CustomerProfileRepository repository;
    private final CloudinaryService cloudinaryService;

    public CustomerProfileServiceImpl(CustomerProfileRepository repository,
                                      CloudinaryService cloudinaryService) {
        this.repository = repository;
        this.cloudinaryService = cloudinaryService;
    }

    @Override
    public CustomerProfile getProfile(Long userId) {
        return repository.findByUserId(userId)
                .orElseGet(() -> {
                    CustomerProfile profile = new CustomerProfile();
                    com.example.backend.core.entity.User user = new com.example.backend.core.entity.User();
                    user.setId(userId);
                    profile.setUser(user);
                    return profile;
                });
    }

    @Override
    public CustomerProfile updateProfile(Long userId, CustomerProfile profileData) {
        CustomerProfile existing = repository.findByUserId(userId)
                .orElse(new CustomerProfile());
        if (existing.getUser() == null) {
            com.example.backend.core.entity.User u = new com.example.backend.core.entity.User();
            u.setId(userId);
            existing.setUser(u);
        }
        existing.setFullName(profileData.getFullName());
        existing.setDateOfBirth(profileData.getDateOfBirth());
        existing.setPhoneNumber(profileData.getPhoneNumber());
        existing.setAddress(profileData.getAddress());
        existing.setLevel(profileData.getLevel());
        existing.setLocation(profileData.getLocation());
        existing.setSportPreference(profileData.getSportPreference());
        // Giữ avatar cũ nếu không thay đổi
        if (profileData.getAvatarUrl() != null) {
            existing.setAvatarUrl(profileData.getAvatarUrl());
        }
        return repository.save(existing);
    }

    @Override
    public String uploadAvatar(Long userId, MultipartFile file) {
        try {
            String avatarUrl = cloudinaryService.uploadFile(file);
            CustomerProfile profile = repository.findByUserId(userId)
                    .orElse(new CustomerProfile());
            if (profile.getUser() == null) {
                com.example.backend.core.entity.User u = new com.example.backend.core.entity.User();
                u.setId(userId);
                profile.setUser(u);
            }
            profile.setAvatarUrl(avatarUrl);
            repository.save(profile);
            return avatarUrl;
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload avatar", e);
        }
    }
}