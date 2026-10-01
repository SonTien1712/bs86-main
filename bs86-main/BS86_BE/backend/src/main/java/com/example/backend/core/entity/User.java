package com.example.backend.core.entity;

import com.example.backend.core.enums.Role;
import com.example.backend.core.enums.UserStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
public class User {

    private Long id;
    private String email;
    private String password;
    private UserStatus status;
    private Set<UserRole> roles = new HashSet<>();

    private String fullName;
    private String phoneNumber;
    private String provider;
    private String providerId;
    private String authToken;
    private boolean emailVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public void addRole(Role role) {
        boolean exists = roles.stream()
                .anyMatch(r -> r.getRole() == role);

        if (exists) {
            return;
        }

        UserRole userRole = new UserRole();
        userRole.setUser(this);
        userRole.setRole(role);
        roles.add(userRole);
    }
}
