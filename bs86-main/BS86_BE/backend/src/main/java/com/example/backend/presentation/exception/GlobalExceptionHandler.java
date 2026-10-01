package com.example.backend.presentation.exception;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ✅ Giữ lại 1 method - dùng status từ exception (linh hoạt hơn)
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException ex) {
        HttpStatus status = ex.getStatus();
        return ResponseEntity.status(status)
                .body(new ErrorResponse(ex.getMessage(), status.value(), LocalDateTime.now()));
    }

    @ExceptionHandler(GroupDomainException.class)
    public ResponseEntity<ErrorResponse> handleGroupDomainException(GroupDomainException ex) {
        HttpStatus status = HttpStatus.BAD_REQUEST;
        String message = ex.getMessage();

        if (message != null && (message.contains("not found") || message.contains("Invalid invite"))) {
            status = HttpStatus.NOT_FOUND;
        } else if (message != null && message.contains("not allowed")) {
            status = HttpStatus.FORBIDDEN;
        }

        return ResponseEntity.status(status)
                .body(new ErrorResponse(message, status.value(), LocalDateTime.now()));
    }

    // ✅ Giữ lại 1 method xử lý validation
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> errors.put(e.getField(), e.getDefaultMessage()));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    @ExceptionHandler({
            ObjectOptimisticLockingFailureException.class,
            OptimisticLockingFailureException.class
    })
    public ResponseEntity<ErrorResponse> handleOptimisticLockingFailure(RuntimeException ex) {
        HttpStatus status = HttpStatus.CONFLICT;
        return ResponseEntity.status(status)
                .body(new ErrorResponse(
                        "Dữ liệu vừa được cập nhật bởi tiến trình khác. Vui lòng tải lại và thử lại.",
                        status.value(),
                        LocalDateTime.now()
                ));
    }

    // DB / infrastructure errors → 500 Internal Server Error (not 409 Conflict)
    // This catches "Table doesn't exist", connection issues, mapping errors, etc.
    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ErrorResponse> handleDataAccess(DataAccessException ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Lỗi hệ thống cơ sở dữ liệu.", 500, LocalDateTime.now()));
    }

    // Explicit business-logic conflicts (duplicate resource, state conflict, etc.)
    // Only explicit RuntimeExceptions thrown from business code land here.
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntime(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
    }
}
