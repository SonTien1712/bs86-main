package com.example.backend.presentation.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PayoutReviewRequest {
    @Size(max = 500, message = "Ghi chu khong duoc vuot qua 500 ky tu")
    private String note;
}
