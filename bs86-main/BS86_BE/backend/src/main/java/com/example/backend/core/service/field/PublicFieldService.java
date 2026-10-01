package com.example.backend.core.service.field;

import com.example.backend.core.entity.Field;
import com.example.backend.core.enums.FieldStatus;
import com.example.backend.core.repository.FieldRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PublicFieldService {

    private final FieldRepository fieldRepository;

    @Transactional(readOnly = true)
    public List<Field> getActiveFields() {
        return fieldRepository.findByStatus(FieldStatus.ACTIVE);
    }

    @Transactional(readOnly = true)
    public Optional<Field> findActiveFieldBySlug(String slug) {
        return fieldRepository.findBySlug(slug)
                .filter(field -> field.getStatus() == FieldStatus.ACTIVE);
    }
}
