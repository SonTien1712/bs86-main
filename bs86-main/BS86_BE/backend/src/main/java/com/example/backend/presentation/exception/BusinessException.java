package com.example.backend.presentation.exception;

import org.springframework.http.HttpStatus;



import org.springframework.http.HttpStatus;

public class BusinessException extends RuntimeException {

    private final HttpStatus status;

    // ✅ Constructor chỉ nhận String - dùng mặc định BAD_REQUEST
    public BusinessException(String message) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
    }

    // ✅ Constructor nhận đủ status + message
    public BusinessException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
