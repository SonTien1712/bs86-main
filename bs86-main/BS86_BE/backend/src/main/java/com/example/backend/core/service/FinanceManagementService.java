package com.example.backend.core.service;

import com.example.backend.core.enums.PayoutRequestStatus;
import com.example.backend.core.entity.OwnerProfile;
import com.example.backend.core.entity.TransactionLedger;
import com.example.backend.core.entity.User;
import com.example.backend.core.repository.OwnerProfileRepository;
import com.example.backend.core.repository.TransactionLedgerRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.OwnerProfileEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.FinanceSettingsEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.PayoutRequestEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.FinanceSettingsJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.OwnerProfileJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.PayoutRequestJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.UserJpaRepository;
import com.example.backend.presentation.dto.request.OwnerPayoutAccountRequest;
import com.example.backend.presentation.dto.request.FinanceSettingsRequest;
import com.example.backend.presentation.dto.request.OwnerPayoutRequest;
import com.example.backend.presentation.dto.response.AdminFinanceSummaryResponse;
import com.example.backend.presentation.dto.response.FinanceSettingsResponse;
import com.example.backend.presentation.dto.response.OwnerFinanceSummaryResponse;
import com.example.backend.presentation.dto.response.OwnerPayoutAccountResponse;
import com.example.backend.presentation.dto.response.OwnerPayoutResponse;
import com.example.backend.presentation.dto.response.PayoutRequestResponse;
import com.example.backend.presentation.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FinanceManagementService {

    private static final Long PLATFORM_ACCOUNT_ID = 1L;
    private static final Long DEFAULT_SETTINGS_ID = 1L;
    private static final BigDecimal DEFAULT_COMMISSION_RATE = new BigDecimal("0.10");
    private static final BigDecimal DEFAULT_MINIMUM_PAYOUT = new BigDecimal("100000");

    private final OwnerProfileRepository ownerProfileRepository;
    private final TransactionLedgerRepository ledgerRepository;
    private final LedgerService ledgerService;
    private final FinanceSettingsJpaRepository financeSettingsJpaRepository;
    private final PayoutRequestJpaRepository payoutRequestJpaRepository;
    private final OwnerProfileJpaRepository ownerProfileJpaRepository;
    private final UserJpaRepository userJpaRepository;

    @Transactional(readOnly = true)
    public OwnerFinanceSummaryResponse getOwnerSummary(User user) {
        OwnerProfile owner = ownerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Owner profile not found"));
        FinanceSettingsEntity settings = getOrCreateSettings();

        BigDecimal payableCredits = ledgerRepository.sumCreditsByAccount("MERCHANT_PAYABLE", owner.getId());
        BigDecimal payableDebits = ledgerRepository.sumDebitsByAccount("MERCHANT_PAYABLE", owner.getId());
        BigDecimal settledCredits = ledgerRepository.sumCreditsByAccount("MERCHANT_SETTLED", owner.getId());
        BigDecimal totalRevenue = payableCredits.add(settledCredits);
        BigDecimal totalPayableBalance = payableCredits.subtract(payableDebits);
        BigDecimal pendingPayoutRequestAmount = payoutRequestJpaRepository.sumAmountByOwnerProfileIdAndStatus(
                owner.getId(),
                PayoutRequestStatus.PENDING
        );
        BigDecimal availablePayoutBalance = nonNegative(totalPayableBalance.subtract(pendingPayoutRequestAmount));

        return OwnerFinanceSummaryResponse.builder()
                .ownerId(owner.getId())
                .bankName(owner.getBankName())
                .bankAccountNumber(owner.getBankAccountNumber())
                .bankAccountHolder(owner.getBankAccountHolder())
                .payoutEnabled(
                        owner.isPayoutEnabled()
                                || hasText(owner.getBankName()) && hasText(owner.getBankAccountNumber()) && hasText(owner.getBankAccountHolder())
                )
                .totalRevenue(totalRevenue)
                .totalPayableBalance(totalPayableBalance)
                .availablePayoutBalance(availablePayoutBalance)
                .pendingPayoutRequestAmount(pendingPayoutRequestAmount)
                .pendingPayoutBalance(availablePayoutBalance)
                .settledAmount(settledCredits)
                .platformCommissionRate(settings.getPlatformCommissionRate())
                .ownerShareRate(ownerShareRate(settings))
                .minimumPayoutAmount(settings.getMinimumPayoutAmount())
                .build();
    }

    @Transactional
    public OwnerPayoutAccountResponse updateOwnerPayoutAccount(User user, OwnerPayoutAccountRequest request) {
        OwnerProfile owner = ownerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Owner profile not found"));

        owner.setBankName(normalizeRequiredValue(request.getBankName(), "Vui long nhap ten ngan hang"));
        owner.setBankAccountNumber(normalizeRequiredValue(request.getBankAccountNumber(), "Vui long nhap so tai khoan"));
        owner.setBankAccountHolder(normalizeRequiredValue(request.getBankAccountHolder(), "Vui long nhap ten chu tai khoan"));
        owner.setPayoutEnabled(true);

        OwnerProfile saved = ownerProfileRepository.save(owner);
        return OwnerPayoutAccountResponse.builder()
                .ownerId(saved.getId())
                .bankName(saved.getBankName())
                .bankAccountNumber(saved.getBankAccountNumber())
                .bankAccountHolder(saved.getBankAccountHolder())
                .payoutEnabled(saved.isPayoutEnabled())
                .build();
    }

    @Transactional(readOnly = true)
    public AdminFinanceSummaryResponse getAdminSummary() {
        FinanceSettingsEntity settings = getOrCreateSettings();
        BigDecimal escrowBalance = ledgerRepository.sumCreditsByAccount("PLATFORM_ESCROW", PLATFORM_ACCOUNT_ID)
                .subtract(ledgerRepository.sumDebitsByAccount("PLATFORM_ESCROW", PLATFORM_ACCOUNT_ID));
        BigDecimal platformRevenue = ledgerRepository.sumCreditsByAccount("PLATFORM_REVENUE", PLATFORM_ACCOUNT_ID);
        BigDecimal merchantPayables = ledgerRepository.sumCreditsByAccountType("MERCHANT_PAYABLE")
                .subtract(ledgerRepository.sumDebitsByAccountType("MERCHANT_PAYABLE"));
        BigDecimal merchantSettled = ledgerRepository.sumCreditsByAccountType("MERCHANT_SETTLED");
        BigDecimal pendingPayoutRequestAmount = payoutRequestJpaRepository
                .findByStatusOrderByCreatedAtDesc(PayoutRequestStatus.PENDING, Pageable.unpaged())
                .stream()
                .map(PayoutRequestEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return AdminFinanceSummaryResponse.builder()
                .platformEscrowBalance(escrowBalance)
                .platformRevenue(platformRevenue)
                .merchantPayableBalance(merchantPayables)
                .merchantSettledAmount(merchantSettled)
                .platformCommissionRate(settings.getPlatformCommissionRate())
                .ownerShareRate(ownerShareRate(settings))
                .minimumPayoutAmount(settings.getMinimumPayoutAmount())
                .pendingPayoutRequests(payoutRequestJpaRepository.countByStatus(PayoutRequestStatus.PENDING))
                .pendingPayoutRequestAmount(pendingPayoutRequestAmount)
                .build();
    }

    @Transactional
    public OwnerPayoutResponse settleOwnerPayout(Long ownerId, OwnerPayoutRequest request) {
        OwnerProfileEntity owner = ownerProfileJpaRepository.findByIdForUpdate(ownerId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Owner profile not found"));

        if (!hasCompletePayoutAccount(owner)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Owner payout account is not configured");
        }

        BigDecimal normalizedAmount = normalizeCurrencyAmount(request.getAmount());
        BigDecimal availableBalance = currentPayableBalance(ownerId);

        if (availableBalance.compareTo(normalizedAmount) < 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "Payout amount exceeds available balance");
        }

        String reference = buildPayoutReference(ownerId);
        TransactionLedger payout = ledgerService.recordOwnerPayout(
                ownerId,
                normalizedAmount,
                reference,
                hasText(request.getNote())
                        ? request.getNote().trim()
                        : "Manual payout to owner #" + ownerId);

        return OwnerPayoutResponse.builder()
                .ownerId(ownerId)
                .referenceId(reference)
                .amount(payout.getAmount())
                .remainingBalance(availableBalance.subtract(normalizedAmount))
                .bankName(owner.getBankName())
                .bankAccountNumber(owner.getBankAccountNumber())
                .bankAccountHolder(owner.getBankAccountHolder())
                .build();
    }

    @Transactional(readOnly = true)
    public FinanceSettingsResponse getFinanceSettings() {
        return toFinanceSettingsResponse(getOrCreateSettings());
    }

    @Transactional
    public FinanceSettingsResponse updateFinanceSettings(FinanceSettingsRequest request) {
        FinanceSettingsEntity settings = getOrCreateSettings();

        if (request.getPlatformCommissionRate() == null
                || request.getPlatformCommissionRate().compareTo(BigDecimal.ZERO) < 0
                || request.getPlatformCommissionRate().compareTo(BigDecimal.ONE) >= 0) {
            throw new BusinessException("Platform commission rate must be between 0 and 1");
        }

        if (request.getMinimumPayoutAmount() == null
                || request.getMinimumPayoutAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Minimum payout amount must be greater than 0");
        }

        settings.setPlatformCommissionRate(request.getPlatformCommissionRate().setScale(4, RoundingMode.HALF_UP));
        settings.setMinimumPayoutAmount(request.getMinimumPayoutAmount().setScale(2, RoundingMode.HALF_UP));

        return toFinanceSettingsResponse(financeSettingsJpaRepository.save(settings));
    }

    @Transactional
    public PayoutRequestResponse createOwnerPayoutRequest(User user, OwnerPayoutRequest request) {
        OwnerProfileEntity owner = ownerProfileJpaRepository.findByUserIdForUpdate(user.getId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Owner profile not found"));
        FinanceSettingsEntity settings = getOrCreateSettings();

        if (hasAnyPayoutAccountField(request)) {
            applyPayoutAccount(owner, request.getBankName(), request.getBankAccountNumber(), request.getBankAccountHolder());
            ownerProfileJpaRepository.save(owner);
        } else if (!owner.isPayoutEnabled() && hasCompletePayoutAccount(owner)) {
            owner.setPayoutEnabled(true);
            ownerProfileJpaRepository.save(owner);
        }

        if (!hasCompletePayoutAccount(owner)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Vui long cap nhat day du thong tin tai khoan ngan hang truoc khi rut tien");
        }

        BigDecimal normalizedAmount = normalizeCurrencyAmount(request.getAmount());
        validatePayoutAmount(owner.getId(), normalizedAmount, settings.getMinimumPayoutAmount(), null);

        PayoutRequestEntity payoutRequest = new PayoutRequestEntity();
        payoutRequest.setOwnerProfile(owner);
        payoutRequest.setAmount(normalizedAmount);
        payoutRequest.setStatus(PayoutRequestStatus.PENDING);
        payoutRequest.setOwnerNote(normalizeOptionalValue(request.getNote()));
        payoutRequest.setBankName(owner.getBankName());
        payoutRequest.setBankAccountNumber(owner.getBankAccountNumber());
        payoutRequest.setBankAccountHolder(owner.getBankAccountHolder());

        return toPayoutRequestResponse(payoutRequestJpaRepository.save(payoutRequest));
    }

    @Transactional(readOnly = true)
    public Page<PayoutRequestResponse> getOwnerPayoutRequests(User user, String status, int page, int size) {
        OwnerProfile owner = ownerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Owner profile not found"));
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PayoutRequestStatus payoutRequestStatus = parseStatus(status);

        Page<PayoutRequestEntity> requests = payoutRequestStatus == null
                ? payoutRequestJpaRepository.findByOwnerProfileIdOrderByCreatedAtDesc(owner.getId(), pageable)
                : payoutRequestJpaRepository.findByOwnerProfileIdAndStatusOrderByCreatedAtDesc(owner.getId(), payoutRequestStatus, pageable);

        return requests.map(this::toPayoutRequestResponse);
    }

    @Transactional(readOnly = true)
    public Page<PayoutRequestResponse> getAdminPayoutRequests(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PayoutRequestStatus payoutRequestStatus = parseStatus(status);
        Page<PayoutRequestEntity> requests = payoutRequestStatus == null
                ? payoutRequestJpaRepository.findAllByOrderByCreatedAtDesc(pageable)
                : payoutRequestJpaRepository.findByStatusOrderByCreatedAtDesc(payoutRequestStatus, pageable);
        return requests.map(this::toPayoutRequestResponse);
    }

    @Transactional(readOnly = true)
    public PayoutRequestResponse getAdminPayoutRequest(Long requestId) {
        return payoutRequestJpaRepository.findById(requestId)
                .map(this::toPayoutRequestResponse)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Payout request not found"));
    }

    @Transactional
    public OwnerPayoutResponse approvePayoutRequest(Long requestId, String note, User admin) {
        PayoutRequestEntity payoutRequest = payoutRequestJpaRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Payout request not found"));
        ensurePendingRequest(payoutRequest);

        OwnerProfileEntity owner = ownerProfileJpaRepository.findByIdForUpdate(payoutRequest.getOwnerProfile().getId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Owner profile not found"));

        OwnerPayoutRequest settleRequest = new OwnerPayoutRequest();
        settleRequest.setAmount(payoutRequest.getAmount());
        settleRequest.setNote(normalizeOptionalValue(note));
        OwnerPayoutResponse response = settleApprovedPayout(owner, payoutRequest, settleRequest);

        payoutRequest.setStatus(PayoutRequestStatus.APPROVED);
        payoutRequest.setAdminNote(normalizeOptionalValue(note));
        payoutRequest.setPayoutReference(response.getReferenceId());
        payoutRequest.setReviewedBy(userJpaRepository.getReferenceById(admin.getId()));
        payoutRequest.setReviewedAt(LocalDateTime.now());
        payoutRequestJpaRepository.save(payoutRequest);

        return response;
    }

    @Transactional
    public PayoutRequestResponse rejectPayoutRequest(Long requestId, String note, User admin) {
        PayoutRequestEntity payoutRequest = payoutRequestJpaRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Payout request not found"));
        ensurePendingRequest(payoutRequest);
        ownerProfileJpaRepository.findByIdForUpdate(payoutRequest.getOwnerProfile().getId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Owner profile not found"));

        payoutRequest.setStatus(PayoutRequestStatus.REJECTED);
        payoutRequest.setAdminNote(normalizeRequiredValue(note, "Vui long nhap ly do tu choi"));
        payoutRequest.setReviewedBy(userJpaRepository.getReferenceById(admin.getId()));
        payoutRequest.setReviewedAt(LocalDateTime.now());

        return toPayoutRequestResponse(payoutRequestJpaRepository.save(payoutRequest));
    }

    @Transactional(readOnly = true)
    public BigDecimal getPlatformCommissionRate() {
        return getOrCreateSettings().getPlatformCommissionRate();
    }

    @Transactional(readOnly = true)
    public BigDecimal getOwnerShareRate() {
        return ownerShareRate(getOrCreateSettings());
    }

    private void validatePayoutAmount(Long ownerId, BigDecimal amount, BigDecimal minimumPayoutAmount, Long excludedRequestId) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "So tien rut phai lon hon 0");
        }

        if (amount.compareTo(minimumPayoutAmount) < 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Payout amount is below the minimum payout amount");
        }

        BigDecimal availableBalance = currentPayableBalance(ownerId);
        BigDecimal pendingPayoutAmount = payoutRequestJpaRepository.sumAmountByOwnerProfileIdAndStatusExcludingRequest(
                ownerId,
                PayoutRequestStatus.PENDING,
                excludedRequestId
        );
        BigDecimal withdrawableBalance = availableBalance.subtract(pendingPayoutAmount);

        if (withdrawableBalance.compareTo(amount) < 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "Payout amount exceeds available balance");
        }
    }

    private FinanceSettingsEntity getOrCreateSettings() {
        return financeSettingsJpaRepository.findById(DEFAULT_SETTINGS_ID)
                .orElseGet(() -> {
                    FinanceSettingsEntity settings = new FinanceSettingsEntity();
                    settings.setId(DEFAULT_SETTINGS_ID);
                    settings.setPlatformCommissionRate(DEFAULT_COMMISSION_RATE);
                    settings.setMinimumPayoutAmount(DEFAULT_MINIMUM_PAYOUT);
                    return financeSettingsJpaRepository.save(settings);
                });
    }

    private FinanceSettingsResponse toFinanceSettingsResponse(FinanceSettingsEntity settings) {
        return FinanceSettingsResponse.builder()
                .platformCommissionRate(settings.getPlatformCommissionRate())
                .ownerShareRate(ownerShareRate(settings))
                .minimumPayoutAmount(settings.getMinimumPayoutAmount())
                .build();
    }

    private BigDecimal ownerShareRate(FinanceSettingsEntity settings) {
        return BigDecimal.ONE.subtract(settings.getPlatformCommissionRate()).setScale(4, RoundingMode.HALF_UP);
    }

    private PayoutRequestStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }

        try {
            return PayoutRequestStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Invalid payout status");
        }
    }

    private PayoutRequestResponse toPayoutRequestResponse(PayoutRequestEntity entity) {
        return PayoutRequestResponse.builder()
                .id(entity.getId())
                .ownerId(entity.getOwnerProfile() != null ? entity.getOwnerProfile().getId() : null)
                .ownerEmail(entity.getOwnerProfile() != null && entity.getOwnerProfile().getUser() != null
                        ? entity.getOwnerProfile().getUser().getEmail()
                        : null)
                .amount(entity.getAmount())
                .status(entity.getStatus() != null ? entity.getStatus().name() : null)
                .ownerNote(entity.getOwnerNote())
                .adminNote(entity.getAdminNote())
                .bankName(entity.getBankName())
                .bankAccountNumber(entity.getBankAccountNumber())
                .bankAccountHolder(entity.getBankAccountHolder())
                .payoutReference(entity.getPayoutReference())
                .reviewedByEmail(entity.getReviewedBy() != null ? entity.getReviewedBy().getEmail() : null)
                .reviewedAt(entity.getReviewedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private OwnerPayoutResponse settleApprovedPayout(
            OwnerProfileEntity owner,
            PayoutRequestEntity payoutRequest,
            OwnerPayoutRequest request) {
        BigDecimal availableBalance = currentPayableBalance(owner.getId());
        BigDecimal normalizedAmount = normalizeCurrencyAmount(request.getAmount());

        if (availableBalance.compareTo(normalizedAmount) < 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "Payout amount exceeds available balance");
        }

        String reference = buildPayoutReference(owner.getId());
        TransactionLedger payout = ledgerService.recordOwnerPayout(
                owner.getId(),
                normalizedAmount,
                reference,
                hasText(request.getNote())
                        ? request.getNote().trim()
                        : "Approved payout request #" + payoutRequest.getId());

        return OwnerPayoutResponse.builder()
                .ownerId(owner.getId())
                .referenceId(reference)
                .amount(payout.getAmount())
                .remainingBalance(availableBalance.subtract(normalizedAmount))
                .bankName(owner.getBankName())
                .bankAccountNumber(owner.getBankAccountNumber())
                .bankAccountHolder(owner.getBankAccountHolder())
                .build();
    }

    private void applyPayoutAccount(
            OwnerProfileEntity owner,
            String bankName,
            String bankAccountNumber,
            String bankAccountHolder) {
        owner.setBankName(normalizeRequiredValue(bankName, "Vui long nhap ten ngan hang"));
        owner.setBankAccountNumber(normalizeRequiredValue(bankAccountNumber, "Vui long nhap so tai khoan"));
        owner.setBankAccountHolder(normalizeRequiredValue(bankAccountHolder, "Vui long nhap ten chu tai khoan"));
        owner.setPayoutEnabled(true);
    }

    private boolean hasAnyPayoutAccountField(OwnerPayoutRequest request) {
        return hasText(request.getBankName())
                || hasText(request.getBankAccountNumber())
                || hasText(request.getBankAccountHolder());
    }

    private boolean hasCompletePayoutAccount(OwnerProfileEntity owner) {
        return hasText(owner.getBankName())
                && hasText(owner.getBankAccountNumber())
                && hasText(owner.getBankAccountHolder());
    }

    private void ensurePendingRequest(PayoutRequestEntity payoutRequest) {
        if (payoutRequest.getStatus() == PayoutRequestStatus.PENDING) {
            return;
        }

        String message = switch (payoutRequest.getStatus()) {
            case APPROVED -> "Payout request has already been approved";
            case REJECTED -> "Payout request has already been rejected";
            default -> "Payout request has already been reviewed";
        };
        throw new BusinessException(HttpStatus.CONFLICT, message);
    }

    private BigDecimal currentPayableBalance(Long ownerId) {
        return ledgerRepository.sumCreditsByAccount("MERCHANT_PAYABLE", ownerId)
                .subtract(ledgerRepository.sumDebitsByAccount("MERCHANT_PAYABLE", ownerId));
    }

    private BigDecimal normalizeCurrencyAmount(BigDecimal amount) {
        if (amount == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "So tien rut phai lon hon 0");
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private String buildPayoutReference(Long ownerId) {
        return "PAYOUT-" + ownerId + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private BigDecimal nonNegative(BigDecimal amount) {
        return amount.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : amount;
    }

    private String normalizeRequiredValue(String value, String message) {
        String normalized = normalizeOptionalValue(value);
        if (normalized == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, message);
        }
        return normalized;
    }

    private String normalizeOptionalValue(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private boolean hasText(String value) {
        return normalizeOptionalValue(value) != null;
    }
}
