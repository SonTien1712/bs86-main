package com.example.backend.core.entity;

import com.example.backend.core.enums.Role;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRole {

    private Long id;

    private User user;

    private Role role;
}
