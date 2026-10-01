import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Auth.css';
import OTPInput from '../../components/auth/OTPInput';
import GmailButton from '../../components/auth/GmailButton';
import OnboardingModal from '../../components/auth/OnboardingModal';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import {
    clearStoredAuthSession,
    getAuthToken,
    getPostLoginRoute,
    parseAuthFromToken,
} from '../../utils/auth';

const AUTH_MODES = ['login', 'register', 'verify', 'forgot', 'reset'];

function resolveMode(value) {
    return AUTH_MODES.includes(value) ? value : 'login';
}

function normalizeError(error, fallback) {
    const responseData = error?.response?.data;

    if (typeof responseData === 'string' && responseData.trim()) {
        return responseData;
    }

    if (responseData && typeof responseData === 'object') {
        if (typeof responseData.message === 'string' && responseData.message.trim()) {
            return responseData.message;
        }

        const fieldMessages = Object.values(responseData).filter(
            (value) => typeof value === 'string' && value.trim()
        );
        if (fieldMessages.length > 0) return fieldMessages.join(' ');
    }

    const rawMessage = error?.message || '';
    if (rawMessage.toLowerCase().includes('email not verified')) {
        return 'Email chưa xác thực. Vui lòng xác thực OTP trước khi đăng nhập.';
    }

    return rawMessage || fallback;
}

export default function AuthPage() {
    const navigate = useNavigate();
    const { login: authLogin, isAuthenticated, roles } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [mode, setMode] = useState(() => resolveMode(searchParams.get('mode')));
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState('');

    // ── Onboarding modal (shown after successful OTP verify) ──────────────────
    const [showOnboarding, setShowOnboarding] = useState(false);

    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [remember, setRemember] = useState(true);

    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

    const [verifyEmail, setVerifyEmail] = useState('');
    const [verifyPassword, setVerifyPassword] = useState('');
    const [verifyOtpCode, setVerifyOtpCode] = useState('');

    const [resetRequestEmail, setResetRequestEmail] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [resetOtpCode, setResetOtpCode] = useState('');
    const [resetPassword, setResetPassword] = useState('');
    const [resetConfirmPassword, setResetConfirmPassword] = useState('');

    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
    const [showVerifyPassword, setShowVerifyPassword] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

    // Redirect already-authenticated users
    // NOTE: Must call parseAuthFromToken() here — passing { roles } alone does NOT
    // include the rawIsOwner / isAdmin flags that getPostLoginRoute() checks.
    useEffect(() => {
        if (isAuthenticated) {
            navigate(getPostLoginRoute(parseAuthFromToken()), { replace: true });
        }
    }, [isAuthenticated, navigate, roles]);

    useEffect(() => {
        const nextMode = resolveMode(searchParams.get('mode'));
        if (nextMode !== mode) setMode(nextMode);
    }, [mode, searchParams]);

    const switchMode = (nextMode) => {
        setMode(nextMode);
        setSearchParams({ mode: nextMode }, { replace: true });
        setAlert(null);
    };

    const validateEmail = (value) => /\S+@\S+\.\S+/.test(value);

    const validatePassword = (value) => {
        if (!value || value.length < 6) return 'Mật khẩu tối thiểu 6 ký tự.';
        return '';
    };

    // ── Register ──────────────────────────────────────────────────────────────

    const handleRegister = async (event) => {
        event.preventDefault();
        setAlert(null);

        const email = registerEmail.trim();

        if (!validateEmail(email)) {
            setAlert({ type: 'error', text: 'Email không hợp lệ.' });
            return;
        }

        const passwordError = validatePassword(registerPassword);
        if (passwordError) {
            setAlert({ type: 'error', text: passwordError });
            return;
        }

        if (registerPassword !== registerConfirmPassword) {
            setAlert({ type: 'error', text: 'Mật khẩu xác nhận chưa khớp.' });
            return;
        }

        setLoading('register');

        try {
            const result = await authApi.register({ email, password: registerPassword });

            setVerifyEmail(email);
            setVerifyPassword(registerPassword);
            setVerifyOtpCode('');
            setLoginEmail(email);
            setLoginPassword(registerPassword);

            switchMode('verify');
            setAlert({ type: 'ok', text: result?.message || 'OTP sent to email' });
        } catch (error) {
            setAlert({ type: 'error', text: normalizeError(error, 'Không thể gửi OTP đăng ký.') });
        } finally {
            setLoading('');
        }
    };

    // ── Verify OTP → AUTO LOGIN → show onboarding modal ──────────────────────

    const handleVerify = async (event) => {
        event.preventDefault();
        setAlert(null);

        const email = verifyEmail.trim();

        if (!validateEmail(email)) {
            setAlert({ type: 'error', text: 'Email xác thực không hợp lệ.' });
            return;
        }

        const passwordError = validatePassword(verifyPassword);
        if (passwordError) {
            setAlert({ type: 'error', text: passwordError });
            return;
        }

        if (verifyOtpCode.length !== 6) {
            setAlert({ type: 'error', text: 'OTP phải gồm đúng 6 chữ số.' });
            return;
        }

        setLoading('verify');

        try {
            // 1. Call backend — now returns a JWT directly
            const result = await authApi.verifyOTP({
                email,
                otpCode: verifyOtpCode,
                password: verifyPassword,
            });

            const token = getAuthToken(result);

            if (token) {
                // 2. Persist session + update AuthContext
                authLogin(result, true);

                // 3. Show onboarding modal instead of navigating immediately
                setShowOnboarding(true);
            } else {
                // Backend didn't return a token yet — fall back to old behaviour
                setLoginEmail(email);
                setLoginPassword(verifyPassword);
                switchMode('login');
                setAlert({
                    type: 'ok',
                    text: `${result?.message || 'Account verified successfully'}. Bạn có thể đăng nhập ngay.`,
                });
            }
        } catch (error) {
            setAlert({ type: 'error', text: normalizeError(error, 'Xác thực OTP thất bại.') });
        } finally {
            setLoading('');
        }
    };

    // ── Onboarding modal callbacks ────────────────────────────────────────────

    const handleOnboardingYes = () => {
        setShowOnboarding(false);
        navigate('/profile', { replace: true });
    };

    const handleOnboardingNo = () => {
        setShowOnboarding(false);
        navigate('/home', { replace: true });
    };

    // ── Resend OTP ────────────────────────────────────────────────────────────

    const handleResendOtp = async () => {
        setAlert(null);

        const email = verifyEmail.trim();

        if (!validateEmail(email)) {
            setAlert({ type: 'error', text: 'Vui lòng nhập email hợp lệ để gửi lại OTP.' });
            return;
        }

        const passwordError = validatePassword(verifyPassword);
        if (passwordError) {
            setAlert({ type: 'error', text: 'Vui lòng nhập lại mật khẩu để gửi lại OTP.' });
            return;
        }

        setLoading('resend');

        try {
            const result = await authApi.resendOTP({ email, password: verifyPassword });
            setAlert({ type: 'ok', text: result?.message || 'OTP sent to email' });
        } catch (error) {
            setAlert({ type: 'error', text: normalizeError(error, 'Không thể gửi lại OTP.') });
        } finally {
            setLoading('');
        }
    };

    // ── Login ─────────────────────────────────────────────────────────────────

    const handleLogin = async (event) => {
        event.preventDefault();
        setAlert(null);

        const email = loginEmail.trim();

        if (!validateEmail(email)) {
            setAlert({ type: 'error', text: 'Email không hợp lệ.' });
            return;
        }

        const passwordError = validatePassword(loginPassword);
        if (passwordError) {
            setAlert({ type: 'error', text: passwordError });
            return;
        }

        setLoading('login');

        try {
            const result = await authApi.login({ email, password: loginPassword });
            const token = getAuthToken(result);

            if (token) {
                // ✅ FIX: Persist session trước, sau đó dùng parseAuthFromToken()
                // để đọc lại JWT với đầy đủ flags (isAdmin, rawIsOwner, isAuthenticated)
                authLogin(result, remember);
                navigate(getPostLoginRoute(parseAuthFromToken()), { replace: true });
                return;
            }

            clearStoredAuthSession();
            setAlert({
                type: 'warn',
                text: `${result?.message || 'Login successful'}. Backend auth hiện chưa trả token/JWT.`,
            });
        } catch (error) {
            setAlert({ type: 'error', text: normalizeError(error, 'Đăng nhập thất bại.') });
        } finally {
            setLoading('');
        }
    };

    // ── Google Login ──────────────────────────────────────────────────────────

    const handleGoogleSuccess = async ({ idToken }) => {
        setAlert(null);
        setLoading('google');

        try {
            const result = await authApi.googleLogin({ idToken });
            const token = getAuthToken(result);

            if (token) {
                // ✅ FIX: Tương tự handleLogin, dùng parseAuthFromToken() sau persist
                authLogin(result, true);
                navigate(getPostLoginRoute(parseAuthFromToken()), { replace: true });
                return;
            }

            clearStoredAuthSession();
            setAlert({
                type: 'warn',
                text: `${result?.message || 'Google login successful'}. Backend auth hiện chưa trả token/JWT.`,
            });
        } catch (error) {
            setAlert({ type: 'error', text: normalizeError(error, 'Google login thất bại.') });
        } finally {
            setLoading('');
        }
    };

    // ── Forgot password ───────────────────────────────────────────────────────

    const handleForgotPassword = async (event) => {
        event.preventDefault();
        setAlert(null);

        const email = resetRequestEmail.trim();

        if (!validateEmail(email)) {
            setAlert({ type: 'error', text: 'Email không hợp lệ.' });
            return;
        }

        setLoading('forgot');

        try {
            const result = await authApi.requestPasswordReset({ email });
            setResetEmail(email);
            setResetOtpCode('');
            setResetPassword('');
            setResetConfirmPassword('');
            switchMode('reset');
            setAlert({ type: 'ok', text: result?.message || 'Password reset OTP sent' });
        } catch (error) {
            setAlert({
                type: 'error',
                text: normalizeError(error, 'Không thể gửi OTP đặt lại mật khẩu.'),
            });
        } finally {
            setLoading('');
        }
    };

    // ── Reset password ────────────────────────────────────────────────────────

    const handleResetPassword = async (event) => {
        event.preventDefault();
        setAlert(null);

        const email = resetEmail.trim();

        if (!validateEmail(email)) {
            setAlert({ type: 'error', text: 'Email không hợp lệ.' });
            return;
        }

        if (resetOtpCode.length !== 6) {
            setAlert({ type: 'error', text: 'OTP phải gồm đúng 6 chữ số.' });
            return;
        }

        const passwordError = validatePassword(resetPassword);
        if (passwordError) {
            setAlert({ type: 'error', text: passwordError });
            return;
        }

        if (resetPassword !== resetConfirmPassword) {
            setAlert({ type: 'error', text: 'Mật khẩu xác nhận chưa khớp.' });
            return;
        }

        setLoading('reset');

        try {
            const result = await authApi.confirmPasswordReset({
                email,
                otpCode: resetOtpCode,
                newPassword: resetPassword,
            });

            setLoginEmail(email);
            setLoginPassword(resetPassword);
            switchMode('login');
            setAlert({
                type: 'ok',
                text: `${result?.message || 'Password reset successful'}. Bạn có thể đăng nhập với mật khẩu mới.`,
            });
        } catch (error) {
            setAlert({
                type: 'error',
                text: normalizeError(error, 'Đặt lại mật khẩu thất bại.'),
            });
        } finally {
            setLoading('');
        }
    };

    // ── Render helpers ────────────────────────────────────────────────────────

    const renderLogin = () => (
        <form className='form' onSubmit={handleLogin}>
            <div className='fieldRow'>
                <label>Email</label>
                <input
                    className='input'
                    type='email'
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder='you@example.com'
                    autoComplete='email'
                />
            </div>

            <div className='fieldRow'>
                <div className='labelRow'>
                    <label>Mật khẩu</label>
                    <button className='linkBtn' onClick={() => switchMode('forgot')} type='button'>
                        Quên mật khẩu?
                    </button>
                </div>
                <div className='passRow'>
                    <input
                        className='input'
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder='Nhập mật khẩu'
                        autoComplete='current-password'
                    />
                    <button
                        className='iconSquare'
                        type='button'
                        onClick={() => setShowLoginPassword((v) => !v)}
                    >
                        {showLoginPassword ? 'Ẩn' : 'Hiện'}
                    </button>
                </div>
            </div>

            <div className='actionsRow'>
                <label className='checkbox'>
                    <input
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        type='checkbox'
                    />
                    Ghi nhớ đăng nhập
                </label>
            </div>

            <button className='primaryBtn' disabled={loading === 'login'} type='submit'>
                {loading === 'login' ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
        </form>
    );

    const renderRegister = () => (
        <form className='form' onSubmit={handleRegister}>
            <div className='fieldRow'>
                <label>Email</label>
                <input
                    className='input'
                    type='email'
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder='you@example.com'
                    autoComplete='email'
                />
            </div>

            <div className='fieldRow'>
                <label>Mật khẩu</label>
                <div className='passRow'>
                    <input
                        className='input'
                        type={showRegisterPassword ? 'text' : 'password'}
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder='Tối thiểu 6 ký tự'
                        autoComplete='new-password'
                    />
                    <button
                        className='iconSquare'
                        type='button'
                        onClick={() => setShowRegisterPassword((v) => !v)}
                    >
                        {showRegisterPassword ? 'Ẩn' : 'Hiện'}
                    </button>
                </div>
            </div>

            <div className='fieldRow'>
                <label>Xác nhận mật khẩu</label>
                <div className='passRow'>
                    <input
                        className='input'
                        type={showRegisterConfirmPassword ? 'text' : 'password'}
                        value={registerConfirmPassword}
                        onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                        placeholder='Nhập lại mật khẩu'
                        autoComplete='new-password'
                    />
                    <button
                        className='iconSquare'
                        type='button'
                        onClick={() => setShowRegisterConfirmPassword((v) => !v)}
                    >
                        {showRegisterConfirmPassword ? 'Ẩn' : 'Hiện'}
                    </button>
                </div>
            </div>

            <button className='primaryBtn' disabled={loading === 'register'} type='submit'>
                {loading === 'register' ? 'Đang gửi OTP...' : 'Tạo tài khoản'}
            </button>
        </form>
    );

    const renderVerify = () => (
        <form className='form' onSubmit={handleVerify}>
            <div className='fieldRow'>
                <label>Email</label>
                <input
                    className='input'
                    type='email'
                    value={verifyEmail}
                    onChange={(e) => setVerifyEmail(e.target.value)}
                    placeholder='you@example.com'
                    autoComplete='email'
                />
            </div>

            <div className='fieldRow'>
                <label>Mật khẩu</label>
                <div className='passRow'>
                    <input
                        className='input'
                        type={showVerifyPassword ? 'text' : 'password'}
                        value={verifyPassword}
                        onChange={(e) => setVerifyPassword(e.target.value)}
                        placeholder='Nhập lại mật khẩu'
                        autoComplete='new-password'
                    />
                    <button
                        className='iconSquare'
                        type='button'
                        onClick={() => setShowVerifyPassword((v) => !v)}
                    >
                        {showVerifyPassword ? 'Ẩn' : 'Hiện'}
                    </button>
                </div>
            </div>

            <div className='fieldRow'>
                <div className='labelRow'>
                    <label>Mã OTP</label>
                    <span className='helper'>Mã 6 số</span>
                </div>
                <OTPInput value={verifyOtpCode} onChange={setVerifyOtpCode} disabled={loading === 'verify'} />
            </div>

            <div className='stackButtons'>
                <button className='primaryBtn' disabled={loading === 'verify'} type='submit'>
                    {loading === 'verify' ? 'Đang xác thực...' : 'Xác thực'}
                </button>
                <button
                    className='secondaryBtn'
                    disabled={loading === 'resend' || loading === 'verify'}
                    onClick={handleResendOtp}
                    type='button'
                >
                    {loading === 'resend' ? 'Đang gửi lại OTP...' : 'Gửi lại OTP'}
                </button>
            </div>
        </form>
    );

    const renderForgot = () => (
        <form className='form' onSubmit={handleForgotPassword}>
            <div className='fieldRow'>
                <label>Email</label>
                <input
                    className='input'
                    type='email'
                    value={resetRequestEmail}
                    onChange={(e) => setResetRequestEmail(e.target.value)}
                    placeholder='you@example.com'
                    autoComplete='email'
                />
            </div>

            <button className='primaryBtn' disabled={loading === 'forgot'} type='submit'>
                {loading === 'forgot' ? 'Đang gửi OTP...' : 'Gửi OTP'}
            </button>
        </form>
    );

    const renderReset = () => (
        <form className='form' onSubmit={handleResetPassword}>
            <div className='fieldRow'>
                <label>Email</label>
                <input
                    className='input'
                    type='email'
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder='you@example.com'
                    autoComplete='email'
                />
            </div>

            <div className='fieldRow'>
                <label>Mã OTP</label>
                <OTPInput value={resetOtpCode} onChange={setResetOtpCode} disabled={loading === 'reset'} />
            </div>

            <div className='fieldRow'>
                <label>Mật khẩu mới</label>
                <div className='passRow'>
                    <input
                        className='input'
                        type={showResetPassword ? 'text' : 'password'}
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        placeholder='Nhập mật khẩu mới'
                        autoComplete='new-password'
                    />
                    <button
                        className='iconSquare'
                        type='button'
                        onClick={() => setShowResetPassword((v) => !v)}
                    >
                        {showResetPassword ? 'Ẩn' : 'Hiện'}
                    </button>
                </div>
            </div>

            <div className='fieldRow'>
                <label>Xác nhận mật khẩu mới</label>
                <div className='passRow'>
                    <input
                        className='input'
                        type={showResetConfirmPassword ? 'text' : 'password'}
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        placeholder='Nhập lại mật khẩu mới'
                        autoComplete='new-password'
                    />
                    <button
                        className='iconSquare'
                        type='button'
                        onClick={() => setShowResetConfirmPassword((v) => !v)}
                    >
                        {showResetConfirmPassword ? 'Ẩn' : 'Hiện'}
                    </button>
                </div>
            </div>

            <button className='primaryBtn' disabled={loading === 'reset'} type='submit'>
                {loading === 'reset' ? 'Đang đặt lại mật khẩu...' : 'Xác nhận'}
            </button>
        </form>
    );

    const isPrimaryMode = mode === 'login' || mode === 'register';
    const titleMap = {
        login: 'Đăng nhập',
        register: 'Đăng ký',
        verify: 'Xác thực OTP',
        forgot: 'Quên mật khẩu',
        reset: 'Đặt lại mật khẩu',
    };
    const descriptionMap = {
        login: 'Đăng nhập để tiếp tục.',
        register: 'Tạo tài khoản mới.',
        verify: 'Nhập OTP để xác thực tài khoản.',
        forgot: 'Nhập email để nhận mã OTP.',
        reset: 'Đặt lại mật khẩu của bạn.',
    };

    return (
        <div className='authPage'>
            <div className='authBackdrop' />

            <div className='authCard'>
                <div className='authPanel'>
                    <div className='brandBadge'>BS86 Auth</div>

                    <div className='authHeader'>
                        <div>
                            <h1>{titleMap[mode]}</h1>
                            <p>{descriptionMap[mode]}</p>
                        </div>

                        {isPrimaryMode ? (
                            <div className='authTabs'>
                                <button
                                    className={`tabBtn ${mode === 'login' ? 'active' : ''}`}
                                    onClick={() => switchMode('login')}
                                    type='button'
                                >
                                    Đăng nhập
                                </button>
                                <button
                                    className={`tabBtn ${mode === 'register' ? 'active' : ''}`}
                                    onClick={() => switchMode('register')}
                                    type='button'
                                >
                                    Đăng ký
                                </button>
                            </div>
                        ) : (
                            <button className='ghostBtn' onClick={() => switchMode('login')} type='button'>
                                Quay lại
                            </button>
                        )}
                    </div>

                    {alert ? <div className={`alert ${alert.type}`}>{alert.text}</div> : null}

                    {mode === 'login'    ? renderLogin()    : null}
                    {mode === 'register' ? renderRegister() : null}
                    {mode === 'verify'   ? renderVerify()   : null}
                    {mode === 'forgot'   ? renderForgot()   : null}
                    {mode === 'reset'    ? renderReset()    : null}

                    <div className='authDivider'>
                        <span>Google</span>
                    </div>

                    <GmailButton
                        loading={loading === 'google'}
                        onError={(message) =>
                            setAlert({ type: 'error', text: message || 'Google login thất bại.' })
                        }
                        onSuccess={handleGoogleSuccess}
                    />

                    <div className='footerLinks'>
                        <button className='linkBtn' onClick={() => switchMode('register')} type='button'>
                            Chưa có tài khoản?
                        </button>
                        <button className='linkBtn' onClick={() => switchMode('verify')} type='button'>
                            Đã có OTP xác thực?
                        </button>
                        <button className='linkBtn' onClick={() => switchMode('forgot')} type='button'>
                            Cần đặt lại mật khẩu?
                        </button>
                    </div>

                    <div
                        style={{
                            marginTop: 16,
                            padding: '12px 16px',
                            borderRadius: 12,
                            background: 'rgba(22,163,74,0.08)',
                            border: '1px solid rgba(22,163,74,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                        }}
                    >
                        <span style={{ fontSize: 13, color: '#a6b8d0' }}>Bạn muốn quản lý sân bóng?</span>
                        <button
                            type='button'
                            onClick={() => navigate('/register-owner')}
                            style={{
                                padding: '6px 14px',
                                borderRadius: 8,
                                border: '1px solid rgba(22,163,74,0.4)',
                                background: 'transparent',
                                color: '#4ade80',
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            Đăng ký Chủ Sân →
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Onboarding modal — rendered outside authCard so it overlays everything ── */}
            <OnboardingModal
                isOpen={showOnboarding}
                onYes={handleOnboardingYes}
                onNo={handleOnboardingNo}
            />
        </div>
    );
}