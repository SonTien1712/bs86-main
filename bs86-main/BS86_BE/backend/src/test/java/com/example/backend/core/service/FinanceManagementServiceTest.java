package com.example.backend.core.service;

import com.example.backend.core.entity.User;
import com.example.backend.core.enums.PayoutRequestStatus;
import com.example.backend.core.repository.OwnerProfileRepository;
import com.example.backend.core.repository.TransactionLedgerRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.FinanceSettingsEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.OwnerProfileEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.PayoutRequestEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.UserEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.FinanceSettingsJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.OwnerProfileJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.PayoutRequestJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.UserJpaRepository;
import com.example.backend.presentation.dto.request.OwnerPayoutRequest;
import com.example.backend.presentation.dto.response.OwnerPayoutResponse;
import com.example.backend.presentation.dto.response.PayoutRequestResponse;
import com.example.backend.presentation.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FinanceManagementServiceTest {

    @Mock
    private OwnerProfileRepository ownerProfileRepository;

    @Mock
    private TransactionLedgerRepository ledgerRepository;

    @Mock
    private LedgerService ledgerService;

    @Mock
    private FinanceSettingsJpaRepository financeSettingsJpaRepository;

    @Mock
    private PayoutRequestJpaRepository payoutRequestJpaRepository;

    @Mock
    private OwnerProfileJpaRepository ownerProfileJpaRepository;

    @Mock
    private UserJpaRepository userJpaRepository;

    @InjectMocks
    private FinanceManagementService financeManagementService;

    @Test
    void createOwnerPayoutRequest_createsPendingRequestWithBankSnapshot() {
        User user = buildOwnerUser(11L);
        OwnerProfileEntity owner = buildOwnerProfileEntity(22L, user.getId(), true);
        FinanceSettingsEntity settings = buildSettings();
        OwnerPayoutRequest request = buildOwnerPayoutRequest("120000");

        when(ownerProfileJpaRepository.findByUserIdForUpdate(user.getId())).thenReturn(Optional.of(owner));
        when(financeSettingsJpaRepository.findById(1L)).thenReturn(Optional.of(settings));
        when(ledgerRepository.sumCreditsByAccount("MERCHANT_PAYABLE", owner.getId())).thenReturn(new BigDecimal("300000"));
        when(ledgerRepository.sumDebitsByAccount("MERCHANT_PAYABLE", owner.getId())).thenReturn(BigDecimal.ZERO);
        when(payoutRequestJpaRepository.sumAmountByOwnerProfileIdAndStatusExcludingRequest(
                owner.getId(),
                PayoutRequestStatus.PENDING,
                null
        )).thenReturn(new BigDecimal("50000"));
        when(payoutRequestJpaRepository.save(any(PayoutRequestEntity.class))).thenAnswer(invocation -> {
            PayoutRequestEntity entity = invocation.getArgument(0);
            entity.setId(77L);
            entity.setCreatedAt(LocalDateTime.now());
            entity.setUpdatedAt(LocalDateTime.now());
            return entity;
        });

        PayoutRequestResponse response = financeManagementService.createOwnerPayoutRequest(user, request);

        assertEquals(77L, response.getId());
        assertEquals("PENDING", response.getStatus());
        assertEquals(new BigDecimal("120000.00"), response.getAmount());
        assertEquals(owner.getBankName(), response.getBankName());

        ArgumentCaptor<PayoutRequestEntity> captor = ArgumentCaptor.forClass(PayoutRequestEntity.class);
        verify(payoutRequestJpaRepository).save(captor.capture());
        PayoutRequestEntity saved = captor.getValue();
        assertEquals(PayoutRequestStatus.PENDING, saved.getStatus());
        assertEquals(owner.getBankAccountNumber(), saved.getBankAccountNumber());
        assertEquals("Need payout", saved.getOwnerNote());
    }

    @Test
    void createOwnerPayoutRequest_rejectsWhenPendingRequestsAlreadyReserveBalance() {
        User user = buildOwnerUser(11L);
        OwnerProfileEntity owner = buildOwnerProfileEntity(22L, user.getId(), true);
        FinanceSettingsEntity settings = buildSettings();
        OwnerPayoutRequest request = buildOwnerPayoutRequest("200000");

        when(ownerProfileJpaRepository.findByUserIdForUpdate(user.getId())).thenReturn(Optional.of(owner));
        when(financeSettingsJpaRepository.findById(1L)).thenReturn(Optional.of(settings));
        when(ledgerRepository.sumCreditsByAccount("MERCHANT_PAYABLE", owner.getId()))
                .thenReturn(new BigDecimal("300000"));
        when(ledgerRepository.sumDebitsByAccount("MERCHANT_PAYABLE", owner.getId()))
                .thenReturn(BigDecimal.ZERO);
        when(payoutRequestJpaRepository.sumAmountByOwnerProfileIdAndStatusExcludingRequest(
                owner.getId(),
                PayoutRequestStatus.PENDING,
                null
        )).thenReturn(new BigDecimal("150000"));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> financeManagementService.createOwnerPayoutRequest(user, request)
        );

        assertEquals("Payout amount exceeds available balance", exception.getMessage());
        verify(payoutRequestJpaRepository, never()).save(any(PayoutRequestEntity.class));
    }

    @Test
    void createOwnerPayoutRequest_rejectsWhenAmountIsZeroOrNegative() {
        User user = buildOwnerUser(11L);
        OwnerProfileEntity owner = buildOwnerProfileEntity(22L, user.getId(), true);
        FinanceSettingsEntity settings = buildSettings();
        OwnerPayoutRequest request = buildOwnerPayoutRequest("0");

        when(ownerProfileJpaRepository.findByUserIdForUpdate(user.getId())).thenReturn(Optional.of(owner));
        when(financeSettingsJpaRepository.findById(1L)).thenReturn(Optional.of(settings));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> financeManagementService.createOwnerPayoutRequest(user, request)
        );

        assertEquals("So tien rut phai lon hon 0", exception.getMessage());
        verify(payoutRequestJpaRepository, never()).save(any(PayoutRequestEntity.class));
    }

    @Test
    void approvePayoutRequest_marksApprovedAndWritesLedger() {
        User admin = buildOwnerUser(1L);
        admin.setEmail("admin@example.com");

        OwnerProfileEntity owner = buildOwnerProfileEntity(22L, 11L, true);
        PayoutRequestEntity payoutRequest = buildPayoutRequestEntity(88L, owner, PayoutRequestStatus.PENDING, "150000");
        UserEntity adminEntity = new UserEntity();
        adminEntity.setId(admin.getId());
        adminEntity.setEmail(admin.getEmail());

        when(payoutRequestJpaRepository.findByIdForUpdate(payoutRequest.getId())).thenReturn(Optional.of(payoutRequest));
        when(ownerProfileJpaRepository.findByIdForUpdate(owner.getId())).thenReturn(Optional.of(owner));
        when(ledgerRepository.sumCreditsByAccount("MERCHANT_PAYABLE", owner.getId())).thenReturn(new BigDecimal("300000"));
        when(ledgerRepository.sumDebitsByAccount("MERCHANT_PAYABLE", owner.getId())).thenReturn(new BigDecimal("50000"));
        when(userJpaRepository.getReferenceById(admin.getId())).thenReturn(adminEntity);
        when(ledgerService.recordOwnerPayout(eq(owner.getId()), eq(new BigDecimal("150000.00")), any(String.class), any(String.class)))
                .thenAnswer(invocation -> {
                    com.example.backend.core.entity.TransactionLedger ledger = new com.example.backend.core.entity.TransactionLedger();
                    ledger.setAmount(invocation.getArgument(1));
                    ledger.setReferenceId(invocation.getArgument(2));
                    return ledger;
                });
        when(payoutRequestJpaRepository.save(any(PayoutRequestEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OwnerPayoutResponse response = financeManagementService.approvePayoutRequest(payoutRequest.getId(), "Da chuyen khoan", admin);

        assertEquals(owner.getId(), response.getOwnerId());
        assertEquals(new BigDecimal("150000.00"), response.getAmount());
        assertNotNull(response.getReferenceId());
        assertEquals(PayoutRequestStatus.APPROVED, payoutRequest.getStatus());
        assertEquals("Da chuyen khoan", payoutRequest.getAdminNote());
        assertNotNull(payoutRequest.getReviewedAt());
        verify(ledgerService).recordOwnerPayout(eq(owner.getId()), eq(new BigDecimal("150000.00")), any(String.class), eq("Da chuyen khoan"));
    }

    @Test
    void rejectPayoutRequest_marksRejectedAndStoresReason() {
        User admin = buildOwnerUser(1L);
        admin.setEmail("admin@example.com");

        OwnerProfileEntity owner = buildOwnerProfileEntity(22L, 11L, true);
        PayoutRequestEntity payoutRequest = buildPayoutRequestEntity(88L, owner, PayoutRequestStatus.PENDING, "90000");
        UserEntity adminEntity = new UserEntity();
        adminEntity.setId(admin.getId());
        adminEntity.setEmail(admin.getEmail());

        when(payoutRequestJpaRepository.findByIdForUpdate(payoutRequest.getId())).thenReturn(Optional.of(payoutRequest));
        when(ownerProfileJpaRepository.findByIdForUpdate(owner.getId())).thenReturn(Optional.of(owner));
        when(userJpaRepository.getReferenceById(admin.getId())).thenReturn(adminEntity);
        when(payoutRequestJpaRepository.save(any(PayoutRequestEntity.class))).thenAnswer(invocation -> {
            PayoutRequestEntity entity = invocation.getArgument(0);
            entity.setUpdatedAt(LocalDateTime.now());
            return entity;
        });

        PayoutRequestResponse response = financeManagementService.rejectPayoutRequest(payoutRequest.getId(), "Sai thong tin ngan hang", admin);

        assertEquals("REJECTED", response.getStatus());
        assertEquals("Sai thong tin ngan hang", response.getAdminNote());
        assertEquals(PayoutRequestStatus.REJECTED, payoutRequest.getStatus());
        verify(ledgerService, never()).recordOwnerPayout(any(Long.class), any(BigDecimal.class), any(String.class), any(String.class));
    }

    @Test
    void approvePayoutRequest_rejectsWhenRequestWasAlreadyProcessed() {
        User admin = buildOwnerUser(1L);
        OwnerProfileEntity owner = buildOwnerProfileEntity(22L, 11L, true);
        PayoutRequestEntity payoutRequest = buildPayoutRequestEntity(88L, owner, PayoutRequestStatus.APPROVED, "90000");

        when(payoutRequestJpaRepository.findByIdForUpdate(payoutRequest.getId())).thenReturn(Optional.of(payoutRequest));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> financeManagementService.approvePayoutRequest(payoutRequest.getId(), "Duyet lai", admin)
        );

        assertTrue(exception.getMessage().contains("already been approved"));
        verify(ledgerService, never()).recordOwnerPayout(any(Long.class), any(BigDecimal.class), any(String.class), any(String.class));
    }

    private User buildOwnerUser(Long id) {
        User user = new User();
        user.setId(id);
        user.setEmail("owner@example.com");
        return user;
    }

    private OwnerProfileEntity buildOwnerProfileEntity(Long ownerId, Long userId, boolean payoutEnabled) {
        OwnerProfileEntity owner = new OwnerProfileEntity();
        owner.setId(ownerId);
        owner.setBankName("VCB");
        owner.setBankAccountNumber("123456789");
        owner.setBankAccountHolder("Owner Test");
        owner.setPayoutEnabled(payoutEnabled);

        UserEntity userEntity = new UserEntity();
        userEntity.setId(userId);
        userEntity.setEmail("owner@example.com");
        owner.setUser(userEntity);
        return owner;
    }

    private FinanceSettingsEntity buildSettings() {
        FinanceSettingsEntity settings = new FinanceSettingsEntity();
        settings.setId(1L);
        settings.setMinimumPayoutAmount(new BigDecimal("100000"));
        settings.setPlatformCommissionRate(new BigDecimal("0.10"));
        return settings;
    }

    private OwnerPayoutRequest buildOwnerPayoutRequest(String amount) {
        OwnerPayoutRequest request = new OwnerPayoutRequest();
        request.setAmount(new BigDecimal(amount));
        request.setNote("Need payout");
        return request;
    }

    private PayoutRequestEntity buildPayoutRequestEntity(
            Long requestId,
            OwnerProfileEntity owner,
            PayoutRequestStatus status,
            String amount) {
        PayoutRequestEntity payoutRequest = new PayoutRequestEntity();
        payoutRequest.setId(requestId);
        payoutRequest.setOwnerProfile(owner);
        payoutRequest.setStatus(status);
        payoutRequest.setAmount(new BigDecimal(amount).setScale(2));
        payoutRequest.setBankName(owner.getBankName());
        payoutRequest.setBankAccountNumber(owner.getBankAccountNumber());
        payoutRequest.setBankAccountHolder(owner.getBankAccountHolder());
        payoutRequest.setCreatedAt(LocalDateTime.now());
        payoutRequest.setUpdatedAt(LocalDateTime.now());
        return payoutRequest;
    }
}
