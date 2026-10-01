package com.example.backend.infrastructure.persistence.jpa.repositoryImpl;

import com.example.backend.infrastructure.persistence.mapper.FieldReportMapper;
import com.example.backend.presentation.dto.response.FieldReportResponse;
import com.example.backend.presentation.dto.response.FieldReportStat;
import com.example.backend.core.entity.FieldReport;
import com.example.backend.core.enums.ReportStatus;
import com.example.backend.core.repository.FieldReportRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.FieldReportJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class FieldReportRepositoryImpl implements FieldReportRepository {

    private final FieldReportJpaRepository jpaRepo;
    private final FieldReportMapper mapper;

    @Override
    public FieldReport save(FieldReport report) {
        return mapper.toDomain(
                jpaRepo.save(mapper.toEntity(report))
        );
    }

    @Override
    public Optional<FieldReport> findById(Long id) {
        return jpaRepo.findById(id)
                .map(mapper::toDomain);
    }


    @Override
    public Page<FieldReport> findByStatus(ReportStatus status, Pageable pageable) {
        return jpaRepo.findByStatus(status, pageable)
                .map(mapper::toDomain);
    }

    @Override
    public List<FieldReportStat> countReportsByField() {
        return jpaRepo.countReportsByField();
    }

    @Override
    public List<FieldReportResponse> findReportResponsesByStatus(ReportStatus status) {
        return jpaRepo.findReportResponsesByStatus(status);
    }

    @Override
    public long countByStatus(ReportStatus status) {
        return jpaRepo.countByStatus(status);
    }
}
