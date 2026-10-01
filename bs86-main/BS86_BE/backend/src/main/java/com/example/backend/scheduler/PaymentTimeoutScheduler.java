package com.example.backend.scheduler;

import com.example.backend.core.service.PaymentApplicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentTimeoutScheduler {

    private final PaymentApplicationService paymentApplicationService;

    @Scheduled(fixedDelayString = "${payment.timeout-check-delay-ms:60000}")
    public void expirePendingPayments() {
        int expiredCount = paymentApplicationService.expirePendingPayments();
        if (expiredCount > 0) {
            log.info("Expired {} pending payment bookings", expiredCount);
        }
    }
}
