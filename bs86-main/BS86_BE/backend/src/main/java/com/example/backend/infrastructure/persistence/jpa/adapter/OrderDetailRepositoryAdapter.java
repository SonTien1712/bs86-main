package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.OrderDetail;
import com.example.backend.core.repository.OrderDetailRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.OrderDetailEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.OrderDetailJpaRepository;
// Bạn nhớ import đúng đường dẫn Mapper của bạn nhé
import com.example.backend.infrastructure.persistence.mapper.OrderDetailMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class OrderDetailRepositoryAdapter implements OrderDetailRepository {

    private final OrderDetailJpaRepository orderDetailJpaRepository;
    private final OrderDetailMapper orderDetailMapper; // Dùng MapStruct để map OrderDetail <-> OrderDetailEntity

    @Override
    public OrderDetail save(OrderDetail orderDetail) {
        OrderDetailEntity entity = orderDetailMapper.toEntity(orderDetail);
        OrderDetailEntity savedEntity = orderDetailJpaRepository.save(entity);
        return orderDetailMapper.toDomain(savedEntity);
    }

    @Override
    public Optional<OrderDetail> findById(Long id) {
        return orderDetailJpaRepository.findById(id)
                .map(orderDetailMapper::toDomain);
    }

    @Override
    public List<OrderDetail> findAll() {
        return orderDetailJpaRepository.findAll().stream()
                .map(orderDetailMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteById(Long id) {
        orderDetailJpaRepository.deleteById(id);
    }

    @Override
    public List<OrderDetail> findByOrderId(Long orderId) {
        return orderDetailJpaRepository.findByOrderId(orderId).stream()
                .map(orderDetailMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<OrderDetail> findByCourtSlotId(Long courtSlotId) {
        return orderDetailJpaRepository.findByCourtSlotId(courtSlotId)
                .map(orderDetailMapper::toDomain);
    }

    @Override
    public List<OrderDetail> findByCourtId(Long courtId) {
        return orderDetailJpaRepository.findByCourtId(courtId).stream()
                .map(orderDetailMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderDetail> findByCourtIdAndBookingDate(Long courtId, LocalDate bookingDate) {
        return orderDetailJpaRepository.findByCourtIdAndBookingDate(courtId, bookingDate).stream()
                .map(orderDetailMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderDetail> findByFieldId(Long fieldId) {
        return orderDetailJpaRepository.findByFieldId(fieldId).stream()
                .map(orderDetailMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public BigDecimal calculateRevenueByCourtId(Long courtId) {
        // Các hàm tính toán số liệu (BigDecimal, long) không cần map, trả về trực tiếp
        return orderDetailJpaRepository.calculateRevenueByCourtId(courtId);
    }

    @Override
    public BigDecimal calculateRevenueByCourtIdAndDateRange(Long courtId, LocalDate startDate, LocalDate endDate) {
        return orderDetailJpaRepository.calculateRevenueByCourtIdAndDateRange(courtId, startDate, endDate);
    }

    @Override
    public BigDecimal calculateRevenueByMerchantId(Long merchantId) {
        return orderDetailJpaRepository.calculateRevenueByMerchantId(merchantId);
    }

    @Override
    public long countByCourtId(Long courtId) {
        return orderDetailJpaRepository.countByCourtId(courtId);
    }

    @Override
    public long countByCourtIdAndBookingDate(Long courtId, LocalDate bookingDate) {
        return orderDetailJpaRepository.countByCourtIdAndBookingDate(courtId, bookingDate);
    }

    @Override
    public List<OrderDetail> findByCustomerId(Long customerId) {
        return orderDetailJpaRepository.findByCustomerId(customerId).stream()
                .map(orderDetailMapper::toDomain)
                .collect(Collectors.toList());
    }
}