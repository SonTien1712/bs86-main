package com.example.backend.presentation.controller;

import com.example.backend.core.entity.Court;
import com.example.backend.core.enums.CourtStatus;
import com.example.backend.core.enums.DayType;
import com.example.backend.core.entity.Field;
import com.example.backend.core.entity.User;
import com.example.backend.core.service.CurrentUserService;
import com.example.backend.core.service.field.OwnerFieldService;
import com.example.backend.presentation.dto.request.UpdateFieldDetailRequest;
import com.example.backend.presentation.dto.request.UpdateFieldRequest;
import com.example.backend.presentation.dto.response.OwnerCourtResponse;
import com.example.backend.presentation.dto.response.OwnerFieldDetailResponse;
import com.example.backend.presentation.dto.response.OwnerFieldResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/owner/fields")
@RequiredArgsConstructor
public class OwnerFieldController {

    private final OwnerFieldService ownerFieldService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public List<OwnerFieldResponse> getMyFields() {
        User user = currentUserService.getCurrentUser();

        return ownerFieldService.getMyFields(user).stream()
                .map(this::toOwnerFieldResponse)
                .toList();
    }

    @GetMapping("/{fieldId}")
    public OwnerFieldDetailResponse getMyFieldDetail(@PathVariable Long fieldId) {
        User user = currentUserService.getCurrentUser();
        return toOwnerFieldDetailResponse(ownerFieldService.getMyFieldDetail(fieldId, user));
    }

    @GetMapping("/{fieldId}/courts")
    public List<OwnerCourtResponse> getMyFieldCourts(@PathVariable Long fieldId) {
        User user = currentUserService.getCurrentUser();
        return ownerFieldService.getMyFieldCourts(fieldId, user).stream()
                .map(this::toOwnerCourtResponse)
                .toList();
    }

    @PutMapping("/{fieldId}")
    public OwnerFieldDetailResponse updateField(@PathVariable Long fieldId,
                                                @RequestBody UpdateFieldRequest req) {
        User user = currentUserService.getCurrentUser();
        return toOwnerFieldDetailResponse(ownerFieldService.updateField(fieldId, req, user));
    }

    @PutMapping("/{fieldId}/detail")
    public OwnerFieldDetailResponse updateFieldDetail(@PathVariable Long fieldId,
                                                      @RequestBody UpdateFieldDetailRequest req) {
        User user = currentUserService.getCurrentUser();
        return toOwnerFieldDetailResponse(ownerFieldService.updateFieldDetail(fieldId, req, user));
    }

    @DeleteMapping("/{fieldId}")
    public String deleteField(@PathVariable Long fieldId) {
        User user = currentUserService.getCurrentUser();
        ownerFieldService.deleteField(fieldId, user);
        return "Field deleted successfully";
    }

    private OwnerFieldResponse toOwnerFieldResponse(Field field) {
        return OwnerFieldResponse.builder()
                .id(field.getId())
                .name(field.getName())
                .slug(field.getSlug())
                .address(field.getAddress())
                .sportType(field.getSportType())
                .status(field.getStatus())
                .latitude(field.getLatitude())
                .longitude(field.getLongitude())
                .openingHours(field.getDetail() != null ? field.getDetail().getOpeningHours() : null)
                .coverImageUrl(field.getDetail() != null ? field.getDetail().getCoverImageUrl() : null)
                .build();
    }

    private OwnerFieldDetailResponse toOwnerFieldDetailResponse(Field field) {
        return OwnerFieldDetailResponse.builder()
                .id(field.getId())
                .name(field.getName())
                .slug(field.getSlug())
                .address(field.getAddress())
                .sportType(field.getSportType())
                .status(field.getStatus())
                .latitude(field.getLatitude())
                .longitude(field.getLongitude())
                .description(field.getDetail() != null ? field.getDetail().getDescription() : null)
                .phone(field.getDetail() != null ? field.getDetail().getPhone() : null)
                .openingHours(field.getDetail() != null ? field.getDetail().getOpeningHours() : null)
                .bookingPolicy(field.getDetail() != null ? field.getDetail().getBookingPolicy() : null)
                .coverImageUrl(field.getDetail() != null ? field.getDetail().getCoverImageUrl() : null)
                .build();
    }

    private OwnerCourtResponse toOwnerCourtResponse(Court court) {
        return OwnerCourtResponse.builder()
                .id(court.getId())
                .fieldId(court.getField() != null ? court.getField().getId() : null)
                .courtNumber(court.getCourtNumber())
                .name("San " + court.getCourtNumber())
                .status(CourtStatus.valueOf(court.getStatus()))
                .hasWeekdayTemplate(ownerFieldService.hasTemplate(court.getId(), DayType.WEEKDAY))
                .hasWeekendTemplate(ownerFieldService.hasTemplate(court.getId(), DayType.WEEKEND))
                .build();
    }
}
