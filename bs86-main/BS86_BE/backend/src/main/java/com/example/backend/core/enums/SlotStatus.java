package com.example.backend.core.enums;

/**
 * SlotStatus represents the booking state of a CourtSlot.
 *
 * AVAILABLE - Slot is open for booking.
 * LOCKED    - Slot is temporarily reserved during checkout (prevents double booking).
 * BOOKED    - Slot is confirmed and associated with an Order.
 * CANCELLED - Slot was booked but the order was cancelled (reverts to AVAILABLE).
 */
public enum SlotStatus {

    AVAILABLE,

    BOOKED,

    BLOCKED,

    LOCKED
}
