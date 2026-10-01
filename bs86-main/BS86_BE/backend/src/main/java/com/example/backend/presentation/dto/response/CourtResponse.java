package com.example.backend.presentation.dto.response;


import lombok.Data;

@Data
public class CourtResponse {
    private Long id;
    private Integer courtNumber;
    private String status;
    private String fieldName;
    private String sportType;
    private String address;
}