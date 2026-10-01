package com.example.backend.presentation.controller;

import com.example.backend.core.entity.Booking;
import com.example.backend.core.service.BookingHistoryService;
import com.example.backend.core.service.BookingService;
import com.example.backend.core.service.CurrentUserService;
import com.example.backend.presentation.dto.request.BookingRequest;
import com.example.backend.presentation.dto.response.ApiResponse;
import com.example.backend.presentation.dto.response.BookingHistoryItemResponse;
import com.example.backend.presentation.dto.response.BookingResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final CurrentUserService currentUserService;
    private final BookingHistoryService bookingHistoryService;

    public BookingController(
            BookingService bookingService,
            CurrentUserService currentUserService,
            BookingHistoryService bookingHistoryService
    ) {
        this.bookingService = bookingService;
        this.currentUserService = currentUserService;
        this.bookingHistoryService = bookingHistoryService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse createBooking(@Valid @RequestBody BookingRequest request) {
        Booking booking = bookingService.createBooking(
                currentUserService.getCurrentUser().getId(),
                request.getCourtId(),
                request.getBookingDate(),
                request.getStartTimes()
        );
        return bookingHistoryService.getBookingDetail(booking.getId());
    }

    @GetMapping("/my-history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<BookingHistoryItemResponse>>> getMyHistory(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<BookingHistoryItemResponse> data = bookingHistoryService.getMyHistory(status, page, size);
        return ResponseEntity.ok(new ApiResponse<>("Booking history retrieved", data));
    }

    @GetMapping("/{id}")
    public BookingResponse getBooking(@PathVariable Long id) {
        return bookingHistoryService.getBookingDetail(id);
    }

    @PutMapping("/{id}")
    public BookingResponse updateBooking(@PathVariable Long id, @RequestParam String status) {
        Booking booking = bookingService.updateBookingStatus(id, status);
        return bookingHistoryService.getBookingDetail(booking.getId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBooking(@PathVariable Long id) {
        bookingService.cancelBooking(id);
    }
}