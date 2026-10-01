package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.Post;
import com.example.backend.infrastructure.persistence.jpa.entity.PostEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PostMapper {
    Post toDomain(PostEntity entity);
    PostEntity toEntity(Post post);
}
