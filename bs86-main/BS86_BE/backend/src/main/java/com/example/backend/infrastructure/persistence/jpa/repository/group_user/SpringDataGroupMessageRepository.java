package com.example.backend.infrastructure.persistence.jpa.repository.group_user;

import com.example.backend.infrastructure.persistence.jpa.entity.group_user.GroupMessageJpaEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpringDataGroupMessageRepository extends JpaRepository<GroupMessageJpaEntity, Long> {
    List<GroupMessageJpaEntity> findByGroupIdOrderByIdDesc(Long groupId, Pageable pageable);
    List<GroupMessageJpaEntity> findByGroupIdAndIdLessThanOrderByIdDesc(Long groupId, Long beforeMessageId, Pageable pageable);
}
