package com.example.backend.core.repository;

import com.example.backend.core.entity.Order;
import com.example.backend.core.enums.OrderStatus;

import java.util.List;
import java.util.Optional;

public interface OrderRepository  {
        Order save(Order order);

        Optional<Order> findById(Long id);

        List<Order> findAll();

        void deleteById(Long id);

        List<Order> findByCustomerId(Long customerId);

        List<Order> findByCustomerIdAndStatus(Long customerId, OrderStatus status);

        List<Order> findByMerchantId(Long merchantId);

        List<Order> findByMerchantIdAndStatus(Long merchantId, OrderStatus status);

        long countByCustomerIdAndStatus(Long customerId, OrderStatus status);

        Optional<Order> findByIdWithDetails(Long orderId);

        List<Order> findByMerchantIdWithDetails(Long merchantId);

        List<Order> findByCustomerIdWithDetails(Long customerId);
}