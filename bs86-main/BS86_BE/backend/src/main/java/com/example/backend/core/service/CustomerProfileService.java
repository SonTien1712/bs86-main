package com.example.backend.core.service;

import com.example.backend.core.entity.CustomerProfile;
import org.springframework.web.multipart.MultipartFile;

public interface CustomerProfileService {
    CustomerProfile getProfile(Long userId);
    CustomerProfile updateProfile(Long userId, CustomerProfile profileData);
    String uploadAvatar(Long userId, MultipartFile file);
}
