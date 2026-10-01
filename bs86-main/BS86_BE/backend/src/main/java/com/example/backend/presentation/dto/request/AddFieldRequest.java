package com.example.backend.presentation.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class AddFieldRequest {

    private String fieldName;
    private String address;
    private String sportType;

    // giấy tờ
    private String landCertificateUrl;
    private String fieldImagesUrl;

    //map location
    private Double latitude;
    private Double longitude;
}