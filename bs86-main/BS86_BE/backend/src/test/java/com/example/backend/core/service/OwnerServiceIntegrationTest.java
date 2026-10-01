package com.example.backend.core.service;

import com.example.backend.core.entity.Field;
import com.example.backend.core.entity.User;
import com.example.backend.core.repository.FieldRepository;
import com.example.backend.core.repository.UserRepository;
import com.example.backend.presentation.dto.request.AddFieldRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
class OwnerServiceIntegrationTest {

    @Autowired
    private OwnerService ownerService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FieldRepository fieldRepository;

    @Test
    void addNewField_createsSlugAndDefaultDetail() {
        User owner = userRepository.findByEmail("owner@gmail.com")
                .orElseThrow();

        AddFieldRequest request = new AddFieldRequest();
        request.setFieldName("San Bong Ro Test Integration");
        request.setAddress("99 Test Street, Thu Duc, Ho Chi Minh City");
        request.setSportType("BASKETBALL");
        request.setLatitude(10.8891);
        request.setLongitude(106.7819);
        request.setLandCertificateUrl("https://example.com/test-land-certificate.jpg");
        request.setFieldImagesUrl("https://example.com/test-field-image.jpg");

        ownerService.addNewField(owner, request);

        Field savedField = fieldRepository.findBySlug("san-bong-ro-test-integration")
                .orElseThrow();

        assertEquals("San Bong Ro Test Integration", savedField.getName());
        assertNotNull(savedField.getDetail());
        assertEquals(savedField.getId(), savedField.getDetail().getFieldId());
        assertTrue(savedField.getSlug().startsWith("san-bong-ro-test-integration"));
    }
}
