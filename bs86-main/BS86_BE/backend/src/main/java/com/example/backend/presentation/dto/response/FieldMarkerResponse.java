package com.example.backend.presentation.dto.response;

public record FieldMarkerResponse(
    Long id,
    String name,
    String slug,
    String sportType,
    String address,
    Double latitude,
    Double longitude,
    String openingHours,
    String phone,
    String coverImageUrl
) {}
