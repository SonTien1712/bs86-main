package com.example.backend.presentation.controller;

import com.example.backend.core.service.FieldReportService;
import com.example.backend.presentation.dto.request.CreateFieldReportRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class FieldReportController {

    private final FieldReportService fieldReportService;

    @PostMapping
    public ResponseEntity<?> createReport(
            @RequestBody CreateFieldReportRequest request,
            Principal principal
    ) {
        fieldReportService.createReport(
                request.getFieldId(),
                request.getReason(),
                principal.getName()
        );

        return ResponseEntity.ok("Report submitted");
    }
}