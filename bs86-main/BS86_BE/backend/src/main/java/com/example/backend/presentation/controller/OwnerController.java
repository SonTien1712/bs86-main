package com.example.backend.presentation.controller;

import com.example.backend.presentation.dto.request.*;
import com.example.backend.presentation.dto.response.BookingResponse;
import com.example.backend.presentation.dto.response.OwnerCourtResponse;
import com.example.backend.presentation.dto.response.ApiResponse;
import com.example.backend.core.entity.Court;
import com.example.backend.core.entity.User;
import com.example.backend.core.enums.CourtStatus;
import com.example.backend.core.enums.UserStatus;
import com.example.backend.core.repository.CourtRepository;
import com.example.backend.core.repository.UserRepository;
import com.example.backend.core.service.BookingHistoryService;
import com.example.backend.core.service.BookingService;
import com.example.backend.core.service.OwnerService;
import com.example.backend.core.service.SlotService;
import com.example.backend.presentation.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/owner")
@RequiredArgsConstructor
public class OwnerController {

    private final OwnerService ownerService;
    private final SlotService slotService;
    private final CourtRepository courtRepo;
    private final UserRepository userRepo;
    private final BookingService bookingService;
    private final BookingHistoryService bookingHistoryService;

    // ================= ACTIVE STATUS GUARD =================
    /**
     * Re-validates user.status from DB on every write endpoint.
     * JWT is long-lived (24 h), so we cannot rely solely on it when
     * a user gets BLOCKED while their session is still active.
     * getVerificationStatus() is intentionally excluded so a blocked
     * owner can still see their blocked state in the UI.
     */
    private User loadAndAssertActive(Authentication auth) {
        User user = userRepo.findByEmail(auth.getName()).orElseThrow();
        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new BusinessException(HttpStatus.FORBIDDEN,
                    "Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.");
        }
        if (user.getStatus() == UserStatus.PENDING) {
            throw new BusinessException(HttpStatus.FORBIDDEN,
                    "Tài khoản chưa được kích hoạt.");
        }
        return user;
    }

    // ================= ADD COURTS =================
    @PreAuthorize("hasRole('OWNER')")
    @PostMapping("/fields/{fieldId}/courts")
    public ResponseEntity<ApiResponse> addCourts(
            @PathVariable Long fieldId,
            @RequestBody AddCourtRequest req,
            Authentication auth
    ) {

        User owner = loadAndAssertActive(auth);

        ownerService.addCourts(
                fieldId,
                req.getFrom(),
                req.getTo(),
                owner
        );

        return ResponseEntity.ok(
                new ApiResponse(
                        "Courts added successfully",
                        null
                )
        );
    }

    // ================= ADD FIELD =================
    @PreAuthorize("hasRole('OWNER')")
    @PostMapping("/fields")
    public ResponseEntity<ApiResponse> addField(
            @RequestBody AddFieldRequest req,
            Authentication auth
    ) {
        User user = loadAndAssertActive(auth);
        ownerService.addNewField(user, req);

        return ResponseEntity.ok(
                new ApiResponse("Field submitted. Waiting for approval", null)
        );
    }

    // ADD TEMPLATE
    @PreAuthorize("hasRole('OWNER')")
    @PostMapping("/courts/{courtId}/template")
    public ApiResponse setTemplate(
            @PathVariable Long courtId,
            @RequestBody SetTemplateRequest req,
            Authentication auth
    ) {

        User owner = loadAndAssertActive(auth);

        ownerService.setTemplate(courtId, req, owner);

        return new ApiResponse("Template saved", null);
    }

    @PreAuthorize("hasRole('OWNER')")
    @PostMapping("/fields/{fieldId}/courts/{courtId}/template")
    public ApiResponse setTemplateForFieldCourt(
            @PathVariable Long fieldId,
            @PathVariable Long courtId,
            @RequestBody SetTemplateRequest req,
            Authentication auth
    ) {

        User owner = loadAndAssertActive(auth);

        ownerService.setTemplate(fieldId, courtId, req, owner);

        return new ApiResponse("Template saved", null);
    }


    // BLOCK SLOT
    @PreAuthorize("hasRole('OWNER')")
    @PostMapping("/courts/{courtId}/slots/block")
    public ResponseEntity<ApiResponse> blockSlots(
            @PathVariable Long courtId,
            @RequestBody BlockSlotRequest req,
            Authentication auth
    ) {

        User owner = loadAndAssertActive(auth);

        slotService.blockSlots(
                courtId,
                req.getSlotIds(),
                owner
        );

        return ResponseEntity.ok(
                new ApiResponse("Slots blocked successfully", null)
        );
    }

    @PreAuthorize("hasRole('OWNER')")
    @PostMapping("/courts/{courtId}/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse createOwnerBooking(
            @PathVariable Long courtId,
            @RequestBody OwnerBookingRequest req,
            Authentication auth
    ) {
        User owner = loadAndAssertActive(auth);
        var booking = bookingService.createOwnerBooking(owner, courtId, req.getBookingDate(), req.getStartTimes());
        return bookingHistoryService.getBookingDetail(booking.getId());
    }

    @PreAuthorize("hasRole('OWNER')")
    @PatchMapping("/courts/{courtId}/status")
    public ResponseEntity<ApiResponse> updateCourtStatus(
            @PathVariable Long courtId,
            @RequestBody UpdateCourtStatusRequest req,
            Authentication auth
    ) {
        User owner = loadAndAssertActive(auth);
        Court updatedCourt = slotService.updateCourtStatus(courtId, req.getStatus(), owner);

        OwnerCourtResponse response = OwnerCourtResponse.builder()
                .id(updatedCourt.getId())
                .fieldId(updatedCourt.getField() != null ? updatedCourt.getField().getId() : null)
                .courtNumber(updatedCourt.getCourtNumber())
                .name("San " + updatedCourt.getCourtNumber())
                .status(CourtStatus.valueOf(updatedCourt.getStatus()))
                .hasWeekdayTemplate(false)
                .hasWeekendTemplate(false)
                .build();

        return ResponseEntity.ok(new ApiResponse("Court status updated", response));
    }

    @PreAuthorize("hasRole('OWNER')")
    @PostMapping("/courts/{courtId}/slots/override-price")
    public ResponseEntity<ApiResponse> overridePrice(
            @PathVariable Long courtId,
            @RequestBody OverridePriceRequest req,
            Authentication auth
    ) {

        User owner = loadAndAssertActive(auth);

        slotService.overridePrice(
                courtId,
                req.getDate(),
                req.getTimes(),
                req.getPrice(),
                owner
        );

        return ResponseEntity.ok(
                new ApiResponse("Override prices updated successfully", null)
        );
    }

    // ================= OWNER VERIFICATION =================
    @PreAuthorize("hasRole('OWNER')")
    @PostMapping("/verifications")
    public ResponseEntity<ApiResponse> submitVerification(
            @RequestBody com.example.backend.presentation.dto.request.SubmitVerificationRequest req,
            Authentication auth
    ) {
        // Use loadAndAssertActive to block BLOCKED/PENDING users; service has its own
        // three-strike guard as an additional safety net.
        User user = userRepo.findByEmail(auth.getName()).orElseThrow();
        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new BusinessException(HttpStatus.FORBIDDEN,
                    "Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.");
        }
        ownerService.submitVerification(user, req);

        return ResponseEntity.ok(
                new ApiResponse("Owner verification submitted. Waiting for approval", null)
        );
    }

    @PreAuthorize("hasRole('OWNER')")
    @GetMapping("/verifications/status")
    public ResponseEntity<ApiResponse> getVerificationStatus(Authentication auth) {
        User user = userRepo.findByEmail(auth.getName()).orElseThrow();
        var statusResponse = ownerService.getVerificationStatus(user);

        return ResponseEntity.ok(
                new ApiResponse("Success", statusResponse)
        );
    }

}
