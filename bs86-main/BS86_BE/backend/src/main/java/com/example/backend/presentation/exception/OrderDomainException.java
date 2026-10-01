package com.example.backend.presentation.exception;

/**
 * Base exception for the Order domain.
 * All domain-specific exceptions inherit from this.
 */
public class OrderDomainException extends RuntimeException {
    public OrderDomainException(String message) {
        super(message);
    }

    public OrderDomainException(String message, Throwable cause) {
        super(message, cause);
    }
}
