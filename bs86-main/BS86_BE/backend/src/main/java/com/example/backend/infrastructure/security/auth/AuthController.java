//package com.example.backend.infrastructure.security.auth;
//
//import com.example.backend.presentation.dto.request.CustomerRegisterRequest;
//import com.example.backend.presentation.dto.request.LoginRequest;
//import com.example.backend.presentation.dto.request.OwnerRegisterRequest;
//import com.example.backend.presentation.dto.response.ApiResponse;
//import com.example.backend.presentation.dto.response.AuthResponse;
//import lombok.RequiredArgsConstructor;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//@RestController
//@RequestMapping("/api/auth")
//@RequiredArgsConstructor
//@CrossOrigin
//public class AuthController {
//
//    private final AuthService authService;
//
//    // 🟢 Register Customer
//    @PostMapping("/register/customer")
//    public ResponseEntity<ApiResponse> registerCustomer(
//            @RequestBody CustomerRegisterRequest req
//    ) {
//        try {
//            authService.registerCustomer(req);
//            return ResponseEntity.ok(
//                    new ApiResponse("Customer registered successfully", null)
//            );
//        } catch (Exception e) {
//            return ResponseEntity.badRequest()
//                    .body(new ApiResponse(e.getMessage(), null));
//        }
//    }
//
//    @PostMapping("/register/owner")
//    public ResponseEntity<ApiResponse> registerOwner(
//            @RequestBody OwnerRegisterRequest req
//    ) {
//        authService.registerOwner(req);
//        return ResponseEntity.ok(
//                new ApiResponse("Owner registered. Waiting for approval", null)
//        );
//    }
//
//
//    // 🔐 Login
//    @PostMapping("/login")
//    public ResponseEntity<ApiResponse> login(
//            @RequestBody LoginRequest req
//    ) {
//        try {
//            AuthResponse auth = authService.login(req);
//            return ResponseEntity.ok(
//                    new ApiResponse("Login success", auth)
//            );
//        } catch (Exception e) {
//            return ResponseEntity.status(401)
//                    .body(new ApiResponse(e.getMessage(), null));
//        }
//    }
//}
