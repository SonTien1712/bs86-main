package com.example.backend.core.service;

import com.example.backend.core.entity.Booking;
import com.example.backend.core.entity.TransactionLedger;
import com.example.backend.core.repository.TransactionLedgerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class LedgerService {

    @Autowired
    private TransactionLedgerRepository ledgerRepository;

    /**
     * Ghi nhận thanh toán booking - Double entry
     * Customer trả 200k -> Platform nhận 10k commission, Merchant nhận 190k
     */
    @Transactional
    public void recordBookingPayment(Booking booking) {
        Long bookingId = booking.getId();
        BigDecimal totalAmount = BigDecimal.valueOf(booking.getTotalAmount());
        BigDecimal commission = BigDecimal.valueOf(booking.getPlatformCommission());
        BigDecimal merchantRevenue = BigDecimal.valueOf(booking.getMerchantRevenue());

        Long customerId = booking.getCustomer() != null ? booking.getCustomer().getId() : null;
        Long merchantId = booking.getOwnerProfile() != null ? booking.getOwnerProfile().getId() : null;

        // User pays into platform escrow through VNPay.
        TransactionLedger entry1 = new TransactionLedger();
        entry1.setBookingId(bookingId);
        entry1.setTransactionType("ESCROW_IN");
        entry1.setDebitAccountType("CUSTOMER");
        entry1.setDebitAccountId(customerId);
        entry1.setCreditAccountType("PLATFORM_ESCROW");
        entry1.setCreditAccountId(1L); // Platform account
        entry1.setAmount(totalAmount);
        entry1.setDescription("VNPay payment captured for booking #" + bookingId);
        entry1.setReferenceId(booking.getPaymentReference());
        entry1.setCreatedBy(SecurityUtils.getCurrentUserId());
        ledgerRepository.save(entry1);

        // Platform recognizes its commission from escrow.
        TransactionLedger entry2 = new TransactionLedger();
        entry2.setBookingId(bookingId);
        entry2.setTransactionType("COMMISSION");
        entry2.setDebitAccountType("PLATFORM_ESCROW");
        entry2.setDebitAccountId(1L);
        entry2.setCreditAccountType("PLATFORM_REVENUE");
        entry2.setCreditAccountId(1L);
        entry2.setAmount(commission);
        entry2.setDescription("Platform commission for booking #" + bookingId);
        entry2.setReferenceId(booking.getPaymentReference());
        entry2.setCreatedBy(SecurityUtils.getCurrentUserId());
        ledgerRepository.save(entry2);

        // The remaining amount becomes payable to the field owner.
        TransactionLedger entry3 = new TransactionLedger();
        entry3.setBookingId(bookingId);
        entry3.setTransactionType("OWNER_PAYABLE");
        entry3.setDebitAccountType("PLATFORM_ESCROW");
        entry3.setDebitAccountId(1L);
        entry3.setCreditAccountType("MERCHANT_PAYABLE");
        entry3.setCreditAccountId(merchantId);
        entry3.setAmount(merchantRevenue);
        entry3.setDescription("Owner payable created for booking #" + bookingId);
        entry3.setReferenceId(booking.getPaymentReference());
        entry3.setCreatedBy(SecurityUtils.getCurrentUserId());
        ledgerRepository.save(entry3);
    }

    /**
     * Ghi nhận hoàn tiền
     */
    @Transactional
    public void recordRefund(Booking booking) {
        // Reverse entries - ngược lại với lúc payment
        TransactionLedger refund1 = new TransactionLedger();
        refund1.setBookingId(booking.getId());
        refund1.setTransactionType("REFUND");
        refund1.setDebitAccountType("PLATFORM");
        refund1.setDebitAccountId(1L);
        refund1.setCreditAccountType("CUSTOMER");
        refund1.setCreditAccountId(booking.getCustomer() != null ? booking.getCustomer().getId() : null);
        refund1.setAmount(BigDecimal.valueOf(booking.getPlatformCommission()));
        refund1.setDescription("Refund commission for cancelled booking #" + booking.getId());
        refund1.setCreatedBy(SecurityUtils.getCurrentUserId());
        ledgerRepository.save(refund1);

        TransactionLedger refund2 = new TransactionLedger();
        refund2.setBookingId(booking.getId());
        refund2.setTransactionType("REFUND");
        refund2.setDebitAccountType("MERCHANT");
        refund2.setDebitAccountId(booking.getOwnerProfile() != null ? booking.getOwnerProfile().getId() : null);
        refund2.setCreditAccountType("CUSTOMER");
        refund2.setCreditAccountId(booking.getCustomer() != null ? booking.getCustomer().getId() : null);
        refund2.setAmount(BigDecimal.valueOf(booking.getMerchantRevenue()));
        refund2.setDescription("Refund payment for cancelled booking #" + booking.getId());
        refund2.setCreatedBy(SecurityUtils.getCurrentUserId());
        ledgerRepository.save(refund2);
    }

    @Transactional
    public TransactionLedger recordOwnerPayout(Long ownerProfileId, BigDecimal amount, String referenceId, String note) {
        TransactionLedger payout = new TransactionLedger();
        payout.setTransactionType("OWNER_PAYOUT");
        payout.setDebitAccountType("MERCHANT_PAYABLE");
        payout.setDebitAccountId(ownerProfileId);
        payout.setCreditAccountType("MERCHANT_SETTLED");
        payout.setCreditAccountId(ownerProfileId);
        payout.setAmount(amount);
        payout.setDescription(note);
        payout.setReferenceId(referenceId);
        payout.setCreatedBy(SecurityUtils.getCurrentUserId());
        return ledgerRepository.save(payout);
    }
}
