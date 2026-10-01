package com.example.backend.presentation.exception;

/**
 * Thrown when a CourtSlot cannot be locked due to invalid status.
 * This indicates the slot is already booked, locked, or cancelled.
 */
public class SlotNotAvailableException extends OrderDomainException {
    public SlotNotAvailableException(Long slotId, String currentStatus) {
        super(
            String.format(
                "CourtSlot %s is not available for booking. Current status: %s",
                slotId,
                currentStatus
            )
        );
    }
}
