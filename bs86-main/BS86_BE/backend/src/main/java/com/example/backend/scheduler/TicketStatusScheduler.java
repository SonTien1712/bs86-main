package com.example.backend.scheduler;

import com.example.backend.core.service.ticket.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TicketStatusScheduler {

    private final TicketService ticketService;

    @Scheduled(fixedDelayString = "${ticket.expiration-check-delay-ms:60000}")
    public void expireTickets() {
        int expiredCount = ticketService.expireIssuedTickets();
        if (expiredCount > 0) {
            log.info("Expired {} tickets", expiredCount);
        }
    }
}
