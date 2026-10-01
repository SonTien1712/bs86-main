package com.example.backend.core.port;

import com.example.backend.core.entity.BankAccount;
import com.example.backend.core.enums.PayoutResult;

import java.math.BigDecimal;

public interface PayoutPort {
    PayoutResult sendMoney(BankAccount account, BigDecimal amount);
}
