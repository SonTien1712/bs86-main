package com.example.backend.presentation.dto.response;

import com.example.backend.core.entity.CustomerProfile;

import java.time.LocalDate;

public class CustomerProfileResponse {


    private Long id;
    private Long userId;
    private String fullName;
    private LocalDate dateOfBirth;
    private String phoneNumber;
    private String address;
    private String level;
    private String location;
    private String sportPreference;
    private String avatarUrl;

    public CustomerProfileResponse(CustomerProfile profile, Long actualUserId) {
        this.id = profile.getId();
        this.userId = actualUserId;
        this.fullName = profile.getFullName();
        this.dateOfBirth = profile.getDateOfBirth();
        this.phoneNumber = profile.getPhoneNumber();
        this.address = profile.getAddress();
        this.level = profile.getLevel();
        this.location = profile.getLocation();
        this.sportPreference = profile.getSportPreference();
        this.avatarUrl = profile.getAvatarUrl();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public String getSportPreference() {
        return sportPreference;
    }

    public void setSportPreference(String sportPreference) {
        this.sportPreference = sportPreference;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
}
