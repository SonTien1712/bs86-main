package com.example.backend.presentation.controller;

import com.example.backend.core.service.PaymentApplicationService;
import com.example.backend.infrastructure.external.VnpayGateway;
import com.example.backend.presentation.dto.request.CreatePaymentSessionRequest;
import com.example.backend.presentation.dto.request.CreateVnpayPaymentRequest;
import com.example.backend.presentation.dto.response.ApiResponse;
import com.example.backend.presentation.dto.response.PaymentResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentApplicationService paymentApplicationService;
    private final VnpayGateway vnpayGateway;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<PaymentResponse>> createPaymentSession(
            @Valid @RequestBody CreatePaymentSessionRequest request,
            HttpServletRequest httpRequest
    ) {
        PaymentResponse response = paymentApplicationService.createPaymentSession(
                request,
                vnpayGateway.getIpAddress(httpRequest)
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>("Payment session created", response));
    }

    @PostMapping("/vnpay/create")
    public ResponseEntity<ApiResponse<PaymentResponse>> createVnpayPayment(
            @Valid @RequestBody CreateVnpayPaymentRequest request,
            HttpServletRequest httpRequest
    ) {
        PaymentResponse response = paymentApplicationService.createVnpayPayment(
                request.getBookingId(),
                vnpayGateway.getIpAddress(httpRequest)
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>("VNPay payment created", response));
    }

    @GetMapping("/callback")
    public ResponseEntity<ApiResponse<PaymentResponse>> paymentCallback(@RequestParam Map<String, String> params) {
        PaymentResponse response = paymentApplicationService.handlePaymentCallback(new HashMap<>(params));
        return ResponseEntity.ok(new ApiResponse<>("Payment callback handled", response));
    }

    @GetMapping("/vnpay/return")
    public ResponseEntity<ApiResponse<PaymentResponse>> vnpayReturn(@RequestParam Map<String, String> params) {
        return paymentCallback(params);
    }

    @PostMapping("/bookings/{bookingId}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelPendingPayment(@PathVariable Long bookingId) {
        paymentApplicationService.cancelPendingPayment(bookingId);
        return ResponseEntity.ok(new ApiResponse<>("Pending payment cancelled", null));
    }

    @GetMapping("/{transactionId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentStatus(@PathVariable Long transactionId) {
        PaymentResponse response = paymentApplicationService.getPaymentStatus(transactionId);
        return ResponseEntity.ok(new ApiResponse<>("Payment status retrieved", response));
    }
}
