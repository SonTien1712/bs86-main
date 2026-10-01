package com.example.backend.presentation.exception;

/**
 * Thrown when an Order is not found in the database.
 */
public class OrderNotFoundException extends OrderDomainException {
    public OrderNotFoundException(Long orderId) {
        super("Order not found: " + orderId);
    }
}
