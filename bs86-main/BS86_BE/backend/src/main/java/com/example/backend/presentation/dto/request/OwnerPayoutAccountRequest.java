package com.example.backend.presentation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OwnerPayoutAccountRequest {
    @NotBlank(message = "Vui long nhap ten ngan hang")
    @Size(max = 255, message = "Ten ngan hang khong duoc vuot qua 255 ky tu")
    private String bankName;

    @NotBlank(message = "Vui long nhap so tai khoan")
    @Size(max = 255, message = "So tai khoan khong duoc vuot qua 255 ky tu")
    private String bankAccountNumber;

    @NotBlank(message = "Vui long nhap ten chu tai khoan")
    @Size(max = 255, message = "Chu tai khoan khong duoc vuot qua 255 ky tu")
    private String bankAccountHolder;
}
