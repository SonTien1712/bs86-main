package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.core.enums.OrderStatus;
import com.example.backend.infrastructure.persistence.jpa.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderJpaRepository extends JpaRepository<OrderEntity, Long> {

    List<OrderEntity> findByCustomerId(Long customerId);

    List<OrderEntity> findByCustomerIdAndStatus(Long customerId, OrderStatus status);

    List<OrderEntity> findByMerchantId(Long merchantId);

    List<OrderEntity> findByMerchantIdAndStatus(Long merchantId, OrderStatus status);

    long countByCustomerIdAndStatus(Long customerId, OrderStatus status);

    @Query("SELECT o FROM OrderEntity o " +
            "LEFT JOIN FETCH o.orderDetails " +
            "WHERE o.id = :orderId")
    Optional<OrderEntity> findByIdWithDetails(@Param("orderId") Long orderId);

    @Query("SELECT DISTINCT o FROM OrderEntity o " +
            "LEFT JOIN FETCH o.orderDetails " +
            "WHERE o.merchantId = :merchantId " +
            "ORDER BY o.createdAt DESC")
    List<OrderEntity> findByMerchantIdWithDetails(@Param("merchantId") Long merchantId);

    @Query("SELECT DISTINCT o FROM OrderEntity o " +
            "LEFT JOIN FETCH o.orderDetails " +
            "WHERE o.customerId = :customerId " +
            "ORDER BY o.createdAt DESC")
    List<OrderEntity> findByCustomerIdWithDetails(@Param("customerId") Long customerId);
}
