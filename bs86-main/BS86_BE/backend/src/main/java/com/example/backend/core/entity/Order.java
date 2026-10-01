package com.example.backend.core.entity;

import com.example.backend.core.enums.OrderStatus;
import com.example.backend.core.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {
    private Long id;
    private Long customerId;
    private Long merchantId;
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;
    private PaymentStatus paymentStatus;
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;
    private String momoTransactionId;
    @Builder.Default
    private List<OrderDetail> orderDetails = new ArrayList<>();
    @Builder.Default
    private Long createdAt = System.currentTimeMillis();
    @Builder.Default
    private Long updatedAt = System.currentTimeMillis();
    private Long cancelledAt;
    private Long completedAt;

    public void onUpdate() {
        this.updatedAt = System.currentTimeMillis();
    }

    public void addOrderDetail(OrderDetail orderDetail) {
        if (this.status != OrderStatus.PENDING) {
            throw new IllegalStateException(
                    "Cannot add order details to an order with status: " + this.status +
                            ". Only PENDING orders can have details added.");
        }
        orderDetail.setOrder(this);
        this.orderDetails.add(orderDetail);
        recalculateTotalAmount();
    }

    public void removeOrderDetail(OrderDetail orderDetail) {
        if (this.status != OrderStatus.PENDING) {
            throw new IllegalStateException(
                    "Cannot remove order details from an order with status: " + this.status +
                            ". Only PENDING orders can have details removed.");
        }
        this.orderDetails.remove(orderDetail);
        orderDetail.setOrder(null);
        recalculateTotalAmount();
    }

    public int getSlotCount() {
        return this.orderDetails.size();
    }

    public void recalculateTotalAmount() {
        this.totalAmount = this.orderDetails.stream()
                .map(OrderDetail::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public boolean canBeConfirmed() {
        return this.status == OrderStatus.PENDING && !this.orderDetails.isEmpty();
    }

    public boolean canBeCancelled() {
        return this.status == OrderStatus.PENDING || this.status == OrderStatus.CONFIRMED;
    }

    public void confirm() {
        if (!canBeConfirmed()) {
            throw new IllegalStateException(
                    "Cannot confirm order with status: " + this.status +
                            ". Only PENDING orders with OrderDetails can be confirmed.");
        }
        this.status = OrderStatus.CONFIRMED;
    }

    public void cancel() {
        if (!canBeCancelled()) {
            throw new IllegalStateException(
                    "Cannot cancel order with status: " + this.status +
                            ". Only PENDING or CONFIRMED orders can be cancelled.");
        }
        this.status = OrderStatus.CANCELLED;
        this.cancelledAt = System.currentTimeMillis();
    }

    public void complete() {
        if (this.status != OrderStatus.CONFIRMED) {
            throw new IllegalStateException(
                    "Cannot complete order with status: " + this.status +
                            ". Only CONFIRMED orders can be completed.");
        }
        this.status = OrderStatus.COMPLETED;
        this.completedAt = System.currentTimeMillis();
    }
}