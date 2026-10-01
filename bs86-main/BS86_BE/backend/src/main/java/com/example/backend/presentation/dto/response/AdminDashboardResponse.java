package com.example.backend.presentation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminDashboardResponse {

    private long totalUsers;
    private long totalOwners;
    private long totalFields;
    private long totalBookings;

    private long pendingOwners;
    private long pendingFields;
    private long pendingReports;

    private BigDecimal totalRevenue;

    private List<FieldReportStat> topReportedFields;
}
