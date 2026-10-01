package com.example.backend.presentation.controller;

import com.example.backend.core.entity.CustomerProfile;
import com.example.backend.core.service.CustomerProfileService;
import com.example.backend.presentation.dto.request.CustomerProfileRequest;
import com.example.backend.presentation.dto.response.CustomerProfileResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/customer-profile")
public class CustomerProfileController {

    private final CustomerProfileService profileService;

    public CustomerProfileController(CustomerProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<CustomerProfileResponse> getProfile(@RequestHeader("X-User-Id") Long userId) {
        CustomerProfile profile = profileService.getProfile(userId);
        return ResponseEntity.ok(new CustomerProfileResponse(profile, userId));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<CustomerProfileResponse> getProfileById(@PathVariable Long userId) {
        CustomerProfile profile = profileService.getProfile(userId);
        return ResponseEntity.ok(new CustomerProfileResponse(profile, userId));
    }

    @PutMapping
    public ResponseEntity<CustomerProfileResponse> updateProfile(@RequestHeader("X-User-Id") Long userId,
                                                                 @Valid @RequestBody CustomerProfileRequest request) {
        CustomerProfile profileData = new CustomerProfile();
        profileData.setFullName(request.getFullName());
        profileData.setDateOfBirth(request.getDateOfBirth());
        profileData.setPhoneNumber(request.getPhoneNumber());
        profileData.setAddress(request.getAddress());
        profileData.setLevel(request.getLevel());
        profileData.setLocation(request.getLocation());
        profileData.setSportPreference(request.getSportPreference());
        profileData.setAvatarUrl(request.getAvatarUrl());

        CustomerProfile updated = profileService.updateProfile(userId, profileData);
        return ResponseEntity.ok(new CustomerProfileResponse(updated, userId));
    }

    @PostMapping("/avatar")
    public ResponseEntity<String> uploadAvatar(@RequestHeader("X-User-Id") Long userId,
                                               @RequestParam("file") MultipartFile file) {
        String avatarUrl = profileService.uploadAvatar(userId, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(avatarUrl);
    }
}
