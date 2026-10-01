package com.example.backend.presentation.controller;

import com.example.backend.core.entity.BankAccount;
import com.example.backend.core.entity.WithdrawalRequest;
import com.example.backend.core.repository.BankAccountRepository;
import com.example.backend.core.repository.OwnerProfileRepository;
import com.example.backend.core.service.MerchantWalletService;
import com.example.backend.core.service.WithdrawalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/owner/withdrawals")
@RequiredArgsConstructor
@Slf4j
public class WithdrawalController {

    private final WithdrawalService withdrawalService;
    private final MerchantWalletService walletService;
    private final OwnerProfileRepository ownerProfileRepository;
    private final BankAccountRepository bankAccountRepository;

    // Inner DTOs
    public record RequestWithdrawalDto(Long bankAccountId, BigDecimal amount) {}
    public record AddBankAccountDto(String bankName, String accountNumber, String accountHolderName, Boolean isDefault) {}

    @PostMapping("/request")
    public ResponseEntity<?> requestWithdrawal(@RequestBody RequestWithdrawalDto dto, Authentication auth) {
        Long merchantId = resolveMerchantId(auth);
        WithdrawalRequest request = withdrawalService.requestWithdrawal(merchantId, dto.bankAccountId(), dto.amount());
        return ResponseEntity.ok(request);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(Authentication auth) {
        Long merchantId = resolveMerchantId(auth);
        return ResponseEntity.ok(withdrawalService.getWithdrawalHistory(merchantId));
    }

    @GetMapping("/balance")
    public ResponseEntity<?> getBalance(Authentication auth) {
        Long merchantId = resolveMerchantId(auth);
        return ResponseEntity.ok(walletService.getBalance(merchantId));
    }

    @PostMapping("/bank-accounts")
    public ResponseEntity<?> addBankAccount(@RequestBody AddBankAccountDto dto, Authentication auth) {
        Long merchantId = resolveMerchantId(auth);
        long now = System.currentTimeMillis();
        BankAccount bankAccount = BankAccount.builder()
                .merchantId(merchantId)
                .bankName(dto.bankName())
                .accountNumber(dto.accountNumber())
                .accountHolderName(dto.accountHolderName())
                .isDefault(dto.isDefault() != null && dto.isDefault())
                .createdAt(now)
                .build();
        BankAccount saved = bankAccountRepository.save(bankAccount);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/bank-accounts")
    public ResponseEntity<?> getBankAccounts(Authentication auth) {
        Long merchantId = resolveMerchantId(auth);
        List<BankAccount> accounts = bankAccountRepository.findByMerchantId(merchantId);
        return ResponseEntity.ok(accounts);
    }

    private Long resolveMerchantId(Authentication auth) {
        String email = auth.getName();
        return ownerProfileRepository.findByUserEmail(email)
                .orElseThrow(() -> new RuntimeException("Owner profile not found for: " + email))
                .getId();
    }
}
