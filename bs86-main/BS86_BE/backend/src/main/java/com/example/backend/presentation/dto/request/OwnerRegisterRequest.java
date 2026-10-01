package com.example.backend.presentation.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OwnerRegisterRequest {

    private String email;
    private String password;

    // owner
    private String ownerName;
    private String phoneNumber;

    // field
    private String fieldName;
    private String address;
    private String sportType;

    // documents
    private String idCardNumber;
    private String idCardFrontUrl;
    private String idCardBackUrl;
    private String businessLicenseUrl;
    private String landCertificateUrl;
    private String fieldImagesUrl;
    //map location
    private Double latitude;
    private Double longitude;


}

