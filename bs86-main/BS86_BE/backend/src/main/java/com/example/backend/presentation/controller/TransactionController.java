package com.example.backend.presentation.controller;

import com.example.backend.core.service.TransactionHistoryService;
import com.example.backend.presentation.dto.response.ApiResponse;
import com.example.backend.presentation.dto.response.TransactionDetailResponse;
import com.example.backend.presentation.dto.response.TransactionHistoryItemResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionHistoryService transactionHistoryService;

    @GetMapping("/api/transactions/my-history")
    public ResponseEntity<ApiResponse<Page<TransactionHistoryItemResponse>>> getMyHistory(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<TransactionHistoryItemResponse> data = transactionHistoryService.getMyHistory(status, page, size);
        return ResponseEntity.ok(new ApiResponse<>("Transaction history retrieved", data));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/admin/transactions")
    public ResponseEntity<ApiResponse<Page<TransactionHistoryItemResponse>>> getAdminTransactions(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long fieldId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<TransactionHistoryItemResponse> data = transactionHistoryService.getAdminTransactions(
                status,
                fieldId,
                userId,
                fromDate,
                toDate,
                page,
                size
        );
        return ResponseEntity.ok(new ApiResponse<>("Admin transactions retrieved", data));
    }

    @PreAuthorize("hasRole('OWNER')")
    @GetMapping("/api/owner/transactions")
    public ResponseEntity<ApiResponse<Page<TransactionHistoryItemResponse>>> getOwnerTransactions(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long fieldId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<TransactionHistoryItemResponse> data = transactionHistoryService.getOwnerTransactions(
                status,
                fieldId,
                userId,
                fromDate,
                toDate,
                page,
                size
        );
        return ResponseEntity.ok(new ApiResponse<>("Owner transactions retrieved", data));
    }

    @GetMapping("/api/transactions/{transactionId}")
    public ResponseEntity<ApiResponse<TransactionDetailResponse>> getTransactionDetail(@PathVariable Long transactionId) {
        TransactionDetailResponse data = transactionHistoryService.getTransactionDetail(transactionId);
        return ResponseEntity.ok(new ApiResponse<>("Transaction detail retrieved", data));
    }
}
