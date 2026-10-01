package com.example.backend.core.repository;

import com.example.backend.core.entity.OwnerProfile;
import com.example.backend.core.entity.User;

import java.util.Optional;

public interface OwnerProfileRepository {
    OwnerProfile save(OwnerProfile profile);

    Optional<OwnerProfile> findById(Long id);

    Optional<OwnerProfile> findByUser(User user);

    // Chuyển 2 hàm từ file lỗi sang đây
    Optional<OwnerProfile> findByUserId(Long userId);

    Optional<OwnerProfile> findByUserEmail(String email);
}