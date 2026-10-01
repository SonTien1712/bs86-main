package com.example.backend.presentation.dto.request;


import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomerRegisterRequest {
    private String email;
    private String password;
    private String sportPreference;
    private String level;
    private String location;
}

