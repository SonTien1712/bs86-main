package com.example.backend.core.service;

import com.example.backend.core.entity.Court;
import com.example.backend.core.entity.Field;
import com.example.backend.core.entity.OwnerProfile;
import com.example.backend.core.entity.SlotPriceOverride;
import com.example.backend.core.entity.User;
import com.example.backend.core.repository.CourtRepository;
import com.example.backend.core.repository.CourtSlotRepository;
import com.example.backend.core.repository.SlotPriceOverrideRepository;
import com.example.backend.core.repository.TimeSlotTemplateRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SlotServiceTest {

    @Mock
    private TimeSlotTemplateRepository templateRepo;

    @Mock
    private CourtSlotRepository slotRepo;

    @Mock
    private CourtRepository courtRepo;

    @Mock
    private SlotPriceOverrideRepository overrideRepo;

    @InjectMocks
    private SlotService slotService;

    @Test
    void overridePrice_updatesOnlySelectedTimes() {
        User owner = buildOwner(1L);
        Court court = buildCourt(owner, 10L);
        LocalDate date = LocalDate.of(2026, 3, 22);

        SlotPriceOverride existing = new SlotPriceOverride();
        existing.setId(99L);
        existing.setCourtId(10L);
        existing.setDate(date);
        existing.setStartTime(LocalTime.of(8, 0));
        existing.setOverridePrice(120000L);

        when(courtRepo.findById(10L)).thenReturn(Optional.of(court));
        when(overrideRepo.findByCourtIdAndDateAndStartTimes(
                eq(10L),
                eq(date),
                eq(List.of(LocalTime.of(8, 0), LocalTime.of(9, 0)))
        )).thenReturn(List.of(existing));

        slotService.overridePrice(
                10L,
                date,
                List.of(LocalTime.of(9, 0), LocalTime.of(8, 0), LocalTime.of(8, 0)),
                150000L,
                owner
        );

        verify(overrideRepo, never()).deleteByCourtIdAndDate(any(), any());
        verify(overrideRepo, never()).deleteByCourtIdAndDateAndStartTimes(any(), any(), any());

        ArgumentCaptor<SlotPriceOverride> captor = ArgumentCaptor.forClass(SlotPriceOverride.class);
        verify(overrideRepo, times(2)).save(captor.capture());

        List<SlotPriceOverride> saved = captor.getAllValues();
        assertEquals(LocalTime.of(8, 0), saved.get(0).getStartTime());
        assertEquals(Long.valueOf(150000L), saved.get(0).getOverridePrice());
        assertEquals(Long.valueOf(99L), saved.get(0).getId());

        assertEquals(LocalTime.of(9, 0), saved.get(1).getStartTime());
        assertEquals(Long.valueOf(150000L), saved.get(1).getOverridePrice());
    }

    @Test
    void overridePrice_withNullPrice_removesOnlySelectedTimes() {
        User owner = buildOwner(1L);
        Court court = buildCourt(owner, 10L);
        LocalDate date = LocalDate.of(2026, 3, 22);

        when(courtRepo.findById(10L)).thenReturn(Optional.of(court));

        slotService.overridePrice(
                10L,
                date,
                List.of(LocalTime.of(8, 0), LocalTime.of(10, 0)),
                null,
                owner
        );

        verify(overrideRepo).deleteByCourtIdAndDateAndStartTimes(
                10L,
                date,
                List.of(LocalTime.of(8, 0), LocalTime.of(10, 0))
        );
        verify(overrideRepo, never()).save(any());
    }

    @Test
    void overridePrice_rejectsNegativePrice() {
        User owner = buildOwner(1L);
        Court court = buildCourt(owner, 10L);

        when(courtRepo.findById(10L)).thenReturn(Optional.of(court));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> slotService.overridePrice(
                10L,
                LocalDate.of(2026, 3, 22),
                List.of(LocalTime.of(8, 0)),
                -1L,
                owner
        ));

        assertEquals("Price must be greater than or equal to 0", exception.getMessage());
    }

    private User buildOwner(Long userId) {
        User user = new User();
        user.setId(userId);
        return user;
    }

    private Court buildCourt(User ownerUser, Long courtId) {
        OwnerProfile ownerProfile = new OwnerProfile();
        ownerProfile.setUser(ownerUser);

        Field field = new Field();
        field.setOwner(ownerProfile);

        Court court = new Court();
        court.setId(courtId);
        court.setField(field);
        return court;
    }
}
