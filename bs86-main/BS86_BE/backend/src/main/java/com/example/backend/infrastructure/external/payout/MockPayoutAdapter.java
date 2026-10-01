package com.example.backend.infrastructure.external.payout;

import com.example.backend.core.entity.BankAccount;
import com.example.backend.core.enums.PayoutResult;
import com.example.backend.core.port.PayoutPort;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class MockPayoutAdapter implements PayoutPort {

    @Override
    public PayoutResult sendMoney(BankAccount account, BigDecimal amount) {
        if ("9999".equals(account.getAccountNumber())) return PayoutResult.FAILED;
        if ("8888".equals(account.getAccountNumber())) return PayoutResult.UNKNOWN;
        // Simulate 1s processing
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return PayoutResult.SUCCESS;
    }
}
