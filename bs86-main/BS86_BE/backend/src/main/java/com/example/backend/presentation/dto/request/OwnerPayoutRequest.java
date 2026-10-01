package com.example.backend.presentation.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class OwnerPayoutRequest {
    @NotNull(message = "Vui long nhap so tien rut")
    @DecimalMin(value = "0.01", message = "So tien rut phai lon hon 0")
    @Digits(integer = 17, fraction = 2, message = "So tien rut khong hop le")
    private BigDecimal amount;

    @Size(max = 500, message = "Ghi chu khong duoc vuot qua 500 ky tu")
    private String note;

    @Size(max = 255, message = "Ten ngan hang khong duoc vuot qua 255 ky tu")
    private String bankName;

    @Size(max = 255, message = "So tai khoan khong duoc vuot qua 255 ky tu")
    private String bankAccountNumber;

    @Size(max = 255, message = "Chu tai khoan khong duoc vuot qua 255 ky tu")
    private String bankAccountHolder;
}
