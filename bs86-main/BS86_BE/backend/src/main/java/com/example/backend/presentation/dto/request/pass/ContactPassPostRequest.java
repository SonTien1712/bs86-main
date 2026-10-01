package com.example.backend.presentation.dto.request.pass;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ContactPassPostRequest {

    @Size(max = 2000, message = "initialMessage must not exceed 2000 characters")
    private String initialMessage;
}
