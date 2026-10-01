package com.example.backend.presentation.controller;

import com.example.backend.core.enums.SlotStatus;
import com.example.backend.presentation.dto.response.SlotResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/time-slots")
public class TimeSlotController {

    @GetMapping
    public List<SlotResponse> getAllTimeSlots() {
        List<SlotResponse> slots = new ArrayList<>();
        LocalTime start = LocalTime.of(0, 0);
        while (start.isBefore(LocalTime.of(23, 30))) {
            LocalTime end = start.plusMinutes(30);
            SlotResponse slot = new SlotResponse();
            slot.setStartTime(start);
            slot.setEndTime(end);
            slot.setStatus(SlotStatus.valueOf("AVAILABLE")); // generic, không gắn với court cụ thể
            slots.add(slot);
            start = end;
        }
        return slots;
    }
}
