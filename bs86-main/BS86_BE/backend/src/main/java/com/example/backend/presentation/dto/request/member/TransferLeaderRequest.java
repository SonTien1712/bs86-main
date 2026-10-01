package com.example.backend.presentation.dto.request.member;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TransferLeaderRequest {
    private Long targetUserId;
}
