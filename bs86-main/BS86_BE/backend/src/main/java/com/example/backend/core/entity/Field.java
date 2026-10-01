package com.example.backend.core.entity;

import com.example.backend.core.enums.FieldStatus;
import com.example.backend.core.enums.SportType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Field {

    private Long id;
    private OwnerProfile owner;

    private String name;
    private String slug;
    private String address;

    @Enumerated(EnumType.STRING)
    private SportType sportType;

    private FieldStatus status;
    private FieldVerification verification;
    private FieldDetail detail;

    private Double latitude;
    private Double longitude;

//    public Long getId() {
//        return id;
//    }
//
//    public void setId(Long id) {
//        this.id = id;
//    }
//
//    public OwnerProfile getOwner() {
//        return owner;
//    }
//
//    public void setOwner(OwnerProfile owner) {
//        this.owner = owner;
//    }
//
//    public String getName() {
//        return name;
//    }
//
//    public void setName(String name) {
//        this.name = name;
//    }
//
//    public String getSlug() {
//        return slug;
//    }
//
//    public void setSlug(String slug) {
//        this.slug = slug;
//    }
//
//    public String getAddress() {
//        return address;
//    }
//
//    public void setAddress(String address) {
//        this.address = address;
//    }
//
//    public SportType getSportType() {
//        return sportType;
//    }
//
//    public void setSportType(SportType sportType) {
//        this.sportType = sportType;
//    }
//
//    public FieldStatus getStatus() {
//        return status;
//    }
//
//    public void setStatus(FieldStatus status) {
//        this.status = status;
//    }
//
//    public FieldVerification getVerification() {
//        return verification;
//    }
//
//    public void setVerification(FieldVerification verification) {
//        this.verification = verification;
//    }
//
//    public FieldDetail getDetail() {
//        return detail;
//    }
//
//    public void setDetail(FieldDetail detail) {
//        this.detail = detail;
//    }
//
//    public Double getLatitude() {
//        return latitude;
//    }
//
//    public void setLatitude(Double latitude) {
//        this.latitude = latitude;
//    }
//
//    public Double getLongitude() {
//        return longitude;
//    }
//
//    public void setLongitude(Double longitude) {
//        this.longitude = longitude;
//    }
}
