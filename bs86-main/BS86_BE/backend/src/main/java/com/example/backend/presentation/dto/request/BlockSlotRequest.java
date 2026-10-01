package com.example.backend.presentation.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class BlockSlotRequest {
    private List<Long> slotIds;


}