package com.example.backend.presentation.controller;

import com.example.backend.core.service.ticket.TicketService;
import com.example.backend.presentation.dto.request.ticket.TicketCheckInRequest;
import com.example.backend.presentation.dto.response.ApiResponse;
import com.example.backend.presentation.dto.response.ticket.TicketDetailResponse;
import com.example.backend.presentation.dto.response.ticket.TicketSummaryResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping("/my")
    public List<TicketSummaryResponse> getMyTickets() {
        return ticketService.getMyTickets();
    }

    @GetMapping("/{ticketId}")
    public TicketDetailResponse getTicketDetail(@PathVariable Long ticketId) {
        return ticketService.getTicketDetail(ticketId);
    }

    @PostMapping("/check-in")
    public ResponseEntity<ApiResponse<TicketDetailResponse>> checkIn(@Valid @RequestBody TicketCheckInRequest request) {
        TicketDetailResponse response = ticketService.checkInByQrToken(request.getQrToken());
        return ResponseEntity.status(HttpStatus.OK)
                .body(new ApiResponse<>("Ticket checked in successfully", response));
    }
}
