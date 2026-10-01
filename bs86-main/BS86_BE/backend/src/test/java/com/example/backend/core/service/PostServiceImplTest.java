package com.example.backend.core.service;

import com.example.backend.core.entity.Field;
import com.example.backend.core.entity.OwnerProfile;
import com.example.backend.core.entity.Post;
import com.example.backend.core.entity.User;
import com.example.backend.core.enums.PostCategory;
import com.example.backend.core.enums.PostStatus;
import com.example.backend.core.repository.FieldRepository;
import com.example.backend.core.repository.PostRepository;
import com.example.backend.core.service.impl.PostServiceImpl;
import com.example.backend.presentation.dto.request.CreatePostRequest;
import com.example.backend.presentation.dto.response.PostResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PostServiceImplTest {

    @Mock
    private PostRepository postRepository;

    @Mock
    private FieldRepository fieldRepository;

    @InjectMocks
    private PostServiceImpl postService;

    @Test
    void createPost_usesRequestedCategoryForOwnerField() {
        CreatePostRequest request = new CreatePostRequest();
        request.setFieldId(7L);
        request.setCategory(PostCategory.DEAL);
        request.setContent("Giam gia gio vang");

        when(fieldRepository.findById(7L)).thenReturn(Optional.of(buildField(7L, 5L)));
        when(postRepository.save(any(Post.class))).thenAnswer(invocation -> {
            Post post = invocation.getArgument(0);
            post.setId(100L);
            return post;
        });

        PostResponse response = postService.createPost(request, 5L);

        ArgumentCaptor<Post> captor = ArgumentCaptor.forClass(Post.class);
        verify(postRepository).save(captor.capture());

        assertEquals(PostCategory.DEAL, captor.getValue().getCategory());
        assertEquals("Giam gia gio vang", captor.getValue().getContent());
        assertEquals(PostCategory.DEAL, response.getCategory());
        assertEquals(Long.valueOf(100L), response.getId());
        assertNotNull(response.getCreatedAt());
    }

    @Test
    void createPost_rejectsFieldOwnedByAnotherOwner() {
        CreatePostRequest request = new CreatePostRequest();
        request.setFieldId(7L);
        request.setCategory(PostCategory.EMPTY_COURT);
        request.setContent("Con san trong");

        when(fieldRepository.findById(7L)).thenReturn(Optional.of(buildField(7L, 99L)));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> postService.createPost(request, 5L));

        assertEquals("You can only create posts for your own field", exception.getMessage());
    }

    private Field buildField(Long fieldId, Long ownerUserId) {
        User user = new User();
        user.setId(ownerUserId);

        OwnerProfile ownerProfile = new OwnerProfile();
        ownerProfile.setUser(user);

        Field field = new Field();
        field.setId(fieldId);
        field.setOwner(ownerProfile);
        return field;
    }
}
