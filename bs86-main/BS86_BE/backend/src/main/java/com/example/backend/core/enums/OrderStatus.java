package com.example.backend.core.enums;

/**
 * OrderStatus represents the lifecycle state of an Order.
 *
 * PENDING   - Order created, awaiting customer confirmation.
 * CONFIRMED - Order confirmed, all slots are BOOKED.
 * CANCELLED - Order cancelled, all slots released back to AVAILABLE.
 * COMPLETED - Order fulfilled (post-session or payment completed).
 */
public enum OrderStatus {
    PENDING,
    PENDING_PAYMENT,
    CONFIRMED,
    CANCELLED,
    EXPIRED,
    COMPLETED
}
