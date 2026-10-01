package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.Transaction;
import com.example.backend.core.enums.TransactionStatus;
import com.example.backend.core.repository.TransactionRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.BookingEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.TransactionEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.BookingJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.TransactionJpaRepository;
import com.example.backend.infrastructure.persistence.mapper.TransactionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class TransactionRepositoryAdapter implements TransactionRepository {

    private final TransactionJpaRepository jpaRepository;
    private final TransactionMapper transactionMapper;
    private final BookingJpaRepository bookingJpaRepository;

    @Override
    public Transaction save(Transaction transaction) {
        TransactionEntity entity = transactionMapper.toEntity(transaction);
        if (transaction.getBooking() != null) {
            entity.setBooking(bookingJpaRepository.getReferenceById(transaction.getBooking().getId()));
        }
        TransactionEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Transaction> findById(Long id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<Transaction> findByTransactionCode(String transactionCode) {
        return jpaRepository.findByTransactionCode(transactionCode).map(this::toDomain);
    }

    @Override
    public List<Transaction> findAll() {
        return jpaRepository.findAll().stream().map(this::toDomain).toList();
    }

    @Override
    public List<Transaction> findByBookingId(Long bookingId) {
        return jpaRepository.findByBooking_Id(bookingId).stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<Transaction> findLatestByBookingId(Long bookingId) {
        return jpaRepository.findTopByBooking_IdOrderByCreatedAtDesc(bookingId).map(this::toDomain);
    }

    @Override
    public List<Transaction> findByUserId(Long userId) {
        return jpaRepository.findByUserIdOrderByCreatedAtDesc(userId).stream().map(this::toDomain).toList();
    }

    @Override
    public List<Transaction> findByStatus(TransactionStatus status) {
        return jpaRepository.findByStatus(status).stream().map(this::toDomain).toList();
    }

    private Transaction toDomain(TransactionEntity entity) {
        Transaction domain = transactionMapper.toDomain(entity);
        BookingEntity bookingEntity = entity.getBooking();
        if (bookingEntity != null) {
            domain.setBooking(new com.example.backend.core.entity.Booking());
            domain.getBooking().setId(bookingEntity.getId());
        }
        return domain;
    }
}
