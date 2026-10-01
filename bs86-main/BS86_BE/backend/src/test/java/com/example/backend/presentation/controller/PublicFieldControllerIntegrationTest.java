package com.example.backend.presentation.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PublicFieldControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getFieldDetail_returnsSeededFieldBySlug() throws Exception {
        mockMvc.perform(get("/api/public/fields/san-bong-da-thu-duc-a"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("San Bong Da Thu Duc A"))
                .andExpect(jsonPath("$.slug").value("san-bong-da-thu-duc-a"))
                .andExpect(jsonPath("$.openingHours").value("06:00 - 23:00"))
                .andExpect(jsonPath("$.phone").value("0901002001"));
    }

    @Test
    void getFields_returnsPublicFieldSummaries() throws Exception {
        mockMvc.perform(get("/api/public/fields"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slug").exists());
    }

    @Test
    void getMapMarkers_returnsRichMarkerDataWithoutTypeFilter() throws Exception {
        mockMvc.perform(get("/api/public/fields/map")
                        .param("minLat", "10.70")
                        .param("maxLat", "10.90")
                        .param("minLng", "106.55")
                        .param("maxLng", "106.85"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slug").exists())
                .andExpect(jsonPath("$[0].sportType").exists())
                .andExpect(jsonPath("$[0].openingHours").exists());
    }

    @Test
    void getMapMarkers_filtersByOptionalType() throws Exception {
        mockMvc.perform(get("/api/public/fields/map")
                        .param("minLat", "10.70")
                        .param("maxLat", "10.90")
                        .param("minLng", "106.55")
                        .param("maxLng", "106.85")
                        .param("type", "FOOTBALL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sportType").value("FOOTBALL"));
    }
}
