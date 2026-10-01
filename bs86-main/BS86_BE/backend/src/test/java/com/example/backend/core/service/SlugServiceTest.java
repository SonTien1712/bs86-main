package com.example.backend.core.service;

import com.example.backend.core.repository.FieldRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SlugServiceTest {

    @Mock
    private FieldRepository fieldRepository;

    @InjectMocks
    private SlugService slugService;

    @Test
    void generateUniqueSlug_normalizesVietnameseTextWithHyphens() {
        when(fieldRepository.existsBySlug("san-bong-da-thu-duc")).thenReturn(false);

        String slug = slugService.generateUniqueSlug("Sân Bóng Đá Thủ Đức");

        assertEquals("san-bong-da-thu-duc", slug);
    }

    @Test
    void generateUniqueSlug_appendsNumericSuffixWhenConflictExists() {
        when(fieldRepository.existsBySlug("royal-sport")).thenReturn(true);
        when(fieldRepository.existsBySlug("royal-sport-2")).thenReturn(false);

        String slug = slugService.generateUniqueSlug("Royal Sport");

        assertEquals("royal-sport-2", slug);
    }
}
