package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.Order;
import com.example.backend.core.enums.OrderStatus;
import com.example.backend.core.repository.OrderRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.OrderEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.OrderJpaRepository;
import com.example.backend.infrastructure.persistence.mapper.OrderMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class OrderRepositoryAdapter implements OrderRepository {

    private final OrderJpaRepository orderJpaRepository;
    private final OrderMapper orderMapper; // Giả định bạn đã có class Mapper này


    @Override
    public Order save(Order order) {
        return null;
    }

    @Override
    public Optional<Order> findById(Long id) {
        return Optional.empty();
    }

    @Override
    public List<Order> findAll() {
        return List.of();
    }

    @Override
    public void deleteById(Long id) {

    }

    @Override
    public List<Order> findByCustomerId(Long customerId) {
        return List.of();
    }

    @Override
    public List<Order> findByCustomerIdAndStatus(Long customerId, OrderStatus status) {
        return List.of();
    }

    @Override
    public List<Order> findByMerchantId(Long merchantId) {
        return List.of();
    }

    @Override
    public List<Order> findByMerchantIdAndStatus(Long merchantId, OrderStatus status) {
        return List.of();
    }

    @Override
    public long countByCustomerIdAndStatus(Long customerId, OrderStatus status) {
        return 0;
    }

    @Override
    public Optional<Order> findByIdWithDetails(Long orderId) {
        return Optional.empty();
    }

    @Override
    public List<Order> findByMerchantIdWithDetails(Long merchantId) {
        return List.of();
    }

    @Override
    public List<Order> findByCustomerIdWithDetails(Long customerId) {
        return List.of();
    }
}