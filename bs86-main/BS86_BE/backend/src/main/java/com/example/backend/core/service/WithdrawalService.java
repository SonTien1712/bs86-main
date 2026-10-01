package com.example.backend.core.service;

import com.example.backend.core.entity.BankAccount;
import com.example.backend.core.entity.User;
import com.example.backend.core.entity.WithdrawalRequest;
import com.example.backend.core.enums.PayoutResult;
import com.example.backend.core.enums.WithdrawalStatus;
import com.example.backend.core.port.PayoutPort;
import com.example.backend.core.repository.BankAccountRepository;
import com.example.backend.core.repository.MerchantWalletRepository;
import com.example.backend.core.repository.UserRepository;
import com.example.backend.core.repository.WithdrawalRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WithdrawalService {

    private static final BigDecimal WITHDRAWAL_FEE = new BigDecimal("3300");

    private final MerchantWalletRepository walletRepository;
    private final WithdrawalRequestRepository withdrawalRepository;
    private final BankAccountRepository bankAccountRepository;
    private final PayoutPort payoutPort;
    private final LedgerService ledgerService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public WithdrawalRequest requestWithdrawal(Long merchantId, Long bankAccountId, BigDecimal amount) {
        if (amount.compareTo(new BigDecimal("10000")) < 0) {
            throw new RuntimeException("Số tiền rút tối thiểu là 10.000đ");
        }

        BankAccount bankAccount = bankAccountRepository.findById(bankAccountId)
                .orElseThrow(() -> new RuntimeException("Tài khoản ngân hàng không tồn tại"));
        if (!bankAccount.getMerchantId().equals(merchantId)) {
            throw new RuntimeException("Tài khoản ngân hàng không thuộc về merchant này");
        }

        // Atomic balance lock
        boolean locked = walletRepository.lockBalanceForWithdrawal(merchantId, amount);
        if (!locked) {
            throw new RuntimeException("Số dư khả dụng không đủ");
        }

        BigDecimal netAmount = amount.subtract(WITHDRAWAL_FEE);
        long now = System.currentTimeMillis();

        WithdrawalRequest request = WithdrawalRequest.builder()
                .merchantId(merchantId)
                .bankAccountId(bankAccountId)
                .amount(amount)
                .fee(WITHDRAWAL_FEE)
                .netAmount(netAmount)
                .status(WithdrawalStatus.PENDING)
                .createdAt(now)
                .updatedAt(now)
                .build();

        WithdrawalRequest saved = withdrawalRepository.save(request);
        log.info("[Withdrawal] Request {} created for merchant {} amount {}", saved.getId(), merchantId, amount);
        return saved;
    }

    // Use REQUIRES_NEW to commit PROCESSING immediately, blocking concurrent approvals
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markAsProcessing(Long requestId, Long adminId) {
        WithdrawalRequest request = withdrawalRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Withdrawal request not found: " + requestId));
        if (request.getStatus() != WithdrawalStatus.PENDING) {
            throw new RuntimeException("Cannot approve request with status: " + request.getStatus());
        }
        request.setStatus(WithdrawalStatus.PROCESSING);
        request.setApprovedBy(adminId);
        request.setUpdatedAt(System.currentTimeMillis());
        withdrawalRepository.save(request);
        log.info("[Withdrawal] Request {} marked as PROCESSING by admin {}", requestId, adminId);
    }

    public void approveWithdrawal(Long requestId, Long adminUserId, String adminPassword) {
        // 1. Verify admin password
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        if (!passwordEncoder.matches(adminPassword, admin.getPassword())) {
            throw new RuntimeException("Mật khẩu xác nhận không đúng");
        }

        // 2. Commit PROCESSING before payout (REQUIRES_NEW = separate transaction committed immediately)
        markAsProcessing(requestId, adminUserId);

        // 3. Load request again after commit
        WithdrawalRequest request = withdrawalRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found after marking as PROCESSING"));
        BankAccount bankAccount = bankAccountRepository.findById(request.getBankAccountId())
                .orElseThrow(() -> new RuntimeException("Bank account not found"));

        // 4. Call payout
        PayoutResult result = payoutPort.sendMoney(bankAccount, request.getNetAmount());
        log.info("[Withdrawal] Payout result for request {}: {}", requestId, result);

        completeWithdrawal(requestId, result, request);
    }

    @Transactional
    public void completeWithdrawal(Long requestId, PayoutResult result, WithdrawalRequest request) {
        long now = System.currentTimeMillis();
        if (result == PayoutResult.SUCCESS) {
            request.setStatus(WithdrawalStatus.COMPLETED);
            request.setUpdatedAt(now);
            withdrawalRepository.save(request);
            walletRepository.confirmWithdrawal(request.getMerchantId(), request.getAmount());
            // Ledger entry for withdrawal (Debit MERCHANT / Credit EXTERNAL)
            // TODO: call ledgerService.recordWithdrawalCompleted(request)
            log.info("[Withdrawal] Request {} COMPLETED", requestId);
        } else if (result == PayoutResult.FAILED) {
            request.setStatus(WithdrawalStatus.FAILED);
            request.setUpdatedAt(now);
            withdrawalRepository.save(request);
            walletRepository.rollbackWithdrawal(request.getMerchantId(), request.getAmount());
            log.warn("[Withdrawal] Request {} FAILED — balance rolled back", requestId);
        } else {
            // UNKNOWN: keep PROCESSING, reconciliation job will handle
            log.warn("[Withdrawal] Request {} payout UNKNOWN — keeping PROCESSING for reconciliation", requestId);
        }
    }

    @Transactional
    public void rejectWithdrawal(Long requestId, Long adminUserId, String adminPassword, String note) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        if (!passwordEncoder.matches(adminPassword, admin.getPassword())) {
            throw new RuntimeException("Mật khẩu xác nhận không đúng");
        }

        WithdrawalRequest request = withdrawalRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found: " + requestId));
        if (request.getStatus() != WithdrawalStatus.PENDING) {
            throw new RuntimeException("Cannot reject request with status: " + request.getStatus());
        }

        request.setStatus(WithdrawalStatus.REJECTED);
        request.setAdminNote(note);
        request.setApprovedBy(adminUserId);
        request.setUpdatedAt(System.currentTimeMillis());
        withdrawalRepository.save(request);

        // Rollback frozen balance
        walletRepository.rollbackWithdrawal(request.getMerchantId(), request.getAmount());
        log.info("[Withdrawal] Request {} REJECTED by admin {} — balance returned", requestId, adminUserId);
    }

    public List<WithdrawalRequest> getWithdrawalHistory(Long merchantId) {
        return withdrawalRepository.findByMerchantId(merchantId);
    }

    public List<WithdrawalRequest> getPendingWithdrawals() {
        return withdrawalRepository.findByStatus(WithdrawalStatus.PENDING);
    }

    // Called by reconciliation job
    @Transactional
    public void reconcileProcessingRequest(Long requestId) {
        WithdrawalRequest request = withdrawalRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        if (request.getStatus() != WithdrawalStatus.PROCESSING) return;

        BankAccount bankAccount = bankAccountRepository.findById(request.getBankAccountId()).orElse(null);
        if (bankAccount == null) return;

        // Re-query mock payout status (in real system: call bank's checkStatus API)
        PayoutResult result = payoutPort.sendMoney(bankAccount, request.getNetAmount());
        if (result != PayoutResult.UNKNOWN) {
            completeWithdrawal(requestId, result, request);
        }
    }
}
