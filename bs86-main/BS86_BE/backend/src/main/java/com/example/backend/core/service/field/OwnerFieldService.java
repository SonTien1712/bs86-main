package com.example.backend.core.service.field;

import com.example.backend.core.entity.Court;
import com.example.backend.core.entity.Field;
import com.example.backend.core.entity.FieldDetail;
import com.example.backend.core.entity.User;
import com.example.backend.core.enums.DayType;
import com.example.backend.core.repository.FieldRepository;
import com.example.backend.core.repository.CourtRepository;
import com.example.backend.core.repository.TimeSlotTemplateRepository;
import com.example.backend.presentation.exception.BusinessException;
import com.example.backend.presentation.dto.request.UpdateFieldDetailRequest;
import com.example.backend.presentation.dto.request.UpdateFieldRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OwnerFieldService {

    private final FieldRepository fieldRepo;
    private final CourtRepository courtRepo;
    private final TimeSlotTemplateRepository templateRepo;

    public List<Field> getMyFields(User user) {
        return fieldRepo.findByOwner_User_Id(user.getId());
    }

    public Field getMyFieldDetail(Long fieldId, User user) {
        Field field = fieldRepo.findById(fieldId)
                .orElseThrow(() -> new RuntimeException("Field not found"));

        validateFieldOwnership(field, user);
        return field;
    }

    public List<Court> getMyFieldCourts(Long fieldId, User user) {
        Field field = fieldRepo.findById(fieldId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Field not found"));

        validateFieldOwnership(field, user);

        return courtRepo.findByFieldId(fieldId).stream()
                .sorted(Comparator.comparing(Court::getCourtNumber))
                .toList();
    }

    public boolean hasTemplate(Long courtId, DayType dayType) {
        Court court = courtRepo.findById(courtId).orElse(null);
        if (court == null) {
            return false;
        }
        return templateRepo.existsByCourtIdAndDayType(courtId, dayType);
    }

    @Transactional
    public Field updateField(Long fieldId, UpdateFieldRequest req, User user) {
        Field field = fieldRepo.findById(fieldId)
                .orElseThrow(() -> new RuntimeException("Field not found"));

        validateFieldOwnership(field, user);
        validateLocation(req.getLatitude(), req.getLongitude());

        field.setName(req.getFieldName());
        field.setAddress(req.getAddress());
        field.setLatitude(req.getLatitude());
        field.setLongitude(req.getLongitude());
        field.setSportType(req.getSportType());

        return fieldRepo.save(field);
    }

    @Transactional
    public Field updateFieldDetail(Long fieldId, UpdateFieldDetailRequest req, User user) {
        Field field = fieldRepo.findById(fieldId)
                .orElseThrow(() -> new RuntimeException("Field not found"));

        validateFieldOwnership(field, user);

        FieldDetail detail = field.getDetail();
        if (detail == null) {
            detail = new FieldDetail();
            field.setDetail(detail);
        }

        detail.setDescription(req.getDescription());
        detail.setPhone(req.getPhone());
        detail.setOpeningHours(req.getOpeningHours());
        detail.setBookingPolicy(req.getBookingPolicy());
        detail.setCoverImageUrl(req.getCoverImageUrl());

        return fieldRepo.save(field);
    }

    @Transactional
    public void deleteField(Long fieldId, User user) {
        Field field = fieldRepo.findById(fieldId)
                .orElseThrow(() -> new RuntimeException("Field not found"));

        validateFieldOwnership(field, user);

        fieldRepo.deleteById(field.getId());
    }

    private void validateFieldOwnership(Field field, User user) {
        if (!field.getOwner().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not your field");
        }
    }

    private void validateLocation(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            throw new RuntimeException("You must choose location on map");
        }

        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            throw new RuntimeException("Invalid coordinates");
        }
    }
}
