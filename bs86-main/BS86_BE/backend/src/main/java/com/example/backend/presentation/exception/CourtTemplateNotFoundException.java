package com.example.backend.presentation.exception;

import org.springframework.http.HttpStatus;

public class CourtTemplateNotFoundException extends BusinessException {

    public CourtTemplateNotFoundException(Long courtId) {
        super(HttpStatus.NOT_FOUND, "Court template not found");
    }
}
