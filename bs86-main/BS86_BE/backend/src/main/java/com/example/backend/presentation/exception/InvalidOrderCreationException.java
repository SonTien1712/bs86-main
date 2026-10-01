package com.example.backend.presentation.exception;

/**
 * Thrown when a business rule is violated during order creation.
 * Examples:
 * - No court slots provided.
 * - Duplicate slots in a single order request.
 * - Missing merchant or customer IDs.
 */
public class InvalidOrderCreationException extends OrderDomainException {
    public InvalidOrderCreationException(String message) {
        super(message);
    }
}
