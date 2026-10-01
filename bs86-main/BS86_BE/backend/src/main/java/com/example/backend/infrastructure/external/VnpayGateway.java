package com.example.backend.infrastructure.external;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class VnpayGateway {

    private static final ZoneId VNPAY_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter VNPAY_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    @Value("${payment.vnpay.pay-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String payUrl;

    @Value("${payment.vnpay.return-url:http://localhost:5173/payment-result}")
    private String returnUrl;

    @Value("${payment.vnpay.frontend-result-url:http://localhost:5173/payment-result}")
    private String frontendResultUrl;

    @Value("${payment.vnpay.tmn-code:}")
    private String tmnCode;

    @Value("${payment.vnpay.secret-key:}")
    private String secretKey;

    public String createPaymentUrl(VnpayPaymentRequest request) {
        if (tmnCode == null || tmnCode.isBlank() || secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("VNPay configuration is missing");
        }

        Map<String, String> params = initParams(
                request.transactionCode(),
                request.amount(),
                request.clientIp(),
                request.orderInfo());
        return buildPaymentUrl(params);
    }

    public VnpayCallbackResult parseCallback(Map<String, String> requestParams) {
        Map<String, String> params = new HashMap<>(requestParams);
        String secureHash = params.remove("vnp_SecureHash");
        params.remove("vnp_SecureHashType");

        String calculatedHash = hashAllFields(params);
        boolean validSignature = calculatedHash.equals(secureHash);
        boolean success = validSignature && "00".equals(params.get("vnp_ResponseCode"));
        String status = success ? "success" : "failed";

        return new VnpayCallbackResult(
                validSignature,
                success,
                params.get("vnp_TxnRef"),
                params.get("vnp_TransactionNo"),
                params.get("vnp_TransactionNo"),
                params.get("vnp_BankCode"),
                params.get("vnp_ResponseCode"),
                resolveResponseMessage(params.get("vnp_ResponseCode")),
                frontendResultUrl + "?status=" + status
        );
    }

    public String getIpAddress(HttpServletRequest request) {
        if (request == null) {
            return "127.0.0.1";
        }

        String ip = request.getHeader("X-FORWARDED-FOR");
        if (ip == null || ip.isBlank()) {
            ip = request.getRemoteAddr();
        }
        return (ip == null || ip.isBlank()) ? "127.0.0.1" : ip;
    }

    private Map<String, String> initParams(String transactionCode, long amount, String clientIp, String orderInfo) {
        Map<String, String> params = new LinkedHashMap<>();
        ZonedDateTime currentTime = ZonedDateTime.now(VNPAY_ZONE);
        ZonedDateTime expireTime = currentTime.plusMinutes(15);
        String createDate = currentTime.format(VNPAY_DATE_FORMATTER);
        String expireDate = expireTime.format(VNPAY_DATE_FORMATTER);
        String normalizedClientIp = clientIp != null && !clientIp.isBlank() ? clientIp : "127.0.0.1";

        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_Amount", String.valueOf(amount * 100));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", transactionCode);
        params.put("vnp_OrderInfo", orderInfo);
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", normalizedClientIp);
        params.put("vnp_CreateDate", createDate);
        params.put("vnp_ExpireDate", expireDate);

        log.info(
                "VNPay request timing: zone={}, serverNow={}, vnp_CreateDate={}, vnp_ExpireDate={}",
                VNPAY_ZONE,
                currentTime,
                createDate,
                expireDate
        );
        log.info(
                "VNPay request params: txnRef={}, amount={}, orderInfo={}, returnUrl={}, payUrl={}, clientIp={}",
                transactionCode,
                params.get("vnp_Amount"),
                orderInfo,
                returnUrl,
                payUrl,
                normalizedClientIp
        );
        return params;
    }

    private String buildPaymentUrl(Map<String, String> params) {
        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);
        StringBuilder query = new StringBuilder();
        boolean first = true;

        for (String fieldName : fieldNames) {
            String fieldValue = params.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                if (!first) {
                    query.append("&");
                }
                query.append(urlEncode(fieldName)).append("=").append(urlEncode(fieldValue));
                first = false;
            }
        }

        String paymentUrl = payUrl + "?" + query + "&vnp_SecureHash=" + hashAllFields(params);
        log.info("VNPay payment URL generated: {}", paymentUrl);
        return paymentUrl;
    }

    private String hashAllFields(Map<String, String> fields) {
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder builder = new StringBuilder();
        boolean first = true;

        for (String fieldName : fieldNames) {
            String fieldValue = fields.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                if (!first) {
                    builder.append("&");
                }
                builder.append(urlEncode(fieldName)).append("=").append(urlEncode(fieldValue));
                first = false;
            }
        }
        return hmacSHA512(secretKey, builder.toString());
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKeySpec);
            byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hash = new StringBuilder(bytes.length * 2);
            for (byte value : bytes) {
                hash.append(String.format("%02x", value & 0xff));
            }
            return hash.toString();
        } catch (Exception e) {
            throw new RuntimeException("Cannot sign VNPay payload", e);
        }
    }

    private String urlEncode(String input) {
        return URLEncoder.encode(input, StandardCharsets.UTF_8);
    }

    private String resolveResponseMessage(String responseCode) {
        if (responseCode == null) {
            return "Unknown payment response";
        }

        return switch (responseCode) {
            case "00" -> "Payment completed successfully";
            case "07" -> "Transaction is suspected of fraud";
            case "09" -> "Card or account has not been registered for internet banking";
            case "10" -> "Customer entered invalid authentication information too many times";
            case "11" -> "Payment timeout";
            case "12" -> "Card or account is locked";
            case "13" -> "Incorrect OTP";
            case "24" -> "Customer cancelled payment";
            case "51" -> "Insufficient account balance";
            case "65" -> "Transaction limit exceeded";
            case "75" -> "Bank is under maintenance";
            case "79" -> "Incorrect payment password entered too many times";
            case "99" -> "Unknown payment failure";
            default -> "Payment response code: " + responseCode;
        };
    }

    public record VnpayPaymentRequest(String transactionCode, long amount, String clientIp, String orderInfo) {}

    public record VnpayCallbackResult(
            boolean validSignature,
            boolean success,
            String transactionCode,
            String gatewayTransactionId,
            String gatewayReference,
            String bankCode,
            String responseCode,
            String responseMessage,
            String redirectUrl
    ) {}
}
