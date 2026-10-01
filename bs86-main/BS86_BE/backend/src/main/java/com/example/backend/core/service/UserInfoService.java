package com.example.backend.core.service;

import com.example.backend.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.example.backend.infrastructure.persistence.jpa.entity.UserRoleEntity;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserInfoService {

    private final UserRepository userRepository;

    private String buildUserDisplay(Long userId) {

        if (userId == null) return "-";

        return userRepository.findById(userId)
                .map(user -> {

                    String name = user.getFullName() != null ? user.getFullName() : "Unknown";
                    String phone = user.getPhoneNumber() != null ? user.getPhoneNumber() : "-";

                    String roles = user.getRoles()
                            .stream()
                            .map(r -> r.getRole())
                            .map(role -> role.name())
                            .collect(Collectors.joining(", "));

                    return name + " (" + roles + ") - " + phone;
                })
                .orElse("User #" + userId);
    }
}
