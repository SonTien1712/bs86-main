package com.example.backend.presentation.controller;

import com.example.backend.core.entity.Court;
import com.example.backend.core.entity.Field;
import com.example.backend.core.enums.CourtStatus;
import com.example.backend.core.enums.SportType;
import com.example.backend.presentation.dto.response.FieldMarkerResponse;
import com.example.backend.presentation.dto.response.FieldDetailResponse;
import com.example.backend.presentation.dto.response.FieldSummaryResponse;
import com.example.backend.presentation.dto.response.PublicCourtResponse;
import com.example.backend.core.enums.FieldStatus;
import com.example.backend.core.repository.CourtRepository;
import com.example.backend.core.repository.FieldRepository;
import com.example.backend.core.service.field.PublicFieldService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/public/fields")
public class PublicFieldController {

    private final FieldRepository fieldRepo;
    private final CourtRepository courtRepository;
    private final PublicFieldService publicFieldService;

    @GetMapping("/map")
    public List<FieldMarkerResponse> getMarkers(
            @RequestParam double minLat,
            @RequestParam double minLng,
            @RequestParam double maxLat,
            @RequestParam double maxLng,
            @RequestParam(required = false) SportType type
    ) {
        return fieldRepo.findMarkersInBox(
                FieldStatus.ACTIVE,
                type != null ? type.name() : null,
                minLat,
                maxLat,
                minLng,
                maxLng
        );

    }

    @GetMapping
    public List<FieldSummaryResponse> getFields() {
        return publicFieldService.getActiveFields()
                .stream()
                .map(this::toFieldSummaryResponse)
                .toList();
    }

    @GetMapping("/{fieldId}/courts")
    public List<PublicCourtResponse> getFieldCourts(@PathVariable Long fieldId) {
        Field field = fieldRepo.findById(fieldId)
                .filter(found -> found.getStatus() == FieldStatus.ACTIVE)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Field not found"));

        return courtRepository.findByFieldId(field.getId()).stream()
                .filter(court -> CourtStatus.ACTIVE.name().equalsIgnoreCase(court.getStatus()))
                .sorted(Comparator.comparing(Court::getCourtNumber))
                .map(this::toPublicCourtResponse)
                .toList();
    }

    @GetMapping("/{slug}")
    public FieldDetailResponse getFieldDetail(@PathVariable String slug) {
        Field field = publicFieldService.findActiveFieldBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Field not found"));

        return toFieldDetailResponse(field);
    }

    private FieldSummaryResponse toFieldSummaryResponse(Field field) {
        return FieldSummaryResponse.builder()
                .id(field.getId())
                .name(field.getName())
                .slug(field.getSlug())
                .address(field.getAddress())
                .sportType(field.getSportType())
                .latitude(field.getLatitude())
                .longitude(field.getLongitude())
                .openingHours(field.getDetail() != null ? field.getDetail().getOpeningHours() : null)
                .coverImageUrl(field.getDetail() != null ? field.getDetail().getCoverImageUrl() : null)
                .build();
    }

    private FieldDetailResponse toFieldDetailResponse(Field field) {
        return FieldDetailResponse.builder()
                .id(field.getId())
                .name(field.getName())
                .slug(field.getSlug())
                .address(field.getAddress())
                .sportType(field.getSportType())
                .latitude(field.getLatitude())
                .longitude(field.getLongitude())
                .description(field.getDetail() != null ? field.getDetail().getDescription() : null)
                .phone(field.getDetail() != null ? field.getDetail().getPhone() : null)
                .openingHours(field.getDetail() != null ? field.getDetail().getOpeningHours() : null)
                .bookingPolicy(field.getDetail() != null ? field.getDetail().getBookingPolicy() : null)
                .coverImageUrl(field.getDetail() != null ? field.getDetail().getCoverImageUrl() : null)
                .build();
    }

    private PublicCourtResponse toPublicCourtResponse(Court court) {
        return PublicCourtResponse.builder()
                .id(court.getId())
                .name("San " + court.getCourtNumber())
                .fieldId(court.getField() != null ? court.getField().getId() : null)
                .courtGroup("Standard")
                .status(court.getStatus())
                .build();
    }

}
