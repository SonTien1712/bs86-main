package com.example.backend.presentation.controller;

import com.example.backend.core.entity.Field;
import com.example.backend.core.enums.FieldStatus;
import com.example.backend.core.enums.SlotStatus;
import com.example.backend.core.repository.CourtRepository;
import com.example.backend.core.repository.FieldRepository;
import com.example.backend.core.service.SlotService;
import com.example.backend.infrastructure.persistence.jpa.repository.CourtSlotJpaRepository;
import com.example.backend.presentation.dto.response.AvailableSlotResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/fields")
@RequiredArgsConstructor
public class AvailableSlotController {

    private final CourtSlotJpaRepository courtSlotJpaRepository;
    private final FieldRepository fieldRepository;
    private final CourtRepository courtRepository;
    private final SlotService slotService;

    @GetMapping("/{fieldId}/available-slots")
    public ResponseEntity<List<AvailableSlotResponse>> getAvailableSlots(
            @PathVariable Long fieldId
    ) {
        Field field = fieldRepository.findById(fieldId)
                .filter(found -> found.getStatus() == FieldStatus.ACTIVE)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Field not found"));

        List<AvailableSlotResponse> slots = courtSlotJpaRepository
                .findByCourt_Field_IdAndStatusOrderBySlotDateAscStartTimeAsc(field.getId(), SlotStatus.AVAILABLE)
                .stream()
                .map(slot -> AvailableSlotResponse.builder()
                        .slotId(slot.getId())
                        .date(slot.getSlotDate())
                        .courtId(slot.getCourt().getId())
                        .courtName("San " + slot.getCourt().getCourtNumber())
                        .startTime(slot.getStartTime())
                        .endTime(slot.getEndTime())
                        .build())
                .toList();

        if (slots.isEmpty()) {
            LocalDate startDate = LocalDate.now();
            for (var court : courtRepository.findByFieldId(field.getId())) {
                for (int offset = 0; offset < 3; offset++) {
                    slotService.generateSlotsInternal(court, startDate.plusDays(offset));
                }
            }

            slots = courtSlotJpaRepository
                    .findByCourt_Field_IdAndStatusOrderBySlotDateAscStartTimeAsc(field.getId(), SlotStatus.AVAILABLE)
                    .stream()
                    .map(slot -> AvailableSlotResponse.builder()
                            .slotId(slot.getId())
                            .date(slot.getSlotDate())
                            .courtId(slot.getCourt().getId())
                            .courtName("San " + slot.getCourt().getCourtNumber())
                            .startTime(slot.getStartTime())
                            .endTime(slot.getEndTime())
                            .build())
                    .toList();
        }

        return ResponseEntity.ok(slots);
    }
}

