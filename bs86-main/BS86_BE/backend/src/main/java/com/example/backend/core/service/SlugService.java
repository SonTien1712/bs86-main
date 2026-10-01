package com.example.backend.core.service;

import com.example.backend.core.repository.FieldRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class SlugService {

    private static final int MAX_SLUG_LENGTH = 120;

    private final FieldRepository fieldRepository;

    public String generateUniqueSlug(String value) {
        String baseSlug = normalize(value);
        String candidate = baseSlug;
        int suffix = 2;

        while (fieldRepository.existsBySlug(candidate)) {
            candidate = appendSuffix(baseSlug, suffix++);
        }

        return candidate;
    }

    String normalize(String value) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException("Field name is required");
        }

        String slug = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('Đ', 'D')
                .replace('đ', 'd')
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("-{2,}", "-")
                .replaceAll("^-|-$", "");

        if (slug.isBlank()) {
            slug = "field";
        }

        if (slug.length() > MAX_SLUG_LENGTH) {
            slug = trimTrailingHyphen(slug.substring(0, MAX_SLUG_LENGTH));
        }

        return slug;
    }

    private String appendSuffix(String baseSlug, int suffix) {
        String suffixValue = "-" + suffix;
        int maxBaseLength = MAX_SLUG_LENGTH - suffixValue.length();
        String trimmedBase = baseSlug.length() > maxBaseLength
                ? trimTrailingHyphen(baseSlug.substring(0, maxBaseLength))
                : baseSlug;

        return trimmedBase + suffixValue;
    }

    private String trimTrailingHyphen(String value) {
        return value.replaceAll("-+$", "");
    }
}
