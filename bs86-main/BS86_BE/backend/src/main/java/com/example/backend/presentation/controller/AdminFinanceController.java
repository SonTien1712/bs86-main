package com.example.backend.presentation.controller;

import com.example.backend.core.entity.User;
import com.example.backend.core.repository.UserRepository;
import com.example.backend.core.service.FinanceManagementService;
import com.example.backend.presentation.dto.request.FinanceSettingsRequest;
import com.example.backend.presentation.dto.request.PayoutReviewRequest;
import com.example.backend.presentation.dto.response.AdminFinanceSummaryResponse;
import com.example.backend.presentation.dto.response.ApiResponse;
import com.example.backend.presentation.dto.response.FinanceSettingsResponse;
import com.example.backend.presentation.dto.response.OwnerPayoutResponse;
import com.example.backend.presentation.dto.response.PayoutRequestResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/finance")
@RequiredArgsConstructor
public class AdminFinanceController {

    private final FinanceManagementService financeManagementService;
    private final UserRepository userRepository;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AdminFinanceSummaryResponse>> getSummary() {
        return ResponseEntity.ok(new ApiResponse<>("Admin finance summary retrieved", financeManagementService.getAdminSummary()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<FinanceSettingsResponse>> getSettings() {
        return ResponseEntity.ok(new ApiResponse<>("Finance settings retrieved", financeManagementService.getFinanceSettings()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<FinanceSettingsResponse>> updateSettings(@RequestBody FinanceSettingsRequest request) {
        return ResponseEntity.ok(new ApiResponse<>("Finance settings updated", financeManagementService.updateFinanceSettings(request)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/payout-requests")
    public ResponseEntity<ApiResponse<Page<PayoutRequestResponse>>> getPayoutRequests(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(new ApiResponse<>(
                "Payout requests retrieved",
                financeManagementService.getAdminPayoutRequests(status, page, size)
        ));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/payout-requests/{requestId}")
    public ResponseEntity<ApiResponse<PayoutRequestResponse>> getPayoutRequestDetail(@PathVariable Long requestId) {
        return ResponseEntity.ok(new ApiResponse<>(
                "Payout request retrieved",
                financeManagementService.getAdminPayoutRequest(requestId)
        ));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/payout-requests/{requestId}/approve")
    public ResponseEntity<ApiResponse<OwnerPayoutResponse>> approveRequest(
            @PathVariable Long requestId,
            @Valid @RequestBody(required = false) PayoutReviewRequest request,
            Authentication auth) {
        User admin = userRepository.findByEmail(auth.getName()).orElseThrow();
        return ResponseEntity.ok(new ApiResponse<>(
                "Payout request approved",
                financeManagementService.approvePayoutRequest(requestId, request != null ? request.getNote() : null, admin)
        ));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/payout-requests/{requestId}/reject")
    public ResponseEntity<ApiResponse<PayoutRequestResponse>> rejectRequest(
            @PathVariable Long requestId,
            @Valid @RequestBody(required = false) PayoutReviewRequest request,
            Authentication auth) {
        User admin = userRepository.findByEmail(auth.getName()).orElseThrow();
        return ResponseEntity.ok(new ApiResponse<>(
                "Payout request rejected",
                financeManagementService.rejectPayoutRequest(requestId, request != null ? request.getNote() : null, admin)
        ));
    }
}
