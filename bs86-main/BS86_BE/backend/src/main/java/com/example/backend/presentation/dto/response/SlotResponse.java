package com.example.backend.presentation.dto.response;

import com.example.backend.core.enums.SlotStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalTime;

@Data
public class SlotResponse {
    private Long id;
    private LocalTime startTime;
    private LocalTime endTime;
    private BigDecimal price;
    private SlotStatus status; // AVAILABLE, BOOKED,...

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public SlotStatus getStatus() {
        return status;
    }

    public void setStatus(SlotStatus status) {
        this.status = status;
    }
}
