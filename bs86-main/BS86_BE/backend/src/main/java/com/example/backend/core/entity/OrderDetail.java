package com.example.backend.core.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDetail {
    private Long id;
    private Order order;
    private Long courtSlotId;
    private Long courtId;
    private Long fieldId;
    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private BigDecimal price;
    private String notes;
    private Long createdAt;
    private Long updatedAt;

    public void onCreate() {
        long now = System.currentTimeMillis();
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void onUpdate() {
        this.updatedAt = System.currentTimeMillis();
    }

    public boolean isValid() {
        return this.courtSlotId != null
                && this.courtId != null
                && this.fieldId != null
                && this.bookingDate != null
                && this.startTime != null
                && this.endTime != null
                && this.price != null
                && this.price.compareTo(BigDecimal.ZERO) > 0;
    }

    public String getSlotDescription() {
        return String.format(
                "%s %s - %s",
                this.bookingDate,
                this.startTime,
                this.endTime);
    }
}