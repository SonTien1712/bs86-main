package com.example.backend.core.service;

import com.example.backend.core.entity.User;
import com.example.backend.core.enums.PayoutRequestStatus;
import com.example.backend.core.enums.UserStatus;
import com.example.backend.core.enums.VerificationStatus;
import com.example.backend.infrastructure.persistence.jpa.entity.OwnerVerificationEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.FinanceSettingsEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.OwnerProfileEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.TransactionLedgerEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.UserEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.FinanceSettingsJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.OwnerProfileJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.PayoutRequestJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.TransactionLedgerJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.UserJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.OwnerVerificationJpaRepository;
import com.example.backend.presentation.dto.request.OwnerPayoutAccountRequest;
import com.example.backend.presentation.dto.request.OwnerPayoutRequest;
import com.example.backend.presentation.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
class FinanceManagementServiceIntegrationTest {

    @Autowired
    private FinanceManagementService financeManagementService;

    @Autowired
    private UserJpaRepository userJpaRepository;

    @Autowired
    private OwnerProfileJpaRepository ownerProfileJpaRepository;

    @Autowired
    private FinanceSettingsJpaRepository financeSettingsJpaRepository;

    @Autowired
    private TransactionLedgerJpaRepository transactionLedgerJpaRepository;

    @Autowired
    private PayoutRequestJpaRepository payoutRequestJpaRepository;

    @Autowired
    private OwnerVerificationJpaRepository ownerVerificationJpaRepository;

    @Test
    void createOwnerPayoutRequest_concurrentRequestsDoNotOverReserveBalance() throws Exception {
        financeSettingsJpaRepository.findById(1L).orElseGet(() -> {
            FinanceSettingsEntity settings = new FinanceSettingsEntity();
            settings.setId(1L);
            settings.setPlatformCommissionRate(new BigDecimal("0.10"));
            settings.setMinimumPayoutAmount(new BigDecimal("100000"));
            return financeSettingsJpaRepository.save(settings);
        });

        String email = "owner-" + UUID.randomUUID() + "@example.com";
        UserEntity userEntity = new UserEntity();
        userEntity.setEmail(email);
        userEntity.setPassword("secret");
        userEntity.setStatus(UserStatus.ACTIVE);
        userEntity.setProvider("EMAIL");
        userEntity.setEmailVerified(true);
        userEntity.setCreatedAt(LocalDateTime.now());
        userEntity.setUpdatedAt(LocalDateTime.now());
        userEntity = userJpaRepository.save(userEntity);

        OwnerProfileEntity ownerProfile = new OwnerProfileEntity();
        ownerProfile.setUser(userEntity);
        ownerProfile.setBankName("VCB");
        ownerProfile.setBankAccountNumber("123456789");
        ownerProfile.setBankAccountHolder("Concurrent Owner");
        ownerProfile.setPayoutEnabled(true);
        ownerProfile = ownerProfileJpaRepository.save(ownerProfile);

        TransactionLedgerEntity ledgerEntry = new TransactionLedgerEntity();
        ledgerEntry.setTransactionType("OWNER_PAYABLE");
        ledgerEntry.setDebitAccountType("PLATFORM_ESCROW");
        ledgerEntry.setDebitAccountId(1L);
        ledgerEntry.setCreditAccountType("MERCHANT_PAYABLE");
        ledgerEntry.setCreditAccountId(ownerProfile.getId());
        ledgerEntry.setAmount(new BigDecimal("150000.00"));
        ledgerEntry.setDescription("Seed payable balance");
        transactionLedgerJpaRepository.save(ledgerEntry);

        User owner = new User();
        owner.setId(userEntity.getId());
        owner.setEmail(userEntity.getEmail());

        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        try {
            Future<String> first = executor.submit(() -> submitConcurrentPayout(owner, ready, start));
            Future<String> second = executor.submit(() -> submitConcurrentPayout(owner, ready, start));

            ready.await();
            start.countDown();

            List<String> outcomes = List.of(first.get(), second.get());
            long successCount = outcomes.stream().filter("SUCCESS"::equals).count();
            long failureCount = outcomes.stream().filter(message -> message.contains("exceeds available balance")).count();

            assertEquals(1L, successCount);
            assertEquals(1L, failureCount);
        } finally {
            executor.shutdownNow();
        }

        assertEquals(
                1,
                payoutRequestJpaRepository.findByOwnerProfileIdOrderByCreatedAtDesc(ownerProfile.getId(), Pageable.unpaged())
                        .getContent()
                        .size()
        );
        assertEquals(
                new BigDecimal("120000.00"),
                payoutRequestJpaRepository.sumAmountByOwnerProfileIdAndStatus(ownerProfile.getId(), PayoutRequestStatus.PENDING)
        );
    }

    @Test
    void updateOwnerPayoutAccount_updatesExistingOwnerWithVerification() {
        String email = "owner-update-" + UUID.randomUUID() + "@example.com";
        UserEntity userEntity = new UserEntity();
        userEntity.setEmail(email);
        userEntity.setPassword("secret");
        userEntity.setStatus(UserStatus.ACTIVE);
        userEntity.setProvider("EMAIL");
        userEntity.setEmailVerified(true);
        userEntity.setCreatedAt(LocalDateTime.now());
        userEntity.setUpdatedAt(LocalDateTime.now());
        userEntity = userJpaRepository.save(userEntity);

        OwnerProfileEntity ownerProfile = new OwnerProfileEntity();
        ownerProfile.setUser(userEntity);
        ownerProfile = ownerProfileJpaRepository.save(ownerProfile);

        OwnerVerificationEntity verification = new OwnerVerificationEntity();
        verification.setOwner(ownerProfile);
        verification.setIdCardNumber("079123456789");
        verification.setBusinessLicenseUrl("https://example.com/license.png");
        verification.setStatus(VerificationStatus.PENDING);
        verification.setAttemptCount(1);
        ownerVerificationJpaRepository.save(verification);

        User owner = new User();
        owner.setId(userEntity.getId());
        owner.setEmail(userEntity.getEmail());

        OwnerPayoutAccountRequest request = new OwnerPayoutAccountRequest();
        request.setBankName("VCB");
        request.setBankAccountNumber("123456789");
        request.setBankAccountHolder("Owner Updated");

        financeManagementService.updateOwnerPayoutAccount(owner, request);

        OwnerProfileEntity updated = ownerProfileJpaRepository.findByUserId(userEntity.getId()).orElseThrow();
        assertEquals("VCB", updated.getBankName());
        assertEquals("123456789", updated.getBankAccountNumber());
        assertEquals("Owner Updated", updated.getBankAccountHolder());
        assertTrue(updated.isPayoutEnabled());
    }

    private String submitConcurrentPayout(User owner, CountDownLatch ready, CountDownLatch start) throws Exception {
        ready.countDown();
        start.await();

        OwnerPayoutRequest request = new OwnerPayoutRequest();
        request.setAmount(new BigDecimal("120000"));
        request.setNote("Concurrent payout");

        try {
            financeManagementService.createOwnerPayoutRequest(owner, request);
            return "SUCCESS";
        } catch (BusinessException ex) {
            return ex.getMessage();
        }
    }
}
