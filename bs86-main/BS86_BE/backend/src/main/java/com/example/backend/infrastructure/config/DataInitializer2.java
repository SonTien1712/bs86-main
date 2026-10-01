package com.example.backend.infrastructure.config;

import com.example.backend.core.entity.Court;
import com.example.backend.core.entity.Field;
import com.example.backend.core.entity.FieldDetail;
import com.example.backend.core.entity.OwnerProfile;
import com.example.backend.core.entity.OwnerVerification;
import com.example.backend.core.entity.TimeSlotTemplate;
import com.example.backend.core.entity.User;
import com.example.backend.core.enums.CourtStatus;
import com.example.backend.core.enums.DayType;
import com.example.backend.core.enums.FieldStatus;
import com.example.backend.core.enums.Role;
import com.example.backend.core.enums.SportType;
import com.example.backend.core.enums.UserStatus;
import com.example.backend.core.enums.VerificationStatus;
import com.example.backend.core.repository.CourtRepository;
import com.example.backend.core.repository.FieldRepository;
import com.example.backend.core.repository.OwnerProfileRepository;
import com.example.backend.core.repository.OwnerVerificationRepository;
import com.example.backend.core.repository.TimeSlotTemplateRepository;
import com.example.backend.core.repository.UserRepository;
import com.example.backend.core.service.SlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Configuration
@RequiredArgsConstructor
public class DataInitializer2 {
    private static final int SEEDED_SLOT_DAYS_AHEAD = 14;
    private static final String ADMIN_EMAIL = "admin@gmail.com";
    private static final String ADMIN_PASSWORD = "admin123";
    private static final String CUSTOMER_EMAIL = "user@gmail.com";
    private static final String CUSTOMER_PASSWORD = "user123";
    private static final String CUSTOMER_2_EMAIL = "user2@gmail.com";
    private static final String CUSTOMER_2_PASSWORD = "user123";

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final OwnerProfileRepository ownerProfileRepo;
    private final OwnerVerificationRepository ownerVerRepo;
    private final FieldRepository fieldRepo;
    private final CourtRepository courtRepo;
    private final TimeSlotTemplateRepository templateRepo;
    private final SlotService slotService;

    @Bean
    CommandLineRunner initExpandedSeedData() {
        return args -> {
            ensureAdmin();
            ensureCustomer();
            ensureCustomer2();

            OwnerProfile daNangOwner = ensureApprovedOwner(
                    "owner1@gmail.com",
                    "owner123",
                    "012345678901",
                    "https://example.com/licenses/owner1-da-nang.jpg"
            );

            OwnerProfile haNoiOwner = ensureApprovedOwner(
                    "owner2@gmail.com",
                    "owner123",
                    "012345678902",
                    "https://example.com/licenses/owner2-ha-noi.jpg"
            );

            OwnerProfile hoChiMinhOwner = ensureApprovedOwner(
                    "owner3@gmail.com",
                    "owner123",
                    "012345678903",
                    "https://example.com/licenses/owner3-ho-chi-minh.jpg"
            );

            seedFieldsForOwner(daNangOwner, "owner1@gmail.com", "da-nang", daNangFieldSpecs());
            seedFieldsForOwner(haNoiOwner, "owner2@gmail.com", "ha-noi", haNoiFieldSpecs());
            seedFieldsForOwner(hoChiMinhOwner, "owner3@gmail.com", "ho-chi-minh", hoChiMinhFieldSpecs());

            System.out.println("[seed2] Expanded seed complete: 3 owners, 30 active fields, 90 courts, weekday/weekend templates");
        };
    }

    private void ensureAdmin() {
        userRepo.findByEmail(ADMIN_EMAIL).ifPresentOrElse(
                user -> {
                    normalizeSeedAuthUser(user, ADMIN_PASSWORD, UserStatus.ACTIVE, Role.ADMIN);
                    System.out.println("[seed2] Admin already exists");
                },
                () -> {
                    User admin = new User();
                    admin.setEmail(ADMIN_EMAIL);
                    admin.setPassword(encoder.encode(ADMIN_PASSWORD));
                    admin.setStatus(UserStatus.ACTIVE);
                    admin.setProvider("EMAIL");
                    admin.setEmailVerified(true);
                    admin.setCreatedAt(LocalDateTime.now());
                    admin.setUpdatedAt(LocalDateTime.now());
                    admin.addRole(Role.ADMIN);
                    userRepo.save(admin);
                    System.out.println("[seed2] Admin created: " + ADMIN_EMAIL + " / " + ADMIN_PASSWORD);
                }
        );
    }

    private void ensureCustomer() {
        userRepo.findByEmail(CUSTOMER_EMAIL).ifPresentOrElse(
                user -> {
                    normalizeSeedAuthUser(user, CUSTOMER_PASSWORD, UserStatus.ACTIVE, Role.CUSTOMER);
                    System.out.println("[seed2] User already exists");
                },
                () -> {
                    User user = new User();
                    user.setEmail(CUSTOMER_EMAIL);
                    user.setPassword(encoder.encode(CUSTOMER_PASSWORD));
                    user.setStatus(UserStatus.ACTIVE);
                    user.setProvider("EMAIL");
                    user.setEmailVerified(true);
                    user.setCreatedAt(LocalDateTime.now());
                    user.setUpdatedAt(LocalDateTime.now());
                    user.addRole(Role.CUSTOMER);
                    userRepo.save(user);
                    System.out.println("[seed2] User created: " + CUSTOMER_EMAIL + " / " + CUSTOMER_PASSWORD);
                }
        );
    }

    private void ensureCustomer2() {
        userRepo.findByEmail(CUSTOMER_2_EMAIL).ifPresentOrElse(
                user -> {
                    normalizeSeedAuthUser(user, CUSTOMER_2_PASSWORD, UserStatus.ACTIVE, Role.CUSTOMER);
                    System.out.println("[seed2] User 2 already exists");
                },
                () -> {
                    User user = new User();
                    user.setEmail(CUSTOMER_2_EMAIL);
                    user.setPassword(encoder.encode(CUSTOMER_2_PASSWORD));
                    user.setStatus(UserStatus.ACTIVE);
                    user.setProvider("EMAIL");
                    user.setEmailVerified(true);
                    user.setCreatedAt(LocalDateTime.now());
                    user.setUpdatedAt(LocalDateTime.now());
                    user.addRole(Role.CUSTOMER);
                    userRepo.save(user);
                    System.out.println("[seed2] User 2 created: " + CUSTOMER_2_EMAIL + " / " + CUSTOMER_2_PASSWORD);
                }
        );
    }

    private OwnerProfile ensureApprovedOwner(
            String email,
            String password,
            String idCardNumber,
            String businessLicenseUrl
    ) {
        User ownerUser = userRepo.findByEmail(email).orElseGet(() -> {
            User owner = new User();
            owner.setEmail(email);
            owner.setPassword(encoder.encode(password));
            owner.setStatus(UserStatus.ACTIVE);
            owner.setProvider("EMAIL");
            owner.setEmailVerified(true);
            owner.setCreatedAt(LocalDateTime.now());
            owner.setUpdatedAt(LocalDateTime.now());
            owner.addRole(Role.OWNER);
            User saved = userRepo.save(owner);
            System.out.println("[seed2] Owner user created: " + email + " / " + password);
            return saved;
        });

        ownerUser = normalizeSeedAuthUser(ownerUser, password, UserStatus.ACTIVE, Role.OWNER);
        Long ownerUserId = ownerUser.getId();
        final User finalOwnerUser = ownerUser;

        OwnerProfile profile = ownerProfileRepo.findByUserId(ownerUserId).orElseGet(() -> {
            OwnerProfile newProfile = new OwnerProfile();
            newProfile.setUser(finalOwnerUser);
            System.out.println("[seed2] Owner profile created for: " + email);
            return ownerProfileRepo.save(newProfile);
        });

        OwnerVerification verification = ownerVerRepo.findByOwnerId(profile.getId()).orElseGet(() -> {
            OwnerVerification newVerification = new OwnerVerification();
            newVerification.setOwner(profile);
            return newVerification;
        });

        verification.setOwner(profile);
        verification.setIdCardNumber(idCardNumber);
        verification.setBusinessLicenseUrl(businessLicenseUrl);
        verification.setStatus(VerificationStatus.APPROVED);
        verification = ownerVerRepo.save(verification);

        profile.setVerification(verification);
        return profile;
    }

    private void seedFieldsForOwner(OwnerProfile owner, String ownerEmail, String citySlug, List<SeedFieldSpec> specs) {
        int index = 1;
        for (SeedFieldSpec spec : specs) {
            Field field = ensureField(owner, citySlug, spec, index);
            ensureCourtsAndTemplates(field);
            index++;
        }

        System.out.println("[seed2] Seeded " + specs.size() + " fields for " + ownerEmail);
    }

    private Field ensureField(OwnerProfile owner, String citySlug, SeedFieldSpec spec, int index) {
        String slug = slugify(spec.name() + "-" + citySlug);

        Field field = fieldRepo.findBySlug(slug).orElseGet(Field::new);
        FieldDetail detail = field.getDetail();

        if (detail == null) {
            detail = new FieldDetail();
        }

        field.setOwner(owner);
        field.setName(spec.name());
        field.setSlug(slug);
        field.setAddress(spec.address());
        field.setSportType(spec.sportType());
        field.setLatitude(spec.latitude());
        field.setLongitude(spec.longitude());
        field.setStatus(FieldStatus.ACTIVE);

        detail.setDescription(buildDescription(spec));
        detail.setPhone(buildPhone(citySlug, index));
        detail.setOpeningHours(buildOpeningHours(spec.sportType()));
        detail.setBookingPolicy(buildBookingPolicy(spec.sportType()));
        detail.setCoverImageUrl(buildCoverImage(spec.sportType()));
        field.setDetail(detail);

        return fieldRepo.save(field);
    }

    private void ensureCourtsAndTemplates(Field field) {
        Map<Integer, Court> courtsByNumber = new LinkedHashMap<>();
        for (Court existingCourt : courtRepo.findByFieldId(field.getId())) {
            courtsByNumber.put(existingCourt.getCourtNumber(), existingCourt);
        }

        for (int courtNumber = 1; courtNumber <= 3; courtNumber++) {
            Court court = courtsByNumber.get(courtNumber);

            if (court == null) {
                court = new Court();
                court.setField(field);
                court.setCourtNumber(courtNumber);
                court.setStatus(CourtStatus.ACTIVE.name());
                court = courtRepo.save(court);
            } else {
                court.setField(field);
                court.setStatus(CourtStatus.ACTIVE.name());
                court = courtRepo.save(court);
            }

            ensureTemplate(court, field.getSportType(), courtNumber, DayType.WEEKDAY);
            ensureTemplate(court, field.getSportType(), courtNumber, DayType.WEEKEND);
            ensureSeedSlots(court);
        }
    }

    private void ensureSeedSlots(Court court) {
        if (court == null || court.getId() == null) {
            return;
        }

        LocalDate startDate = LocalDate.now();
        for (int offset = 0; offset < SEEDED_SLOT_DAYS_AHEAD; offset++) {
            slotService.generateSlotsInternal(court, startDate.plusDays(offset));
        }
    }

    private void ensureTemplate(Court court, SportType sportType, int courtNumber, DayType dayType) {
        if (court == null || court.getId() == null || dayType == null || sportType == null) {
            return;
        }

        if (templateRepo.existsByCourtIdAndDayType(court.getId(), dayType)) {
            return;
        }

        TimeSlotTemplate template = new TimeSlotTemplate();

        template.setCourt(court);
        template.setDayType(dayType);
        template.setOpenTime(openTimeFor(sportType));
        template.setCloseTime(closeTimeFor(sportType, dayType));
        template.setSlotMinutes(slotMinutesFor(sportType));
        template.setBasePrice(basePriceFor(sportType, dayType, courtNumber));

        templateRepo.save(template);
    }

    private LocalTime openTimeFor(SportType sportType) {
        return switch (sportType) {
            case PICKLEBALL -> LocalTime.of(5, 30);
            case FOOTBALL, VOLLEYBALL, BASKETBALL -> LocalTime.of(5, 0);
        };
    }

    private LocalTime closeTimeFor(SportType sportType, DayType dayType) {
        return switch (sportType) {
            case FOOTBALL -> dayType == DayType.WEEKEND ? LocalTime.of(23, 30) : LocalTime.of(23, 0);
            case PICKLEBALL, VOLLEYBALL, BASKETBALL ->
                    dayType == DayType.WEEKEND ? LocalTime.of(22, 30) : LocalTime.of(22, 0);
        };
    }

    private int slotMinutesFor(SportType sportType) {
        return sportType == SportType.FOOTBALL ? 90 : 60;
    }

    private long basePriceFor(SportType sportType, DayType dayType, int courtNumber) {
        long base = switch (sportType) {
            case FOOTBALL -> 420_000L;
            case PICKLEBALL -> 180_000L;
            case VOLLEYBALL -> 170_000L;
            case BASKETBALL -> 200_000L;
        };

        if (dayType == DayType.WEEKEND) {
            base += sportType == SportType.FOOTBALL ? 80_000L : 30_000L;
        }

        return base + ((long) (courtNumber - 1) * 10_000L);
    }

    private String buildDescription(SeedFieldSpec spec) {
        return spec.name() + " la diem choi " + sportLabel(spec.sportType())
                + " phu hop tap luyen, giao huu va dat lich nhanh theo khung gio trong ngay.";
    }

    private String buildPhone(String citySlug, int index) {
        String prefix = switch (citySlug) {
            case "da-nang" -> "0905";
            case "ha-noi" -> "0904";
            case "ho-chi-minh" -> "0903";
            default -> "0900";
        };
        return prefix + String.format("%06d", index);
    }

    private String buildOpeningHours(SportType sportType) {
        LocalTime weekdayOpen = openTimeFor(sportType);
        LocalTime weekdayClose = closeTimeFor(sportType, DayType.WEEKDAY);
        LocalTime weekendOpen = openTimeFor(sportType);
        LocalTime weekendClose = closeTimeFor(sportType, DayType.WEEKEND);

        String weekdayRange = formatTimeRange(weekdayOpen, weekdayClose);
        String weekendRange = formatTimeRange(weekendOpen, weekendClose);

        if (weekdayRange.equals(weekendRange)) {
            return weekdayRange;
        }

        return "T2-T6 " + weekdayRange + " | T7-CN " + weekendRange;
    }

    private String formatTimeRange(LocalTime openTime, LocalTime closeTime) {
        return formatTime(openTime) + " - " + formatTime(closeTime);
    }

    private String formatTime(LocalTime time) {
        return String.format("%02d:%02d", time.getHour(), time.getMinute());
    }

    private String buildBookingPolicy(SportType sportType) {
        return switch (sportType) {
            case FOOTBALL -> "Dat coc 30 phan tram cho gio cao diem. Ho tro doi lich neu bao truoc 4 gio.";
            case PICKLEBALL -> "Den truoc 15 phut de nhan san. Hoan lich neu thong bao truoc 2 gio.";
            case VOLLEYBALL -> "Khong mang do an vao khu thi dau. Ho tro doi lich neu con slot trong.";
            case BASKETBALL -> "Giup giu ve sinh chung. Huy lich truoc 3 gio de duoc ho tro dat lai.";
        };
    }

    private String buildCoverImage(SportType sportType) {
        return switch (sportType) {
            case FOOTBALL -> "https://images.unsplash.com/photo-1574629810360-7efbbe195018";
            case PICKLEBALL -> "https://images.unsplash.com/photo-1517649763962-0c623066013b";
            case VOLLEYBALL -> "https://images.unsplash.com/photo-1547347298-4074fc3086f0";
            case BASKETBALL -> "https://images.unsplash.com/photo-1546519638-68e109498ffc";
        };
    }

    private String sportLabel(SportType sportType) {
        return switch (sportType) {
            case FOOTBALL -> "bong da";
            case PICKLEBALL -> "pickleball";
            case VOLLEYBALL -> "bong chuyen";
            case BASKETBALL -> "bong ro";
        };
    }

    private String slugify(String value) {
        return value.toLowerCase()
                .replace(".", "")
                .replace(",", "")
                .replace("/", "-")
                .replace(" ", "-");
    }

    private User normalizeSeedAuthUser(User user, String rawPassword, UserStatus status, Role role) {
        if (rawPassword != null && !rawPassword.isBlank()) {
            String currentPassword = user.getPassword();
            if (currentPassword == null || currentPassword.isBlank() || !encoder.matches(rawPassword, currentPassword)) {
                user.setPassword(encoder.encode(rawPassword));
            }
        }
        if (user.getStatus() != status) {
            user.setStatus(status);
        }
        if (user.getProvider() == null || user.getProvider().isBlank()) {
            user.setProvider("EMAIL");
        }
        if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
        }
        if (user.getCreatedAt() == null) {
            user.setCreatedAt(LocalDateTime.now());
        }
        user.setUpdatedAt(LocalDateTime.now());
        user.addRole(role);
        return userRepo.save(user);
    }

    private List<SeedFieldSpec> daNangFieldSpecs() {
        return List.of(
                new SeedFieldSpec("Bong Da Hai Chau", "12 Tran Phu, Hai Chau, Da Nang", SportType.FOOTBALL, 16.0678, 108.2208),
                new SeedFieldSpec("Pickleball Son Tra", "99 Ngo Quyen, Son Tra, Da Nang", SportType.PICKLEBALL, 16.0611, 108.2358),
                new SeedFieldSpec("Bong Ro Thanh Khe", "210 Dien Bien Phu, Thanh Khe, Da Nang", SportType.BASKETBALL, 16.0618, 108.2016),
                new SeedFieldSpec("Bong Chuyen Ngu Hanh Son", "88 Le Van Hien, Ngu Hanh Son, Da Nang", SportType.VOLLEYBALL, 16.0364, 108.2506),
                new SeedFieldSpec("Bong Da Cam Le", "150 Cach Mang Thang 8, Cam Le, Da Nang", SportType.FOOTBALL, 16.0325, 108.2249),
                new SeedFieldSpec("Pickleball Lien Chieu", "320 Nguyen Luong Bang, Lien Chieu, Da Nang", SportType.PICKLEBALL, 16.0758, 108.1452),
                new SeedFieldSpec("Bong Ro Hoa Xuan", "41 Chuong Duong, Hoa Xuan, Da Nang", SportType.BASKETBALL, 16.0249, 108.2334),
                new SeedFieldSpec("Bong Chuyen Hoa Khanh", "75 Ton Duc Thang, Hoa Khanh, Da Nang", SportType.VOLLEYBALL, 16.0837, 108.1517),
                new SeedFieldSpec("Pickleball My Khe", "17 Vo Nguyen Giap, My Khe, Da Nang", SportType.PICKLEBALL, 16.0555, 108.2468),
                new SeedFieldSpec("Bong Da An Thuong", "35 Chau Thi Vinh Te, An Thuong, Da Nang", SportType.FOOTBALL, 16.0461, 108.2443)
        );
    }

    private List<SeedFieldSpec> haNoiFieldSpecs() {
        return List.of(
                new SeedFieldSpec("Pickleball Cau Giay", "85 Tran Thai Tong, Cau Giay, Ha Noi", SportType.PICKLEBALL, 21.0368, 105.7906),
                new SeedFieldSpec("Bong Da Dong Da", "120 Tay Son, Dong Da, Ha Noi", SportType.FOOTBALL, 21.0136, 105.8264),
                new SeedFieldSpec("Bong Ro Thanh Xuan", "55 Nguyen Trai, Thanh Xuan, Ha Noi", SportType.BASKETBALL, 20.9967, 105.8098),
                new SeedFieldSpec("Bong Chuyen Tay Ho", "28 Xuan Dieu, Tay Ho, Ha Noi", SportType.VOLLEYBALL, 21.0631, 105.8245),
                new SeedFieldSpec("Pickleball Nam Tu Liem", "15 Le Duc Tho, Nam Tu Liem, Ha Noi", SportType.PICKLEBALL, 21.0283, 105.7648),
                new SeedFieldSpec("Bong Da Bac Tu Liem", "40 Pham Van Dong, Bac Tu Liem, Ha Noi", SportType.FOOTBALL, 21.0567, 105.7809),
                new SeedFieldSpec("Bong Ro Ha Dong", "66 Quang Trung, Ha Dong, Ha Noi", SportType.BASKETBALL, 20.9711, 105.7788),
                new SeedFieldSpec("Bong Chuyen Long Bien", "19 Nguyen Van Cu, Long Bien, Ha Noi", SportType.VOLLEYBALL, 21.0463, 105.8891),
                new SeedFieldSpec("Pickleball Hoang Mai", "105 Giai Phong, Hoang Mai, Ha Noi", SportType.PICKLEBALL, 20.9836, 105.8412),
                new SeedFieldSpec("Bong Da Hoan Kiem", "8 Trang Tien, Hoan Kiem, Ha Noi", SportType.FOOTBALL, 21.0245, 105.8571)
        );
    }

    private List<SeedFieldSpec> hoChiMinhFieldSpecs() {
        return List.of(
                new SeedFieldSpec("Bong Da Thu Duc", "123 Vo Van Ngan, Thu Duc, Ho Chi Minh City", SportType.FOOTBALL, 10.8509, 106.7717),
                new SeedFieldSpec("Pickleball Go Vap", "45 Quang Trung, Go Vap, Ho Chi Minh City", SportType.PICKLEBALL, 10.8385, 106.6680),
                new SeedFieldSpec("Bong Ro Tan Phu", "450 Luy Ban Bich, Tan Phu, Ho Chi Minh City", SportType.BASKETBALL, 10.7848, 106.6301),
                new SeedFieldSpec("Bong Chuyen Binh Thanh", "210 Dien Bien Phu, Binh Thanh, Ho Chi Minh City", SportType.VOLLEYBALL, 10.7991, 106.7070),
                new SeedFieldSpec("Pickleball Quan 7", "78 Nguyen Thi Thap, District 7, Ho Chi Minh City", SportType.PICKLEBALL, 10.7298, 106.7046),
                new SeedFieldSpec("Bong Da Tan Binh", "12 Hoang Hoa Tham, Tan Binh, Ho Chi Minh City", SportType.FOOTBALL, 10.8041, 106.6527),
                new SeedFieldSpec("Bong Ro Phu Nhuan", "95 Phan Xich Long, Phu Nhuan, Ho Chi Minh City", SportType.BASKETBALL, 10.7998, 106.6864),
                new SeedFieldSpec("Bong Chuyen Binh Tan", "320 Kinh Duong Vuong, Binh Tan, Ho Chi Minh City", SportType.VOLLEYBALL, 10.7653, 106.6056),
                new SeedFieldSpec("Pickleball Quan 3", "145 Cach Mang Thang 8, District 3, Ho Chi Minh City", SportType.PICKLEBALL, 10.7868, 106.6784),
                new SeedFieldSpec("Bong Da Nha Be", "25 Nguyen Huu Tho, Nha Be, Ho Chi Minh City", SportType.FOOTBALL, 10.6945, 106.7321)
        );
    }

    private record SeedFieldSpec(
            String name,
            String address,
            SportType sportType,
            double latitude,
            double longitude
    ) {
    }
}
