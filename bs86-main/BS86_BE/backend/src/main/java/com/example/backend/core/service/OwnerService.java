package com.example.backend.core.service;

import com.example.backend.core.entity.*;
import com.example.backend.core.enums.*;
import com.example.backend.core.repository.*;
import com.example.backend.presentation.dto.request.AddFieldRequest;
import com.example.backend.presentation.dto.request.SetTemplateRequest;
import com.example.backend.presentation.dto.request.SubmitVerificationRequest;
import com.example.backend.presentation.dto.response.OwnerVerificationStatusResponse;
import com.example.backend.presentation.exception.BusinessException;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OwnerService {

    private final FieldRepository fieldRepo;
    private final CourtRepository courtRepo;
    private final OwnerProfileRepository ownerRepo;
    private final FieldVerificationRepository fieldVerRepo;
    private final TimeSlotTemplateRepository templateRepo;
    private final OwnerVerificationRepository ownerVerRepo;
    private final UserRepository userRepo;
    private final SlugService slugService;

    // ================= ADD COURTS =================
    @Transactional
    public void addCourts(Long fieldId, int from, int to, User owner) {

        if (from <= 0 || to < from)
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Invalid court range");

        if (to - from > 50)
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Too many courts in one request");

        if (owner.getStatus() != UserStatus.ACTIVE)
            throw new BusinessException(HttpStatus.FORBIDDEN, "Owner is not active");

        Field field = fieldRepo.findById(fieldId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Field not found"));

        if (field.getStatus() == FieldStatus.INACTIVE)
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Field is inactive");

        if (!field.getOwner().getUser().getId().equals(owner.getId()))
            throw new BusinessException(HttpStatus.FORBIDDEN, "Not your field");

        boolean createdAny = false;

        for (int i = from; i <= to; i++) {

            if (courtRepo.existsByFieldAndCourtNumber(field, i))
                continue;

            Court court = new Court();

            court.setField(field);
            court.setCourtNumber(i);
            court.setStatus(String.valueOf(CourtStatus.ACTIVE));

            courtRepo.save(court);
            createdAny = true;
        }

        if (!createdAny) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "All courts in the selected range already exist"
            );
        }
    }

    // ================= ADD FIELD =================
    @Transactional
    public void addNewField(User user, AddFieldRequest req) {

        if (user.getStatus() != UserStatus.ACTIVE)
            throw new RuntimeException("Account is not active");

        OwnerProfile owner = ownerRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Owner profile not found"));

        // Use direct repo query — mapper doesn't populate owner.getVerification()
        OwnerVerification ownerVer = ownerVerRepo.findByOwnerId(owner.getId()).orElse(null);
        if (ownerVer == null || ownerVer.getStatus() != VerificationStatus.APPROVED)
            throw new RuntimeException("Owner verification is pending or missing");

        validateLocation(req);

        Field field = new Field();
        FieldDetail detail = new FieldDetail();

        field.setOwner(owner);
        field.setName(req.getFieldName());
        field.setSlug(slugService.generateUniqueSlug(req.getFieldName()));
        field.setAddress(req.getAddress());
        //đã chuyển sang dạng enum vì điều ni cần cho category sau này
//        field.setSportType(req.getSportType());
        field.setSportType(SportType.valueOf(req.getSportType().toUpperCase()));
        field.setLatitude(req.getLatitude());
        field.setLongitude(req.getLongitude());
        field.setDetail(detail);

        field.setStatus(FieldStatus.PENDING_VERIFICATION);

        field = fieldRepo.save(field);

        FieldVerification fv = new FieldVerification();

        fv.setField(field);
        fv.setLandCertificateUrl(req.getLandCertificateUrl());
        fv.setFieldImagesUrl(req.getFieldImagesUrl());
        fv.setStatus(VerificationStatus.PENDING);

        fieldVerRepo.save(fv);
    }

    private void validateLocation(AddFieldRequest req) {

        if (req.getLatitude() == null || req.getLongitude() == null) {
            throw new RuntimeException("You must choose location on map");
        }

        double lat = req.getLatitude();
        double lng = req.getLongitude();

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            throw new RuntimeException("Invalid coordinates");
        }
    }

    // ================= ADD TEMPLATE =================
    @Transactional
    public void setTemplate(Long courtId, SetTemplateRequest req, User owner) {
        setTemplate(null, courtId, req, owner);
    }

    @Transactional
    public void setTemplate(Long fieldId, Long courtId, SetTemplateRequest req, User owner) {

        Court court = courtRepo.findById(courtId)
                .orElseThrow(() -> new RuntimeException("Court not found"));

        if (!court.getField().getOwner().getUser().getId().equals(owner.getId()))
            throw new RuntimeException("Not your court");

        if (fieldId != null && (court.getField() == null || !fieldId.equals(court.getField().getId()))) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Court does not belong to the selected field");
        }

        validateTemplateRequest(req);

        TimeSlotTemplate template = templateRepo.findOneByCourtAndDayType(court, req.getDayType())
                .orElseGet(TimeSlotTemplate::new);

        template.setCourt(court);
        template.setDayType(req.getDayType());
        template.setOpenTime(req.getOpenTime());
        template.setCloseTime(req.getCloseTime());
        template.setSlotMinutes(req.getSlotMinutes());
        template.setBasePrice(req.getBasePrice());

        templateRepo.save(template);
    }

    private void validateTemplateRequest(SetTemplateRequest req) {
        if (req == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Template request is required");
        }

        if (req.getDayType() == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Day type is required");
        }

        LocalTime openTime = req.getOpenTime();
        LocalTime closeTime = req.getCloseTime();

        if (openTime == null || closeTime == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Open time and close time are required");
        }

        if (!openTime.isBefore(closeTime)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Open time must be before close time");
        }

        if (req.getSlotMinutes() <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Slot minutes must be greater than 0");
        }

        if (req.getBasePrice() == null || req.getBasePrice() < 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Base price must be greater than or equal to 0");
        }
    }

    // ================= OWNER VERIFICATION =================
    @Transactional
    public void submitVerification(User user, SubmitVerificationRequest req) {

        OwnerProfile owner = ownerRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Owner profile not found"));

        // Use direct repo query instead of owner.getVerification() because
        // OwnerProfileMapper.toDomain() does not populate the verification relationship —
        // owner.getVerification() always returns null even when a DB record exists.
        OwnerVerification existing = ownerVerRepo.findByOwnerId(owner.getId()).orElse(null);

        if (existing != null) {
            VerificationStatus status = existing.getStatus();

            if (status == VerificationStatus.PENDING || status == VerificationStatus.APPROVED) {
                throw new RuntimeException("Verification already pending or approved");
            }

            // Three-Strike: block further resubmits when all 3 attempts are exhausted.
            // (Normally user is auto-blocked when admin rejects the 3rd attempt,
            //  but this guards against direct API calls bypassing that flow.)
            if (existing.getAttemptCount() >= 3) {
                throw new BusinessException(HttpStatus.FORBIDDEN,
                        "Tài khoản đã hết lượt xác thực. Vui lòng liên hệ hỗ trợ.");
            }

            // REJECTED: update existing record, increment attempt counter.
            // Re-attach owner because findByOwnerId uses mapper::toDomain which
            // does not populate the owner field — save() would throw otherwise.
            existing.setOwner(owner);
            existing.setAttemptCount(existing.getAttemptCount() + 1);
            existing.setIdCardNumber(req.getIdCardNumber());
            existing.setIdCardFrontUrl(req.getIdCardFrontUrl());
            existing.setIdCardBackUrl(req.getIdCardBackUrl());
            existing.setBusinessLicenseUrl(req.getBusinessLicenseUrl());
            existing.setStatus(VerificationStatus.PENDING);
            existing.setRejectionReason(null);
            existing.setRejectedAt(null);
            ownerVerRepo.save(existing);
            return;
        }

        OwnerVerification verification = new OwnerVerification();

        verification.setOwner(owner);
        verification.setIdCardNumber(req.getIdCardNumber());
        verification.setIdCardFrontUrl(req.getIdCardFrontUrl());
        verification.setIdCardBackUrl(req.getIdCardBackUrl());
        verification.setBusinessLicenseUrl(req.getBusinessLicenseUrl());
        verification.setStatus(VerificationStatus.PENDING);
        // Note: attemptCount is set to 1 at registration by AuthServiceAdapter.
        // This fallback handles the edge case where OwnerVerification is created here.
        verification.setAttemptCount(1);

        owner.setVerification(verification);

        ownerVerRepo.save(verification);
    }

    // ================= GET STATUS =================
    public OwnerVerificationStatusResponse getVerificationStatus(User user) {

        OwnerProfile owner = ownerRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Owner profile not found"));

        return ownerVerRepo
                .findByOwnerId(owner.getId())
                .map(v -> OwnerVerificationStatusResponse.builder()
                        .status(v.getStatus().name())
                        .rejectionReason(v.getRejectionReason())
                        .attemptCount(v.getAttemptCount())
                        .build())
                // attemptCount: 0 = no record (NONE state). Frontend only reads attemptCount
                // in the REJECTED branch so this value is never shown to the user directly.
                .orElse(OwnerVerificationStatusResponse.builder()
                        .status("NONE")
                        .rejectionReason(null)
                        .attemptCount(0)
                        .build());
    }
}
