package com.example.backend.core.service;

import com.example.backend.core.enums.OrderStatus;
import com.example.backend.core.enums.Role;
import com.example.backend.core.entity.CourtSlot;
import com.example.backend.core.entity.Order;
import com.example.backend.core.entity.OrderDetail;
import com.example.backend.core.entity.User;
import com.example.backend.core.repository.CourtSlotRepository;
import com.example.backend.core.repository.OrderRepository;
import com.example.backend.presentation.exception.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * OrderService
 *
 * Core business logic for order management in the booking system.
 * Implements transactional booking operations with double-booking prevention.
 *
 * Key responsibilities:
 * 1. Create orders and lock court slots atomically
 * 2. Confirm orders and transition slots to BOOKED status
 * 3. Cancel orders and release slots back to AVAILABLE
 * 4. Query orders by customer/merchant/status
 * 5. Manage slot lock expiration (cleanup job)
 *
 * Transaction Guarantees:
 * - All slot locking/releasing operations are atomic
 * - REPEATABLE_READ isolation prevents concurrent booking conflicts
 * - Database constraints ensure one OrderDetail per CourtSlot
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    // ĐÃ XÓA: private final OrderDetailRepository orderDetailRepository; (Để fix cảnh báo vàng)
    private final CourtSlotRepository courtSlotRepository;

    /**
     * Create a new order with multiple court slots.
     *
     * Business flow:
     * 1. Validate input (no duplicate slots, not empty)
     * 2. Load all CourtSlots from database
     * 3. Verify all slots are AVAILABLE
     * 4. Lock all slots atomically (AVAILABLE → LOCKED)
     * 5. Create Order entity (PENDING status)
     * 6. Create OrderDetails (snapshot prices from slots)
     * 7. Calculate order total
     * 8. Persist all changes in one transaction
     *
     * @param customerId the customer ID placing the order
     * @param merchantId the merchant ID who owns the courts
     * @param slotIds list of court slot IDs to book
     * @return the created order in PENDING status
     * @throws InvalidOrderCreationException if input validation fails
     * @throws CourtSlotNotFoundException if any slot doesn't exist
     * @throws SlotNotAvailableException if any slot is not AVAILABLE
     */
    @Transactional
    public Order createOrder(Long customerId, Long merchantId, List<Long> slotIds) {
        log.info("Creating order for customer {} with {} slots", customerId, slotIds.size());

        // Validation: Ensure slot list is not empty
        if (slotIds == null || slotIds.isEmpty()) {
            throw new InvalidOrderCreationException("Cannot create order with no court slots");
        }

        // Validation: Ensure no duplicate slots in the request
        Set<Long> uniqueSlots = new HashSet<>(slotIds);
        if (uniqueSlots.size() != slotIds.size()) {
            throw new InvalidOrderCreationException("Duplicate court slots detected in order");
        }

        // Load all court slots from database
        List<CourtSlot> courtSlots = courtSlotRepository.findAllById(slotIds);

        // Verify all requested slots exist
        if (courtSlots.size() != slotIds.size()) {
            Set<Long> foundIds = courtSlots.stream()
                    .map(CourtSlot::getId)
                    .collect(Collectors.toSet());
            Set<Long> missingIds = new HashSet<>(slotIds);
            missingIds.removeAll(foundIds);
            throw new CourtSlotNotFoundException(missingIds.iterator().next());
        }

        // Verify all slots are AVAILABLE (not already booked or locked)
        for (CourtSlot slot : courtSlots) {
            if (!slot.canBeLocked()) {
                throw new SlotNotAvailableException(slot.getId(), slot.getStatus().toString());
            }
        }

        // Lock all slots atomically
        for (CourtSlot slot : courtSlots) {
            slot.lock(); // AVAILABLE → LOCKED
        }
        courtSlotRepository.saveAll(courtSlots);

        // Create Order entity
        Order order = Order.builder()
                .customerId(customerId)
                .merchantId(merchantId)
                .status(OrderStatus.PENDING)
                .orderDetails(new ArrayList<>())
                .build();

        // Create OrderDetails (snapshot slot data at booking time)
        for (CourtSlot slot : courtSlots) {
            OrderDetail detail = OrderDetail.builder()
                    .order(order)
                    .courtSlotId(slot.getId())
                    .courtId(slot.getCourt().getId())
                    .fieldId(slot.getCourt().getField().getId())
                    .bookingDate(slot.getSlotDate())
                    .startTime(slot.getStartTime())
                    .endTime(slot.getEndTime())
                    .price(slot.getPrice()) // Snapshot price (immutable)
                    .build();

            order.addOrderDetail(detail);
        }

        // Persist order (cascade will save OrderDetails)
        Order savedOrder = orderRepository.save(order);

        // ĐÃ FIX: Lấy size() trực tiếp từ list orderDetails thay vì gọi getSlotCount()
        log.info("Order {} created successfully with {} slots", savedOrder.getId(), savedOrder.getOrderDetails().size());
        return savedOrder;
    }

    /**
     * Confirm a pending order.
     *
     * Business flow:
     * 1. Load order with all OrderDetails (eager fetch)
     * 2. Verify order is in PENDING status
     * 3. Reload all CourtSlots referenced by OrderDetails
     * 4. Verify all slots are still LOCKED (detect concurrent cancellation)
     * 5. Transition all slots LOCKED → BOOKED
     * 6. Transition order PENDING → CONFIRMED
     * 7. Persist changes
     *
     * @param orderId the order ID to confirm
     * @return the confirmed order
     * @throws OrderNotFoundException if order doesn't exist
     * @throws InvalidOrderStatusException if order is not PENDING
     * @throws IllegalStateException if any slot is not LOCKED (concurrent modification)
     */
    @Transactional
    public Order confirmOrder(Long orderId) {
        log.info("Confirming order {}", orderId);

        // Load order with OrderDetails (eager fetch to prevent N+1)
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        // Verify order can be confirmed
        if (!order.canBeConfirmed()) {
            throw new InvalidOrderStatusException(
                    "Cannot confirm order with status: " + order.getStatus()
            );
        }

        // Reload all CourtSlots (re-check status for concurrency safety)
        List<Long> slotIds = order.getOrderDetails().stream()
                .map(OrderDetail::getCourtSlotId)
                .toList();

        List<CourtSlot> courtSlots = courtSlotRepository.findAllById(slotIds);

        // Verify all slots are still LOCKED
        for (CourtSlot slot : courtSlots) {
            if (!slot.canBeBooked()) {
                throw new IllegalStateException(
                        "CourtSlot " + slot.getId() + " is not LOCKED. " +
                                "Current status: " + slot.getStatus() + ". " +
                                "Order may have been cancelled concurrently."
                );
            }
        }

        // Confirm booking: Transition all slots LOCKED → BOOKED
        for (CourtSlot slot : courtSlots) {
            slot.confirmBooking();
        }
        courtSlotRepository.saveAll(courtSlots);

        // Confirm order: PENDING → CONFIRMED
        order.confirm();
        Order confirmedOrder = orderRepository.save(order);

        log.info("Order {} confirmed successfully", confirmedOrder.getId());
        return confirmedOrder;
    }

    /**
     * Cancel an order and release all reserved slots.
     *
     * Business flow:
     * 1. Load order with OrderDetails
     * 2. Verify order can be cancelled
     * 3. Load all CourtSlots referenced by OrderDetails
     * 4. Release all slots (LOCKED/BOOKED → AVAILABLE)
     * 5. Cancel order (PENDING/CONFIRMED → CANCELLED)
     * 6. Persist changes
     *
     * @param orderId the order ID to cancel
     * @return the cancelled order
     * @throws OrderNotFoundException if order doesn't exist
     * @throws InvalidOrderStatusException if order cannot be cancelled
     */
    @Transactional
    public Order cancelOrder(Long orderId) {
        log.info("Cancelling order {}", orderId);

        // Load order with OrderDetails
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        // Verify order can be cancelled
        if (!order.canBeCancelled()) {
            throw new InvalidOrderStatusException(
                    "Cannot cancel order with status: " + order.getStatus()
            );
        }

        // Load all CourtSlots
        List<Long> slotIds = order.getOrderDetails().stream()
                .map(OrderDetail::getCourtSlotId)
                .toList();

        List<CourtSlot> courtSlots = courtSlotRepository.findAllById(slotIds);

        // Release all slots back to AVAILABLE
        for (CourtSlot slot : courtSlots) {
            if (slot.canBeReleased()) {
                slot.release(); // LOCKED/BOOKED → AVAILABLE
            }
        }
        courtSlotRepository.saveAll(courtSlots);

        // Cancel order
        order.cancel();
        Order cancelledOrder = orderRepository.save(order);

        log.info("Order {} cancelled successfully, {} slots released",
                cancelledOrder.getId(), courtSlots.size());
        return cancelledOrder;
    }

    /**
     * Get an order by ID.
     *
     * @param orderId the order ID
     * @return the order
     * @throws OrderNotFoundException if order doesn't exist
     */
    @Transactional(readOnly = true)
    public Order getOrderById(Long orderId) {
        log.info("Getting order {}", orderId);
        return orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));
    }

    /**
     * Get all orders for a customer (with OrderDetails eager-loaded).
     *
     * @param customerId the customer ID
     * @return list of orders
     */
    @Transactional(readOnly = true)
    public List<Order> getOrdersByCustomer(Long customerId) {
        return orderRepository.findByCustomerIdWithDetails(customerId);
    }

    @Transactional(readOnly = true)
    public List<Order> getOrdersByCustomer(User user) {

        log.info("Getting orders by customer {}", user.getId());

        if (!user.getRoles().stream()
                .anyMatch(r -> r.getRole() == Role.CUSTOMER)) {
            throw new AccessDeniedException("Not a customer");
        }
        return orderRepository.findByCustomerIdWithDetails(user.getId());
    }

    /**
     * Get all orders for a customer with a specific status.
     *
     * @param customerId the customer ID
     * @param status the order status
     * @return list of matching orders
     */
    @Transactional(readOnly = true)
    public List<Order> getOrdersByCustomerAndStatus(Long customerId, OrderStatus status) {
        return orderRepository.findByCustomerIdAndStatus(customerId, status);
    }

    /**
     * Get all orders for a merchant (with OrderDetails eager-loaded).
     *
     * @param merchantId the merchant ID
     * @return list of orders
     */
    @Transactional(readOnly = true)
    public List<Order> getOrdersByMerchant(Long merchantId) {
        log.info("Getting orders by merchant {}", merchantId);
        return orderRepository.findByMerchantIdWithDetails(merchantId);
    }

    /**
     * Get all CONFIRMED orders for a customer.
     * Useful for booking history and active reservations.
     *
     * @param customerId the customer ID
     * @return list of confirmed orders
     */
    @Transactional(readOnly = true)
    public List<Order> getConfirmedOrdersByCustomer(Long customerId) {
        return orderRepository.findByCustomerIdAndStatus(customerId, OrderStatus.CONFIRMED);
    }

    /**
     * Count confirmed orders for a customer.
     * Useful for loyalty metrics.
     *
     * @param customerId the customer ID
     * @return count of confirmed orders
     */
    @Transactional(readOnly = true)
    public long countConfirmedOrdersByCustomer(Long customerId) {
        return orderRepository.countByCustomerIdAndStatus(customerId, OrderStatus.CONFIRMED);
    }

    /**
     * Release expired locked slots (cleanup job).
     *
     * This method should be called periodically (e.g., every 10 minutes) to
     * release slots that have been LOCKED for too long without confirmation.
     *
     * Typical scenario:
     * - Customer adds slots to cart (slots become LOCKED)
     * - Customer abandons checkout
     * - After timeout (e.g., 15 minutes), this job releases the slots
     *
     * @param timeoutMinutes how long a slot can be locked before expiration
     * @return count of released slots
     */
    @Transactional
    public int releaseExpiredLockedSlots(int timeoutMinutes) {
        long timeThreshold = System.currentTimeMillis() - (timeoutMinutes * 60 * 1000L);

        List<CourtSlot> expiredSlots = courtSlotRepository.findExpiredLockedSlots(timeThreshold);

        if (expiredSlots.isEmpty()) {
            log.debug("No expired locked slots found");
            return 0;
        }

        log.info("Found {} expired locked slots, releasing...", expiredSlots.size());

        for (CourtSlot slot : expiredSlots) {
            slot.release(); // LOCKED → AVAILABLE
        }

        courtSlotRepository.saveAll(expiredSlots);

        log.info("Released {} expired locked slots", expiredSlots.size());
        return expiredSlots.size();
    }
}