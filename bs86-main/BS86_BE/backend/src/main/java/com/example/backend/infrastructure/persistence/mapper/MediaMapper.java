package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.Media;
import com.example.backend.infrastructure.persistence.jpa.entity.MediaEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface MediaMapper {
    Media toDomain(MediaEntity entity);

    MediaEntity toEntity(Media domain);
}
