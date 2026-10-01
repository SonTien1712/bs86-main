package com.example.backend.presentation.controller;

import com.example.backend.core.service.ticket.OwnerCheckInService;
import com.example.backend.presentation.dto.request.owner.OwnerCheckInRequest;
import com.example.backend.presentation.dto.response.ApiResponse;
import com.example.backend.presentation.dto.response.owner.OwnerCheckInResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/owner")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER')")
public class OwnerCheckInController {

    private final OwnerCheckInService ownerCheckInService;

    @PostMapping("/check-in")
    public ApiResponse<OwnerCheckInResponse> checkIn(@Valid @RequestBody OwnerCheckInRequest request) {
        return new ApiResponse<>("Check-in processed", ownerCheckInService.checkInByQrToken(request.getQrToken()));
    }

    @GetMapping("/check-in-history")
    public List<OwnerCheckInResponse> getCheckInHistory() {
        return ownerCheckInService.getMyCheckInHistory();
    }
}
