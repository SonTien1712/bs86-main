package com.example.backend.presentation.dto.response;

import com.example.backend.core.enums.CourtStatus;
import lombok.*;

import com.example.backend.core.enums.CourtStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerCourtResponse {
    private Long id;
    private Long fieldId;
    private Integer courtNumber;
    private String name;
    private CourtStatus status;  // ❌ Đang là String -> ✅ Sửa thành CourtStatus
    private boolean hasWeekdayTemplate;
    private boolean hasWeekendTemplate;
}
