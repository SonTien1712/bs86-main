package com.example.backend.presentation.controller;

import com.example.backend.core.entity.Court;
import com.example.backend.core.entity.CourtSlot;
import com.example.backend.core.repository.CourtRepository;
import com.example.backend.core.repository.CourtSlotRepository;
import com.example.backend.core.service.SlotService;
import com.example.backend.infrastructure.persistence.mapper.CourtSlotMapper;
import com.example.backend.presentation.dto.response.CourtResponse;
import com.example.backend.presentation.dto.response.SlotResponse;
import com.example.backend.presentation.exception.CourtTemplateNotFoundException;
import com.example.backend.presentation.dto.response.ApiResponse;
import com.example.backend.presentation.dto.response.CourtSlotResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/courts")

public class CourtController {

    private final SlotService slotService;
    private final CourtSlotMapper courtSlotMapper;
    private final CourtRepository courtRepository;
    private final CourtSlotRepository slotRepository;

    public CourtController(CourtRepository courtRepository, CourtSlotRepository slotRepository, SlotService slotService, CourtSlotMapper courtSlotMapper) {
        this.courtRepository = courtRepository;
        this.slotRepository = slotRepository;
        this.slotService = slotService;
        this.courtSlotMapper = courtSlotMapper;
    }

    @GetMapping("/{courtId}/slots")
    public ApiResponse getSlots(
            @PathVariable Long courtId,
            @RequestParam String date
    ) {

        List<CourtSlot> slots;
        try {
            slots = slotService.getSlots(
                    courtId,
                    LocalDate.parse(date)
            );
        } catch (CourtTemplateNotFoundException ex) {
            slots = List.of();
        }

        List<CourtSlotResponse> response =
                courtSlotMapper.toResponseList(slots);

        return new ApiResponse(
                "Success",
                response
        );
    }

    @GetMapping
    public List<CourtResponse> getAllCourts() {
        return courtRepository.findAll().stream()
                .map(c -> {
                    CourtResponse resp = new CourtResponse();
                    resp.setId(c.getId());
                    resp.setCourtNumber(c.getCourtNumber());
                    resp.setStatus(c.getStatus());
                    if (c.getField() != null) {
                        resp.setFieldName(c.getField().getName());
                        resp.setSportType(String.valueOf(c.getField().getSportType()));
                        resp.setAddress(c.getField().getAddress());
                    }
                    return resp;
                })
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public CourtResponse getCourt(@PathVariable Long id) {
        Court court = courtRepository.findById(id).orElseThrow();
        CourtResponse resp = new CourtResponse();
        resp.setId(court.getId());
        resp.setCourtNumber(court.getCourtNumber());
        resp.setStatus(court.getStatus());
        if (court.getField() != null) {
            resp.setFieldName(court.getField().getName());
            resp.setSportType(String.valueOf(court.getField().getSportType()));
            resp.setAddress(court.getField().getAddress());
        }
        return resp;
    }

    @GetMapping("/available")
    public List<CourtResponse> getAvailableCourts(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        // lọc court có ít nhất 1 slot AVAILABLE
        return courtRepository.findAvailableCourtsByDate(date).stream()
                .map(c -> {
                    CourtResponse resp = new CourtResponse();
                    resp.setId(c.getId());
                    resp.setCourtNumber(c.getCourtNumber());
                    resp.setStatus(c.getStatus());
                    if (c.getField() != null) {
                        resp.setFieldName(c.getField().getName());
                        resp.setSportType(String.valueOf(c.getField().getSportType()));
                        resp.setAddress(c.getField().getAddress());
                    }
                    return resp;
                })
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}/schedule")
    public List<SlotResponse> getCourtSchedule(@PathVariable Long id,
                                               @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return slotRepository.findByCourtIdAndSlotDate(id, date).stream()
                .map(slot -> {
                    SlotResponse resp = new SlotResponse();
                    resp.setId(slot.getId());
                    resp.setStartTime(slot.getStartTime());
                    resp.setEndTime(slot.getEndTime());
                    resp.setPrice(slot.getPrice());
                    resp.setStatus(slot.getStatus());
                    return resp;
                })
                .collect(Collectors.toList());
    }
}
