import { useRef, useState } from 'react';
import { ownerApi } from '../../../api/ownerApi';

// Reusable drag-and-drop image upload zone
function ImageUploadZone({ id, name, label, emoji, previewUrl, isUploading, dragging, onDragOver, onDragLeave, onDrop, onClick, fileInputRef, onFileChange }) {
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
                id={id}
                name={name}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={onFileChange}
            />
        </div>
    );
}

export default function OwnerVerificationForm({ styles, onSuccess, attemptsLeft }) {
     const [idCard, setIdCard] = useState('');
    // CCCD front
    const [cccdFrontUrl, setCccdFrontUrl] = useState('');
    const [cccdFrontPreview, setCccdFrontPreview] = useState('');
    const [cccdFrontDragging, setCccdFrontDragging] = useState(false);
    const [cccdFrontUploading, setCccdFrontUploading] = useState(false);
    const cccdFrontRef = useRef(null);

    // CCCD back
    const [cccdBackUrl, setCccdBackUrl] = useState('');
    const [cccdBackPreview, setCccdBackPreview] = useState('');
    const [cccdBackDragging, setCccdBackDragging] = useState(false);
    const [cccdBackUploading, setCccdBackUploading] = useState(false);
    const cccdBackRef = useRef(null);

    // Business license
    const [licenseUrl, setLicenseUrl] = useState('');
    const [licensePreview, setLicensePreview] = useState('');
    const [licenseDragging, setLicenseDragging] = useState(false);
    const [licenseUploading, setLicenseUploading] = useState(false);
    const licenseRef = useRef(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errMsg, setErrMsg] = useState('');
    const handleIdCardChange = (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 12);
        setIdCard(val);
        setErrMsg('');
    };

    const uploadFile = async (file, setUrl, setPreview, setUploading) => {
        if (!file || !file.type.startsWith('image/')) {
            setErrMsg('Vui lòng chọn file ảnh (PNG, JPG, JPEG).');
            return;
        }
        setUploading(true);
        setErrMsg('');
        try {
            const urlData = await ownerApi.uploadMedia(file, 'OWNER', 0, 'IMAGE');
            setUrl(urlData?.url || '');
            setPreview(URL.createObjectURL(file));
        } catch {
            setErrMsg('Upload ảnh thất bại, vui lòng thử lại.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (idCard.length !== 12) {
            setErrMsg('Số CCCD phải có đúng 12 chữ số.');
            return;
        }

        if (!cccdFrontUrl) {
            setErrMsg('Vui lòng tải lên ảnh mặt trước CCCD.');
            return;
        }
        if (!cccdBackUrl) {
            setErrMsg('Vui lòng tải lên ảnh mặt sau CCCD.');
            return;
        }
        if (!licenseUrl) {
            setErrMsg('Vui lòng tải lên giấy phép kinh doanh.');
            return;
        }

        setIsSubmitting(true);
        setErrMsg('');
        try {
            await ownerApi.submitVerification({
                idCardNumber: idCard,
                idCardFrontUrl: cccdFrontUrl,
                idCardBackUrl: cccdBackUrl,
                businessLicenseUrl: licenseUrl,
            });
            onSuccess?.();
        } catch (error) {
            setErrMsg(error?.response?.data?.message || 'Có lỗi khi nộp hồ sơ.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isAnyUploading = cccdFrontUploading || cccdBackUploading || licenseUploading;

    return (
        <div className={styles.verificationCard}>
            <div className={styles.verificationTitle}>Cập nhật hồ sơ Chủ Sân</div>
            <div className={styles.verificationDesc}>
                Để bắt đầu tạo sân bãi và đăng lịch trống, vui lòng cung cấp thông tin
                pháp lý để Ban Quản Trị xác thực.
            </div>

            {/* Three-Strike warning banner */}
            {attemptsLeft != null && attemptsLeft <= 2 && (
                <div style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    marginBottom: 16,
                    background: attemptsLeft === 1 ? 'rgba(239,68,68,0.10)' : 'rgba(249,115,22,0.10)',
                    border: `1px solid ${attemptsLeft === 1 ? 'rgba(239,68,68,0.3)' : 'rgba(249,115,22,0.3)'}`,
                    color: attemptsLeft === 1 ? '#f87171' : '#fb923c',
                    fontSize: 13,
                    fontWeight: 600,
                }}>
                    {attemptsLeft === 1
                        ? '🔴 Đây là lần cuối cùng! Nếu bị từ chối, tài khoản sẽ bị khoá vĩnh viễn.'
                        : '🟠 Còn 1 lần chỉnh sửa sau lần này. Kiểm tra kỹ trước khi gửi.'}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* CCCD số */}
                <div className={styles.formGroup}>
                    <label htmlFor="ovf-id-card">Số CCCD * (12 số)</label>
                    <input
                        id="ovf-id-card"
                        name="idCardNumber"
                        placeholder="012345678901"
                        value={idCard}
                        onChange={handleIdCardChange}
                        inputMode="numeric"
                        maxLength={12}
                        autoComplete="off"
                    />
                </div>
                {/* CCCD 2 mặt */}
                <div className={styles.formGroup} style={{ marginTop: 16 }}>
                    <label>Ảnh CCCD — 2 mặt *</label>
                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                        <ImageUploadZone
                            id="ovf-cccd-front"
                            name="idCardFrontUrl"
                            label="📋 Mặt trước"
                            emoji="🪪"
                            previewUrl={cccdFrontPreview}
                            isUploading={cccdFrontUploading}
                            dragging={cccdFrontDragging}
                            onDragOver={(e) => { e.preventDefault(); setCccdFrontDragging(true); }}
                            onDragLeave={() => setCccdFrontDragging(false)}
                            onDrop={(e) => { e.preventDefault(); setCccdFrontDragging(false); uploadFile(e.dataTransfer.files[0], setCccdFrontUrl, setCccdFrontPreview, setCccdFrontUploading); }}
                            onClick={() => cccdFrontRef.current?.click()}
                            fileInputRef={cccdFrontRef}
                            onFileChange={(e) => uploadFile(e.target.files[0], setCccdFrontUrl, setCccdFrontPreview, setCccdFrontUploading)}
                        />
                        <ImageUploadZone
                            id="ovf-cccd-back"
                            name="idCardBackUrl"
                            label="🔄 Mặt sau"
                            emoji="🪪"
                            previewUrl={cccdBackPreview}
                            isUploading={cccdBackUploading}
                            dragging={cccdBackDragging}
                            onDragOver={(e) => { e.preventDefault(); setCccdBackDragging(true); }}
                            onDragLeave={() => setCccdBackDragging(false)}
                            onDrop={(e) => { e.preventDefault(); setCccdBackDragging(false); uploadFile(e.dataTransfer.files[0], setCccdBackUrl, setCccdBackPreview, setCccdBackUploading); }}
                            onClick={() => cccdBackRef.current?.click()}
                            fileInputRef={cccdBackRef}
                            onFileChange={(e) => uploadFile(e.target.files[0], setCccdBackUrl, setCccdBackPreview, setCccdBackUploading)}
                        />
                    </div>
                </div>

                {/* Giấy phép kinh doanh */}
                <div className={styles.formGroup} style={{ marginTop: 16 }}>
                    <label htmlFor="ovf-license">Giấy phép kinh doanh (bản chụp) *</label>
                    <div
                        onDragOver={(e) => { e.preventDefault(); setLicenseDragging(true); }}
                        onDragLeave={() => setLicenseDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setLicenseDragging(false); uploadFile(e.dataTransfer.files[0], setLicenseUrl, setLicensePreview, setLicenseUploading); }}
                        onClick={() => licenseRef.current?.click()}
                        style={{
                            border: `2px dashed ${licenseDragging ? '#4ade80' : 'rgba(148,163,184,0.3)'}`,
                            borderRadius: 12,
                            padding: licensePreview ? '12px' : '28px 16px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: licenseDragging ? 'rgba(22,163,74,0.08)' : 'rgba(255,255,255,0.03)',
                            transition: 'all 0.15s',
                            minHeight: 100,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            marginTop: 8,
                        }}
                    >
                        {licenseUploading ? (
                            <div style={{ color: '#a6b8d0', fontSize: 13 }}>Đang tải lên...</div>
                        ) : licensePreview ? (
                            <>
                                <img
                                    src={licensePreview}
                                    alt="preview"
                                    style={{ maxHeight: 130, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }}
                                />
                                <div style={{ fontSize: 12, color: '#4ade80' }}>Tải lên thành công — click để đổi ảnh</div>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: 26, opacity: 0.5 }}>📄</div>
                                <div style={{ fontSize: 13, color: '#a6b8d0' }}>
                                    Kéo ảnh vào đây hoặc <span style={{ color: '#4ade80', fontWeight: 600 }}>click để chọn</span>
                                </div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>PNG, JPG, JPEG — tối đa 20MB</div>
                            </>
                        )}
                    </div>
                    <input
                        ref={licenseRef}
                        id="ovf-license"
                        name="businessLicenseUrl"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => uploadFile(e.target.files[0], setLicenseUrl, setLicensePreview, setLicenseUploading)}
                    />
                </div>

                {errMsg && (
                    <div className={styles.errMsg} style={{ marginTop: 16 }}>{errMsg}</div>
                )}

                <div className={styles.modalActions}>
                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isSubmitting || isAnyUploading}
                    >
                        {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu ghi danh'}
                    </button>
                </div>
            </form>
        </div>
    );
}
