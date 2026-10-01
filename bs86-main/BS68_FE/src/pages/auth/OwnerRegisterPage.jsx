import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import axiosClient from '../../api/axiosClient';
import './Auth.css';

const STEPS = ['Tài khoản', 'Thông tin chủ sân', 'Tài liệu'];

function PasswordHint({ password }) {
    if (!password) return null;
    const checks = [
        { label: 'Ít nhất 8 ký tự', ok: password.length >= 8 },
        { label: 'Có chữ hoa (A-Z)', ok: /[A-Z]/.test(password) },
        { label: 'Có ký tự đặc biệt (!@#$%...)', ok: /[^A-Za-z0-9]/.test(password) },
    ];
    return (
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {checks.map(({ label, ok }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <span style={{ color: ok ? '#4ade80' : '#475569', fontWeight: 700 }}>{ok ? '✓' : '○'}</span>
                    <span style={{ color: ok ? '#86efac' : '#64748b' }}>{label}</span>
                </div>
            ))}
        </div>
    );
}

const INITIAL_FORM = {
    email: '',
    password: '',
    confirmPassword: '',
    ownerName: '',
    phoneNumber: '',
    idCardNumber: '',
    idCardFrontUrl: '',
    idCardBackUrl: '',
    businessLicenseUrl: '',
};

function StepIndicator({ current }) {
    return (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'center' }}>
            {STEPS.map((label, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: i < STEPS.length - 1 ? 1 : 0 }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, flexShrink: 0,
                        background: i < current ? '#16a34a' : i === current ? 'rgba(22,163,74,0.25)' : 'rgba(148,163,184,0.12)',
                        border: i === current ? '2px solid #16a34a' : '2px solid transparent',
                        color: i <= current ? '#d9fff0' : '#a6b8d0',
                    }}>
                        {i < current ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: 12, color: i === current ? '#ecf4ff' : '#a6b8d0', whiteSpace: 'nowrap' }}>
                        {label}
                    </span>
                    {i < STEPS.length - 1 && (
                        <div style={{ flex: 1, height: 1, background: i < current ? '#16a34a' : 'rgba(148,163,184,0.18)', minWidth: 16 }} />
                    )}
                </div>
            ))}
        </div>
    );
}

function Field({ label, children, error }) {
    return (
        <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a6b8d0', marginBottom: 6 }}>
                {label}
            </label>
            {children}
            {error && <div style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>{error}</div>}
        </div>
    );
}

const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.22)',
    background: 'rgba(255,255,255,0.05)', color: '#ecf4ff', fontSize: 14, outline: 'none',
    boxSizing: 'border-box',
};

// Reusable drag-and-drop image upload zone
function ImageDropZone({ label, emoji, previewUrl, isUploading, dragging, onDragOver, onDragLeave, onDrop, onClick, fileInputRef, onFileChange, inputId }) {
    return (
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>{label}</div>
            <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={onClick}
                style={{
                    border: `2px dashed ${dragging ? '#4ade80' : 'rgba(148,163,184,0.3)'}`,
                    borderRadius: 12,
                    padding: previewUrl ? '10px' : '20px 12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: dragging ? 'rgba(22,163,74,0.08)' : 'rgba(255,255,255,0.03)',
                    transition: 'all 0.15s',
                    minHeight: 90,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                }}
            >
                {isUploading ? (
                    <div style={{ color: '#a6b8d0', fontSize: 12 }}>Đang tải lên...</div>
                ) : previewUrl ? (
                    <>
                        <img
                            src={previewUrl}
                            alt="preview"
                            style={{ maxHeight: 110, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }}
                        />
                        <div style={{ fontSize: 11, color: '#4ade80' }}>✓ Thành công — click để đổi</div>
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: 22, opacity: 0.5 }}>{emoji}</div>
                        <div style={{ fontSize: 12, color: '#a6b8d0' }}>
                            Kéo vào đây hoặc <span style={{ color: '#4ade80', fontWeight: 600 }}>click chọn</span>
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>PNG, JPG, JPEG</div>
                    </>
                )}
            </div>
            <input
                ref={fileInputRef}
                id={inputId}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={onFileChange}
            />
        </div>
    );
}

export default function OwnerRegisterPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [globalError, setGlobalError] = useState('');

    // CCCD front drag-drop
    const [cccdFrontDragging, setCccdFrontDragging] = useState(false);
    const [cccdFrontUploading, setCccdFrontUploading] = useState(false);
    const [cccdFrontPreview, setCccdFrontPreview] = useState('');
    const cccdFrontRef = useRef(null);

    // CCCD back drag-drop
    const [cccdBackDragging, setCccdBackDragging] = useState(false);
    const [cccdBackUploading, setCccdBackUploading] = useState(false);
    const [cccdBackPreview, setCccdBackPreview] = useState('');
    const cccdBackRef = useRef(null);

    // Business license drag-drop
    const [licenseDragging, setLicenseDragging] = useState(false);
    const [licenseUploading, setLicenseUploading] = useState(false);
    const [licensePreview, setLicensePreview] = useState('');
    const licenseRef = useRef(null);

    // Email availability check — 'idle' | 'checking' | 'available' | 'taken'
    const [emailStatus, setEmailStatus] = useState('idle');
    const debounceTimer = useRef(null);
    const checkedEmailRef = useRef('');

    const checkEmailAvailability = useCallback(async (email) => {
        if (!email || !/\S+@\S+\.\S+/.test(email)) { setEmailStatus('idle'); return; }
        if (email === checkedEmailRef.current) return;
        setEmailStatus('checking');
        setErrors((er) => ({ ...er, email: '' }));
        try {
            const result = await authApi.checkEmail(email);
            const taken = result?.data === true || result === true;
            checkedEmailRef.current = email;
            setEmailStatus(taken ? 'taken' : 'available');
            if (taken) setErrors((er) => ({ ...er, email: 'Email này đã được sử dụng. Vui lòng đăng nhập để xem trạng thái hồ sơ.' }));
        } catch {
            setEmailStatus('idle');
        }
    }, []);

    useEffect(() => {
        const email = form.email.trim();
        if (!email || !/\S+@\S+\.\S+/.test(email)) { setEmailStatus('idle'); return; }
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => checkEmailAvailability(email), 600);
        return () => clearTimeout(debounceTimer.current);
    }, [form.email, checkEmailAvailability]);

    const set = (field) => (e) => {
        setForm((f) => ({ ...f, [field]: e.target.value }));
        setErrors((er) => ({ ...er, [field]: '' }));
        setGlobalError('');
        if (field === 'email') { checkedEmailRef.current = ''; setEmailStatus('idle'); }
    };

    const setDigitsOnly = (field, maxLen) => (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, maxLen);
        setForm((f) => ({ ...f, [field]: val }));
        setErrors((er) => ({ ...er, [field]: '' }));
        setGlobalError('');
    };

    // Generic upload — sets a form field key and a preview setter
    const uploadFile = async (file, formField, setPreview, setUploading, errField) => {
        if (!file || !file.type.startsWith('image/')) {
            setErrors((er) => ({ ...er, [errField]: 'Vui lòng chọn file ảnh (PNG, JPG, JPEG).' }));
            return;
        }
        setUploading(true);
        setErrors((er) => ({ ...er, [errField]: '' }));
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('ownerType', 'OWNER');
            formData.append('ownerId', '0');
            formData.append('type', 'IMAGE');
            const res = await axiosClient.post('/api/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const url = res?.data?.data?.url ?? res?.data?.url;
            setForm((f) => ({ ...f, [formField]: url || '' }));
            setPreview(URL.createObjectURL(file));
        } catch {
            setErrors((er) => ({ ...er, [errField]: 'Upload thất bại, vui lòng thử lại.' }));
        } finally {
            setUploading(false);
        }
    };

    const validateStep = () => {
        const errs = {};
        if (step === 0) {
            if (!form.email.trim()) errs.email = 'Vui lòng nhập email.';
            else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email không hợp lệ.';
            else if (emailStatus === 'checking') errs.email = 'Đang kiểm tra email, vui lòng chờ...';
            else if (emailStatus === 'taken') errs.email = 'Email này đã được sử dụng. Vui lòng đăng nhập để xem trạng thái hồ sơ.';
            if (!form.password) errs.password = 'Vui lòng nhập mật khẩu.';
            else if (form.password.length < 8) errs.password = 'Mật khẩu tối thiểu 8 ký tự.';
            else if (!/[A-Z]/.test(form.password)) errs.password = 'Mật khẩu phải có ít nhất 1 chữ hoa (A-Z).';
            else if (!/[^A-Za-z0-9]/.test(form.password)) errs.password = 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%...).';
            if (form.confirmPassword !== form.password) errs.confirmPassword = 'Mật khẩu xác nhận không khớp.';
        }
        if (step === 1) {
            if (!form.ownerName.trim()) errs.ownerName = 'Vui lòng nhập họ tên.';
            if (form.phoneNumber.length !== 10) errs.phoneNumber = 'Số điện thoại phải có đúng 10 chữ số.';
            if (form.idCardNumber.length !== 12) errs.idCardNumber = 'CCCD phải có đúng 12 chữ số.';
        }
        if (step === 2) {
            if (!form.idCardFrontUrl) errs.idCardFrontUrl = 'Vui lòng tải lên ảnh mặt trước CCCD.';
            if (!form.idCardBackUrl) errs.idCardBackUrl = 'Vui lòng tải lên ảnh mặt sau CCCD.';
            if (!form.businessLicenseUrl) errs.businessLicenseUrl = 'Vui lòng tải lên giấy phép kinh doanh.';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = async () => {
        if (step === 0) {
            const email = form.email.trim();
            if (email && /\S+@\S+\.\S+/.test(email) && email !== checkedEmailRef.current) {
                clearTimeout(debounceTimer.current);
                await checkEmailAvailability(email);
            }
        }
        if (validateStep()) setStep((s) => s + 1);
    };

    const handleBack = () => setStep((s) => s - 1);

    const handleSubmit = async () => {
        if (!validateStep()) return;
        setLoading(true);
        setGlobalError('');
        try {
            await authApi.registerOwner({
                email: form.email.trim(),
                password: form.password,
                ownerName: form.ownerName.trim(),
                phoneNumber: form.phoneNumber.trim(),
                idCardNumber: form.idCardNumber.trim(),
                idCardFrontUrl: form.idCardFrontUrl,
                idCardBackUrl: form.idCardBackUrl,
                businessLicenseUrl: form.businessLicenseUrl,
            });
            setSubmitted(true);
        } catch (err) {
            const msg = err?.message || err?.response?.data?.message || 'Đăng ký thất bại.';
            if (msg.toLowerCase().includes('email already registered') || msg.toLowerCase().includes('email already exists')) {
                setGlobalError('Email này đã được đăng ký. Vui lòng đăng nhập để xem trạng thái hồ sơ.');
            } else {
                setGlobalError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const isAnyUploading = cccdFrontUploading || cccdBackUploading || licenseUploading;

    if (submitted) {
        return (
            <div className="authPage">
                <div className="authBackdrop" />
                <div className="authCard">
                    <div className="authPanel" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
                        <div className="brandBadge" style={{ justifyContent: 'center', marginBottom: 16 }}>
                            BS86 · Chờ xét duyệt
                        </div>
                        <h2 style={{ margin: '0 0 12px', fontSize: '1.6rem', color: '#ecf4ff' }}>
                            Đơn đăng ký đã được gửi!
                        </h2>
                        <p style={{ color: '#a6b8d0', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                            Hồ sơ của bạn đang chờ Admin xét duyệt. Bạn sẽ có thể đăng nhập
                            bất cứ lúc nào để kiểm tra trạng thái hồ sơ.
                        </p>
                        <button
                            onClick={() => navigate('/auth?mode=login')}
                            style={{
                                padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                background: 'linear-gradient(135deg,#16a34a,#15803d)',
                                color: '#fff', fontWeight: 700, fontSize: 14,
                            }}
                        >
                            Đăng nhập để theo dõi hồ sơ
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="authPage">
            <div className="authBackdrop" />
            <div className="authCard" style={{ width: 'min(560px, 100%)' }}>
                <div className="authPanel">
                    <div className="brandBadge" style={{ marginBottom: 18 }}>BS86 · Đăng ký Chủ Sân</div>
                    <h1 style={{ margin: '0 0 6px', fontSize: '1.7rem', color: '#ecf4ff', letterSpacing: '-0.02em' }}>
                        Trở thành Chủ Sân
                    </h1>
                    <p style={{ color: '#a6b8d0', fontSize: 14, marginBottom: 24 }}>
                        Điền đầy đủ thông tin để gửi hồ sơ. Admin sẽ xét duyệt trong thời gian sớm nhất.
                    </p>

                    <StepIndicator current={step} />

                    {/* Wrap all inputs in a <form> so browsers recognise password fields */}
                    <form onSubmit={(e) => e.preventDefault()} autoComplete="on">

                    {globalError && (
                        <div style={{
                            padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                            color: '#fca5a5', fontSize: 13,
                        }}>
                            {globalError}
                            {globalError.includes('đăng nhập') && (
                                <span
                                    onClick={() => navigate('/auth?mode=login')}
                                    style={{ color: '#86efac', cursor: 'pointer', marginLeft: 6, textDecoration: 'underline' }}
                                >
                                    Đăng nhập ngay
                                </span>
                            )}
                        </div>
                    )}

                    {/* ── Step 0: Tài khoản ── */}
                    {step === 0 && (
                        <>
                            <Field label="Email *" error={errors.email}>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        style={{ ...inputStyle, paddingRight: 36 }}
                                        type="email"
                                        placeholder="example@email.com"
                                        value={form.email}
                                        onChange={set('email')}
                                        autoComplete="off"
                                    />
                                    {emailStatus === 'checking' && (
                                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94a3b8' }}>⏳</span>
                                    )}
                                    {emailStatus === 'available' && (
                                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#4ade80' }}>✓</span>
                                    )}
                                    {emailStatus === 'taken' && (
                                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#f87171' }}>✕</span>
                                    )}
                                </div>
                            </Field>
                            <Field label="Mật khẩu *" error={errors.password}>
                                <input
                                    style={inputStyle}
                                    type="password"
                                    placeholder="Tối thiểu 8 ký tự, có chữ hoa và ký tự đặc biệt"
                                    value={form.password}
                                    onChange={set('password')}
                                    autoComplete="new-password"
                                />
                                <PasswordHint password={form.password} />
                            </Field>
                            <Field label="Xác nhận mật khẩu *" error={errors.confirmPassword}>
                                <input style={inputStyle} type="password" placeholder="Nhập lại mật khẩu"
                                    value={form.confirmPassword} onChange={set('confirmPassword')} />
                            </Field>
                        </>
                    )}

                    {/* ── Step 1: Thông tin chủ sân ── */}
                    {step === 1 && (
                        <>
                            <Field label="Họ và tên *" error={errors.ownerName}>
                                <input style={inputStyle} placeholder="Nguyễn Văn A"
                                    value={form.ownerName} onChange={set('ownerName')} />
                            </Field>
                            <Field label="Số điện thoại * (10 số)" error={errors.phoneNumber}>
                                <input
                                    style={inputStyle}
                                    placeholder="0901234567"
                                    value={form.phoneNumber}
                                    onChange={setDigitsOnly('phoneNumber', 10)}
                                    inputMode="numeric"
                                    maxLength={10}
                                />
                            </Field>
                            <Field label="Số CCCD * (12 số)" error={errors.idCardNumber}>
                                <input
                                    style={inputStyle}
                                    placeholder="012345678901"
                                    value={form.idCardNumber}
                                    onChange={setDigitsOnly('idCardNumber', 12)}
                                    inputMode="numeric"
                                    maxLength={12}
                                />
                            </Field>
                        </>
                    )}

                    {/* ── Step 2: Tài liệu ── */}
                    {step === 2 && (
                        <>
                            {/* CCCD 2 mặt */}
                            <Field label="Ảnh CCCD — 2 mặt *" error={errors.idCardFrontUrl || errors.idCardBackUrl}>
                                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                                    <ImageDropZone
                                        inputId="reg-cccd-front"
                                        label="📋 Mặt trước"
                                        emoji="🪪"
                                        previewUrl={cccdFrontPreview}
                                        isUploading={cccdFrontUploading}
                                        dragging={cccdFrontDragging}
                                        onDragOver={(e) => { e.preventDefault(); setCccdFrontDragging(true); }}
                                        onDragLeave={() => setCccdFrontDragging(false)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setCccdFrontDragging(false);
                                            uploadFile(e.dataTransfer.files[0], 'idCardFrontUrl', setCccdFrontPreview, setCccdFrontUploading, 'idCardFrontUrl');
                                        }}
                                        onClick={() => cccdFrontRef.current?.click()}
                                        fileInputRef={cccdFrontRef}
                                        onFileChange={(e) => uploadFile(e.target.files[0], 'idCardFrontUrl', setCccdFrontPreview, setCccdFrontUploading, 'idCardFrontUrl')}
                                    />
                                    <ImageDropZone
                                        inputId="reg-cccd-back"
                                        label="🔄 Mặt sau"
                                        emoji="🪪"
                                        previewUrl={cccdBackPreview}
                                        isUploading={cccdBackUploading}
                                        dragging={cccdBackDragging}
                                        onDragOver={(e) => { e.preventDefault(); setCccdBackDragging(true); }}
                                        onDragLeave={() => setCccdBackDragging(false)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setCccdBackDragging(false);
                                            uploadFile(e.dataTransfer.files[0], 'idCardBackUrl', setCccdBackPreview, setCccdBackUploading, 'idCardBackUrl');
                                        }}
                                        onClick={() => cccdBackRef.current?.click()}
                                        fileInputRef={cccdBackRef}
                                        onFileChange={(e) => uploadFile(e.target.files[0], 'idCardBackUrl', setCccdBackPreview, setCccdBackUploading, 'idCardBackUrl')}
                                    />
                                </div>
                            </Field>

                            {/* Giấy phép kinh doanh */}
                            <Field label="Giấy phép kinh doanh *" error={errors.businessLicenseUrl}>
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setLicenseDragging(true); }}
                                    onDragLeave={() => setLicenseDragging(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setLicenseDragging(false);
                                        uploadFile(e.dataTransfer.files[0], 'businessLicenseUrl', setLicensePreview, setLicenseUploading, 'businessLicenseUrl');
                                    }}
                                    onClick={() => licenseRef.current?.click()}
                                    style={{
                                        border: `2px dashed ${licenseDragging ? '#4ade80' : 'rgba(148,163,184,0.3)'}`,
                                        borderRadius: 12,
                                        padding: licensePreview ? '12px' : '32px 16px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        background: licenseDragging ? 'rgba(22,163,74,0.08)' : 'rgba(255,255,255,0.03)',
                                        transition: 'all 0.15s',
                                        minHeight: 120,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        marginTop: 4,
                                    }}
                                >
                                    {licenseUploading ? (
                                        <div style={{ color: '#a6b8d0', fontSize: 13 }}>Đang tải lên...</div>
                                    ) : licensePreview ? (
                                        <>
                                            <img
                                                src={licensePreview}
                                                alt="preview"
                                                style={{ maxHeight: 140, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }}
                                            />
                                            <div style={{ fontSize: 12, color: '#4ade80' }}>Tải lên thành công — click để đổi ảnh</div>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ fontSize: 28, opacity: 0.5 }}>📄</div>
                                            <div style={{ fontSize: 13, color: '#a6b8d0' }}>
                                                Kéo ảnh vào đây hoặc <span style={{ color: '#4ade80', fontWeight: 600 }}>click để chọn</span>
                                            </div>
                                            <div style={{ fontSize: 11, color: '#64748b' }}>PNG, JPG, JPEG — tối đa 20MB</div>
                                        </>
                                    )}
                                </div>
                                <input
                                    ref={licenseRef}
                                    id="reg-license"
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => uploadFile(e.target.files[0], 'businessLicenseUrl', setLicensePreview, setLicenseUploading, 'businessLicenseUrl')}
                                />
                            </Field>

                            {/* Xác nhận thông tin */}
                            <div style={{
                                padding: '12px 14px', borderRadius: 10, marginBottom: 8,
                                background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.14)',
                                fontSize: 13, color: '#a6b8d0',
                            }}>
                                <div style={{ fontWeight: 700, color: '#ecf4ff', marginBottom: 6 }}>Xác nhận thông tin</div>
                                <div>Email: <span style={{ color: '#ecf4ff' }}>{form.email}</span></div>
                                <div>Họ tên: <span style={{ color: '#ecf4ff' }}>{form.ownerName}</span></div>
                                <div>SĐT: <span style={{ color: '#ecf4ff' }}>{form.phoneNumber}</span></div>
                                <div>CCCD: <span style={{ color: '#ecf4ff' }}>{form.idCardNumber}</span></div>
                            </div>
                        </>
                    )}

                    {/* end form */}
                    </form>

                    {/* Navigation */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                        {step > 0 && (
                            <button type="button" onClick={handleBack} style={{
                                flex: 1, padding: '11px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.22)',
                                background: 'transparent', color: '#a6b8d0', fontWeight: 600, cursor: 'pointer', fontSize: 14,
                            }}>
                                ← Quay lại
                            </button>
                        )}
                        {step < 2 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                style={{
                                    flex: 1, padding: '11px', borderRadius: 10, border: 'none',
                                    cursor: 'pointer',
                                    background: 'linear-gradient(135deg,#16a34a,#15803d)',
                                    color: '#fff', fontWeight: 700, fontSize: 14,
                                }}
                            >
                                Tiếp theo →
                            </button>
                        ) : (
                            <button type="button" onClick={handleSubmit} disabled={loading || isAnyUploading} style={{
                                flex: 1, padding: '11px', borderRadius: 10, border: 'none',
                                cursor: (loading || isAnyUploading) ? 'not-allowed' : 'pointer',
                                background: (loading || isAnyUploading) ? 'rgba(22,163,74,0.4)' : 'linear-gradient(135deg,#16a34a,#15803d)',
                                color: '#fff', fontWeight: 700, fontSize: 14,
                            }}>
                                {loading ? 'Đang gửi...' : isAnyUploading ? 'Đang tải ảnh...' : 'Gửi đơn đăng ký'}
                            </button>
                        )}
                    </div>

                    <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#a6b8d0' }}>
                        Đã có tài khoản?{' '}
                        <span onClick={() => navigate('/auth?mode=login')}
                            style={{ color: '#4ade80', cursor: 'pointer', fontWeight: 600 }}>
                            Đăng nhập
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}
