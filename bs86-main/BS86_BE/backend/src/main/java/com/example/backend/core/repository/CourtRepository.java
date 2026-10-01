package com.example.backend.core.repository;

import com.example.backend.core.entity.Court;
import com.example.backend.core.entity.Field;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import java.util.List;

public interface CourtRepository {

    Court save(Court court);

    Optional<Court> findById(Long id);

    List<Court> findAll();

    boolean existsByFieldAndCourtNumber(Field field, Integer courtNumber);

    List<Court> findByFieldId(Long fieldId);

    List<Court> findAvailableCourtsByDate(LocalDate date);
}
