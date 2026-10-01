package com.example.backend.core.service;

import com.example.backend.core.enums.PaymentStatus;
import com.example.backend.core.entity.Booking;
import com.example.backend.core.repository.BookingRepository;
import com.example.backend.core.repository.TransactionLedgerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ReconciliationService {

        private final BookingRepository bookingRepository;
        private final TransactionLedgerRepository ledgerRepository;

        /**
         * Đối soát doanh thu merchant theo ngày
         */
        public ReconciliationReport merchantDailyReconciliation(Long merchantId, LocalDate date) {
                List<Booking> bookings = bookingRepository
                        .findByOwnerProfile_IdAndBookingDateAndPaymentStatus(
                                merchantId, date, PaymentStatus.PAID);

                // Fix #1: filter null trước khi reduce
                BigDecimal expectedRevenue = bookings.stream()
                        .map(Booking::getMerchantRevenue)          // Stream<Double>
                        .filter(Objects::nonNull)
                        .map(BigDecimal::valueOf)                   // convert sang BigDecimal
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal actualRevenue = ledgerRepository
                        .sumByAccountAndDate("MERCHANT", merchantId,
                                date.atStartOfDay(),
                                date.plusDays(1).atStartOfDay());

                // Fix #2: null-safe cho actualRevenue
                BigDecimal actual = actualRevenue != null ? actualRevenue : BigDecimal.ZERO;

                ReconciliationReport report = new ReconciliationReport();
                report.setMerchantId(merchantId);
                report.setDate(date);
                report.setExpectedRevenue(expectedRevenue);
                report.setActualRevenue(actual);
                report.setDiscrepancy(expectedRevenue.subtract(actual));
                // Fix #3: dùng compareTo thay equals
                report.setReconciled(expectedRevenue.compareTo(actual) == 0);

                if (!report.isReconciled()) {
                        log.error("Reconciliation mismatch for merchant {} on {}: expected={}, actual={}",
                                merchantId, date, expectedRevenue, actual);
                }

                return report;
        }

        /**
         * Tạo báo cáo tài chính hàng tháng
         */
        public FinancialReport generateMonthlyReport(YearMonth month) {
                LocalDate startDate = month.atDay(1);
                LocalDate endDate = month.atEndOfMonth();
                LocalDateTime start = startDate.atStartOfDay();
                LocalDateTime endExclusive = endDate.plusDays(1).atStartOfDay();

                // Tổng booking revenue
                BigDecimal totalBookingRevenue = ledgerRepository
                                .sumByTypeAndDateRange("BOOKING_PAYMENT", start, endExclusive);

                // Tổng commission
                BigDecimal totalCommission = ledgerRepository
                                .sumByTypeAndDateRange("COMMISSION", start, endExclusive);

                // Tổng refund
                BigDecimal totalRefund = ledgerRepository
                                .sumByTypeAndDateRange("REFUND", start, endExclusive);

                // Chi tiết theo merchant
                Map<Long, BigDecimal> revenueByMerchant = ledgerRepository
                                .sumByAccountTypeAndDateRange("MERCHANT", start, endExclusive)
                                .stream()
                                .filter(row -> row != null && row.length >= 2)
                                .collect(Collectors.toMap(
                                                row -> (Long) row[0],
                                                row -> (BigDecimal) row[1]));

                return FinancialReport.builder()
                                .month(month)
                                .totalBookingRevenue(totalBookingRevenue)
                                .totalCommission(totalCommission)
                                .totalRefund(totalRefund)
                                .netRevenue(totalCommission.subtract(totalRefund))
                                .revenueByMerchant(revenueByMerchant)
                                .generatedAt(LocalDateTime.now())
                                .build();
        }
}
