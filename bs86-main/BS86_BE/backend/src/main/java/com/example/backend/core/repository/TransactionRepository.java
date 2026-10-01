package com.example.backend.core.repository;

import com.example.backend.core.entity.Transaction;
import com.example.backend.core.enums.TransactionStatus;

import java.util.List;
import java.util.Optional;

public interface TransactionRepository {
    Transaction save(Transaction transaction);

    Optional<Transaction> findById(Long id);

    Optional<Transaction> findByTransactionCode(String transactionCode);

    List<Transaction> findAll();

    List<Transaction> findByBookingId(Long bookingId);

    Optional<Transaction> findLatestByBookingId(Long bookingId);

    List<Transaction> findByUserId(Long userId);

    List<Transaction> findByStatus(TransactionStatus status);
}
