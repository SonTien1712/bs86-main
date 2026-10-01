package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.Booking;
import com.example.backend.infrastructure.persistence.jpa.entity.BookingEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BookingMapper {
    // Không map các trường audit vì type không khớp (domain dùng Long, entity dùng String)
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "court", ignore = true)
    @Mapping(target = "ownerProfile", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "deletedBy", ignore = true)
    Booking toDomain(BookingEntity entity);

    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "court", ignore = true)
    @Mapping(target = "ownerProfile", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "deletedBy", ignore = true)
    BookingEntity toEntity(Booking domain);
}
