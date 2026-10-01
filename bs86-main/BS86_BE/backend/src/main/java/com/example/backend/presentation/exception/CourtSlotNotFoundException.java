package com.example.backend.presentation.exception;

/**
 * Thrown when a CourtSlot is not found in the database.
 */
public class CourtSlotNotFoundException extends OrderDomainException {
    public CourtSlotNotFoundException(Long slotId) {
        super("CourtSlot not found: " + slotId);
    }
}
