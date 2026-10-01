package com.example.backend.infrastructure.config;

public class DataInitializer {
    /*
     * Legacy DataInitializer is intentionally disabled.
     * Keep the old source here as a rollback reference only.
     *
     * package com.example.backend.infrastructure.config;
     *
     * import com.example.backend.core.entity.Field;
     * import com.example.backend.core.entity.FieldDetail;
     * import com.example.backend.core.entity.OwnerProfile;
     * import com.example.backend.core.entity.OwnerVerification;
     * import com.example.backend.core.entity.User;
     * import com.example.backend.core.enums.FieldStatus;
     * import com.example.backend.core.enums.Role;
     * import com.example.backend.core.enums.SportType;
     * import com.example.backend.core.enums.UserStatus;
     * import com.example.backend.core.enums.VerificationStatus;
     * import com.example.backend.core.repository.FieldRepository;
     * import com.example.backend.core.repository.OwnerProfileRepository;
     * import com.example.backend.core.repository.OwnerVerificationRepository;
     * import com.example.backend.core.repository.UserRepository;
     * import lombok.RequiredArgsConstructor;
     * import org.springframework.boot.CommandLineRunner;
     * import org.springframework.context.annotation.Bean;
     * import org.springframework.context.annotation.Configuration;
     * import org.springframework.security.crypto.password.PasswordEncoder;
     *
     * @Configuration
     * @RequiredArgsConstructor
     * public class DataInitializer {
     *
     *     private final UserRepository userRepo;
     *     private final PasswordEncoder encoder;
     *     private final OwnerProfileRepository ownerProfileRepo;
     *     private final OwnerVerificationRepository ownerVerRepo;
     *     private final FieldRepository fieldRepo;
     *
     *     @Bean
     *     CommandLineRunner initAdmin() {
     *         return args -> userRepo.findByEmail("admin@gmail.com").ifPresentOrElse(
     *                 user -> System.out.println("[seed] Admin already exists"),
     *                 () -> {
     *                     User admin = new User();
     *                     admin.setEmail("admin@gmail.com");
     *                     admin.setPassword(encoder.encode("admin123"));
     *                     admin.setStatus(UserStatus.ACTIVE);
     *                     admin.addRole(Role.ADMIN);
     *                     userRepo.save(admin);
     *
     *                     System.out.println("[seed] Admin created: admin@gmail.com / admin123");
     *                 }
     *         );
     *     }
     *
     *     @Bean
     *     CommandLineRunner initOwner2() {
     *         return args -> userRepo.findByEmail("owner2@gmail.com").ifPresentOrElse(
     *                 user -> System.out.println("[seed] Owner 2 already exists"),
     *                 () -> {
     *                     OwnerProfile ownerProfile = createApprovedOwner(
     *                             "owner2@gmail.com",
     *                             "owner123",
     *                             "012345678912",
     *                             "https://example.com/license2.jpg"
     *                     );
     *
     *                     createField(
     *                             ownerProfile,
     *                             "San Pickleball Go Vap",
     *                             "45 Quang Trung, Go Vap, Ho Chi Minh City",
     *                             "san-pickleball-go-vap",
     *                             SportType.PICKLEBALL,
     *                             10.8385,
     *                             106.6680,
     *                             "Cum san pickleball phuc vu nguoi choi phong trao va giao huu hang ngay.",
     *                             "0909001001",
     *                             "06:00 - 22:00",
     *                             "Vui long den truoc 15 phut. Hoan lich truoc 2 gio.",
     *                             "https://images.unsplash.com/photo-1517649763962-0c623066013b"
     *                     );
     *
     *                     System.out.println("[seed] Owner 2 created with 1 public field");
     *                 }
     *         );
     *     }
     *
     *     @Bean
     *     CommandLineRunner initOwner() {
     *         return args -> userRepo.findByEmail("owner@gmail.com").ifPresentOrElse(
     *                 user -> System.out.println("[seed] Owner already exists"),
     *                 () -> {
     *                     OwnerProfile ownerProfile = createApprovedOwner(
     *                             "owner@gmail.com",
     *                             "owner123",
     *                             "012345678901",
     *                             "https://example.com/license.pdf"
     *                     );
     *
     *                     createField(
     *                             ownerProfile,
     *                             "San Bong Da Thu Duc A",
     *                             "123 Vo Van Ngan, Thu Duc, Ho Chi Minh City",
     *                             "san-bong-da-thu-duc-a",
     *                             SportType.FOOTBALL,
     *                             10.8509,
     *                             106.7717,
     *                             "San bong co nhan tao 7 nguoi, phu hop giao huu buoi toi va cuoi tuan.",
     *                             "0901002001",
     *                             "06:00 - 23:00",
     *                             "Dat coc 30 phan tram cho khung gio cao diem. Khong hut thuoc trong san.",
     *                             "https://images.unsplash.com/photo-1574629810360-7efbbe195018"
     *                     );
     *                 }
     *         );
     *     }
     *
     *     @Bean
     *     CommandLineRunner initUser() {
     *         return args -> userRepo.findByEmail("user@gmail.com").ifPresentOrElse(
     *                 user -> System.out.println("[seed] User already exists"),
     *                 () -> {
     *                     User user = new User();
     *                     user.setEmail("user@gmail.com");
     *                     user.setPassword(encoder.encode("user123"));
     *                     user.setStatus(UserStatus.ACTIVE);
     *                     user.addRole(Role.CUSTOMER);
     *                     userRepo.save(user);
     *
     *                     System.out.println("[seed] User created: user@gmail.com / user123");
     *                 }
     *         );
     *     }
     * }
     */
}
