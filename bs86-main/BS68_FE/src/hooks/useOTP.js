import { useCallback, useEffect, useState } from 'react';
import { authApi } from '../api/authApi';

const OTP_TIMEOUT = 300;

function normalizeError(error) {
    return error?.response?.data?.message || error?.message || 'OTP request failed';
}

export const useOTP = () => {
    const [otp, setOtp] = useState('');
    const [timeLeft, setTimeLeft] = useState(OTP_TIMEOUT);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (isExpired || timeLeft <= 0) {
            setIsExpired(true);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((value) => value - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isExpired, timeLeft]);

    const resetTimer = useCallback(() => {
        setTimeLeft(OTP_TIMEOUT);
        setIsExpired(false);
    }, []);

    const handleOtpChange = useCallback((value) => {
        const normalizedValue = value.replace(/\D/g, '').slice(0, 6);
        setOtp(normalizedValue);
        setError('');
    }, []);

    const sendRegisterOtp = useCallback(
        async (email, password) => {
            setLoading(true);
            setError('');
            setSuccess(false);

            try {
                const data = await authApi.register({ email, password });
                resetTimer();
                setOtp('');
                return { success: true, data };
            } catch (err) {
                const message = normalizeError(err);
                setError(message);
                return { success: false, error: message };
            } finally {
                setLoading(false);
            }
        },
        [resetTimer]
    );

    const resendRegisterOtp = useCallback(
        async (email, password) => {
            setLoading(true);
            setError('');

            try {
                const data = await authApi.resendOTP({ email, password });
                resetTimer();
                setOtp('');
                return { success: true, data };
            } catch (err) {
                const message = normalizeError(err);
                setError(message);
                return { success: false, error: message };
            } finally {
                setLoading(false);
            }
        },
        [resetTimer]
    );

    const verifyRegisterOtp = useCallback(async (email, password, otpCode = otp) => {
        setLoading(true);
        setError('');

        try {
            const data = await authApi.verifyOTP({ email, password, otpCode });
            setSuccess(true);
            return { success: true, data };
        } catch (err) {
            const message = normalizeError(err);
            setError(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    }, [otp]);

    const sendResetOtp = useCallback(
        async (email) => {
            setLoading(true);
            setError('');
            setSuccess(false);

            try {
                const data = await authApi.requestPasswordReset({ email });
                resetTimer();
                setOtp('');
                return { success: true, data };
            } catch (err) {
                const message = normalizeError(err);
                setError(message);
                return { success: false, error: message };
            } finally {
                setLoading(false);
            }
        },
        [resetTimer]
    );

    const confirmResetOtp = useCallback(async (email, newPassword, otpCode = otp) => {
        setLoading(true);
        setError('');

        try {
            const data = await authApi.confirmPasswordReset({
                email,
                otpCode,
                newPassword
            });
            setSuccess(true);
            return { success: true, data };
        } catch (err) {
            const message = normalizeError(err);
            setError(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    }, [otp]);

    return {
        otp,
        timeLeft,
        loading,
        error,
        success,
        isExpired,
        handleOtpChange,
        resetTimer,
        sendRegisterOtp,
        resendRegisterOtp,
        verifyRegisterOtp,
        sendResetOtp,
        confirmResetOtp
    };
};
