package com.example.backend.core.entity;

import com.example.backend.core.enums.SlotStatus;
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
public class CourtSlot {

    private Long id;

    private Long courtId; // thay vì object Court

    private LocalDate slotDate;

    private LocalTime startTime;

    private LocalTime endTime;

    private BigDecimal   price;

    private SlotStatus  status;
    private Long holdExpiredAt;
    private Long createdAt;
    private Long updatedAt;
    private Court court;

//    public Long getId() {
//        return id;
//    }
//
//    public void setId(Long id) {
//        this.id = id;
//    }
//
//    public Long getCourtId() {
//        return courtId;
//    }
//
//    public void setCourtId(Long courtId) {
//        this.courtId = courtId;
//    }
//
//    public LocalDate getSlotDate() {
//        return slotDate;
//    }
//
//    public void setSlotDate(LocalDate slotDate) {
//        this.slotDate = slotDate;
//    }
//
//    public LocalTime getEndTime() {
//        return endTime;
//    }
//
//    public void setEndTime(LocalTime endTime) {
//        this.endTime = endTime;
//    }
//
//    public LocalTime getStartTime() {
//        return startTime;
//    }
//
//    public void setStartTime(LocalTime startTime) {
//        this.startTime = startTime;
//    }
//
//    public BigDecimal getPrice() {
//        return price;
//    }
//
//    public void setPrice(BigDecimal price) {
//        this.price = price;
//    }
//
//    public SlotStatus getStatus() {
//        return status;
//    }
//
//    public void setStatus(SlotStatus status) {
//        this.status = status;
//    }
//
//    public Long getCreatedAt() {
//        return createdAt;
//    }
//
//    public void setCreatedAt(Long createdAt) {
//        this.createdAt = createdAt;
//    }
//
//    public Long getUpdatedAt() {
//        return updatedAt;
//    }
//
//    public void setUpdatedAt(Long updatedAt) {
//        this.updatedAt = updatedAt;
//    }
//
//    public Court getCourt() {
//        return court;
//    }

//    public void setCourt(Court court) {
//        this.court = court;
//    }


    public boolean canBeLocked() {
        return this.status == SlotStatus.AVAILABLE;
    }

    public void lock() {
        if (!canBeLocked()) {
            throw new IllegalStateException(
                    "Cannot lock slot " + id + " with status: " + status
            );
        }
        this.status = SlotStatus.LOCKED;
        this.holdExpiredAt = null;
        this.updatedAt = System.currentTimeMillis();
    }

    public boolean canBeBooked() {
        return this.status == SlotStatus.LOCKED;
    }

    public void confirmBooking() {
        if (!canBeBooked()) {
            throw new IllegalStateException(
                    "Cannot confirm slot " + id + " with status: " + status
            );
        }
        this.status = SlotStatus.BOOKED;
        this.holdExpiredAt = null;
        this.updatedAt = System.currentTimeMillis();
    }

    public boolean canBeReleased() {
        return this.status == SlotStatus.LOCKED
                || this.status == SlotStatus.BOOKED;
    }

    public void release() {
        if (!canBeReleased()) {
            throw new IllegalStateException(
                    "Cannot release slot " + id + " with status: " + status
            );
        }
        this.status = SlotStatus.AVAILABLE;
        this.holdExpiredAt = null;
        this.updatedAt = System.currentTimeMillis();
    }
}
