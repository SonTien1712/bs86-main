package com.example.backend.core.repository;

import com.example.backend.core.entity.OwnerProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OwnerRepository  {

    Optional<OwnerProfile> findByUserId(Long userId);

    Optional<OwnerProfile> findByUser_Email(String email);


}
