package com.example.backend.core.entity;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OwnerProfile {

    private Long id;

    private User user;

    private OwnerVerification verification;
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountHolder;
    private boolean payoutEnabled;
}
