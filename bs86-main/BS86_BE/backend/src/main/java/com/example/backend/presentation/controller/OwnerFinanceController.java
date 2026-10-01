package com.example.backend.presentation.controller;

import com.example.backend.core.entity.User;
import com.example.backend.core.repository.UserRepository;
import com.example.backend.core.service.FinanceManagementService;
import com.example.backend.presentation.dto.request.OwnerPayoutAccountRequest;
import com.example.backend.presentation.dto.request.OwnerPayoutRequest;
import com.example.backend.presentation.dto.response.ApiResponse;
import com.example.backend.presentation.dto.response.OwnerFinanceSummaryResponse;
import com.example.backend.presentation.dto.response.OwnerPayoutAccountResponse;
import com.example.backend.presentation.dto.response.PayoutRequestResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/owner/finance")
@RequiredArgsConstructor
public class OwnerFinanceController {

    private final FinanceManagementService financeManagementService;
    private final UserRepository userRepository;

    @PreAuthorize("hasRole('OWNER')")
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<OwnerFinanceSummaryResponse>> getSummary(Authentication auth) {
        User owner = userRepository.findByEmail(auth.getName()).orElseThrow();
        return ResponseEntity.ok(new ApiResponse<>("Success", financeManagementService.getOwnerSummary(owner)));
    }

    @PreAuthorize("hasRole('OWNER')")
    @PutMapping("/payout-account")
    public ResponseEntity<ApiResponse<OwnerPayoutAccountResponse>> updatePayoutAccount(
            @Valid @RequestBody OwnerPayoutAccountRequest request,
            Authentication auth) {
        User owner = userRepository.findByEmail(auth.getName()).orElseThrow();
        return ResponseEntity.ok(new ApiResponse<>(
                "Owner payout account updated",
                financeManagementService.updateOwnerPayoutAccount(owner, request)));
    }

    @PreAuthorize("hasRole('OWNER')")
    @PostMapping("/payout-requests")
    public ResponseEntity<ApiResponse<PayoutRequestResponse>> createPayoutRequest(
            @Valid @RequestBody OwnerPayoutRequest request,
            Authentication auth) {
        User owner = userRepository.findByEmail(auth.getName()).orElseThrow();
        return ResponseEntity.ok(new ApiResponse<>(
                "Payout request created",
                financeManagementService.createOwnerPayoutRequest(owner, request)
        ));
    }

    @PreAuthorize("hasRole('OWNER')")
    @GetMapping("/payout-requests")
    public ResponseEntity<ApiResponse<Page<PayoutRequestResponse>>> getPayoutRequests(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        User owner = userRepository.findByEmail(auth.getName()).orElseThrow();
        return ResponseEntity.ok(new ApiResponse<>(
                "Owner payout requests retrieved",
                financeManagementService.getOwnerPayoutRequests(owner, status, page, size)
        ));
    }
}
