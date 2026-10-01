package com.example.backend.presentation.exception;

/**
 * Thrown when an Order operation is invalid for its current status.
 * Examples:
 * - Attempting to confirm an order that is already CONFIRMED.
 * - Attempting to cancel an order that is already CANCELLED or COMPLETED.
 */
public class InvalidOrderStatusException extends OrderDomainException {
    public InvalidOrderStatusException(String message) {
        super(message);
    }
}
