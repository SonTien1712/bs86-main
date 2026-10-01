import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import { ownerApi } from '../../api/ownerApi';
import styles from './OwnerCheckInPage.module.css';

const QR_PREFIX = 'BS86:TICKET:';

function normalizeQrToken(value) {
    const normalized = String(value || '').trim();
    if (normalized.startsWith(QR_PREFIX)) {
        return normalized.slice(QR_PREFIX.length).trim();
    }
    return normalized;
}

function formatDateTime(value) {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function formatDate(value) {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
}

function formatTime(value) {
    if (!value) return '--';
    const normalized = String(value);
    return normalized.length >= 5 ? normalized.slice(0, 5) : normalized;
}

function getResultMeta(result) {
    switch (String(result || '').toUpperCase()) {
        case 'SUCCESS':
            return {
                label: 'Check-in thành công',
                className: styles.success
            };
        case 'FAILED':
            return {
                label: 'Check-in thất bại',
                className: styles.failed
            };
        default:
            return {
                label: result || 'Không rõ',
                className: styles.neutral
            };
    }
}

function getReasonLabel(reason) {
    switch (String(reason || '').toUpperCase()) {
        case 'INVALID_TOKEN':
            return 'Mã QR không hợp lệ';
        case 'EXPIRED':
            return 'Vé đã hết hạn';
        case 'ALREADY_USED':
            return 'Vé đã được check-in';
        case 'FORBIDDEN':
            return 'Vé không thuộc sân của bạn';
        case 'INVALID':
            return 'Vé không còn hợp lệ';
        case 'TOO_EARLY':
            return 'Chưa đến giờ nhận sân (Chỉ hỗ trợ quét trước 1 tiếng)';
        default:
            return reason || '--';
    }
}

function getCameraStatus(cameraError, loading) {
    if (loading) return 'Đang kiểm tra vé';
    if (cameraError) return 'Chế độ nhập tay';
    return 'Camera sẵn sàng';
}

export default function OwnerCheckInPage() {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const detectorRef = useRef(null);
    const intervalRef = useRef(null);
    const scanLockRef = useRef(false);
    const loadingRef = useRef(false);
    const mountedRef = useRef(true);
    const submitCheckInRef = useRef(null);

    const [manualQr, setManualQr] = useState('');
    const [checkInResult, setCheckInResult] = useState(null);
    const [cameraError, setCameraError] = useState('');
    const [scanHint, setScanHint] = useState('Đưa mã QR vào khung để quét tự động.');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState('');

    const summary = useMemo(() => {
        const total = history.length;
        const success = history.filter((item) => String(item?.result).toUpperCase() === 'SUCCESS').length;
        const failed = history.filter((item) => String(item?.result).toUpperCase() === 'FAILED').length;

        return [
            { label: 'Tổng quét', value: total },
            { label: 'Thành công', value: success },
            { label: 'Thất bại', value: failed }
        ];
    }, [history]);

    const latestHistoryItem = history[0] || null;
    const latestCheckInLabel = latestHistoryItem
        ? `${latestHistoryItem?.ticketCode || 'Vé không rõ'} • ${formatDateTime(latestHistoryItem?.checkInTime)}`
        : 'Chưa có lịch sử check-in';

    const loadHistory = async () => {
        setHistoryLoading(true);
        setHistoryError('');

        try {
            const data = await ownerApi.getCheckInHistory();
            if (!mountedRef.current) return;
            setHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            if (!mountedRef.current) return;
            setHistory([]);
            setHistoryError(
                error?.response?.data?.message ||
                    error?.message ||
                    'Không tải được lịch sử check-in.'
            );
        } finally {
            if (mountedRef.current) {
                setHistoryLoading(false);
            }
        }
    };

    useEffect(() => {
        mountedRef.current = true;
        void loadHistory();

        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const stopCamera = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }

            detectorRef.current = null;
        };

        const startCamera = async () => {
            if (typeof window === 'undefined') return;
            if (!navigator.mediaDevices?.getUserMedia) {
                setCameraError('Thiết bị này không hỗ trợ camera.');
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: 'environment' }
                    },
                    audio: false
                });

                if (!mountedRef.current) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                streamRef.current = stream;
                const video = videoRef.current;
                if (!video) return;

                video.srcObject = stream;
                await video.play();

                setCameraError('');
                setScanHint('Đưa QR vào giữa khung, hệ thống sẽ tự nhận diện.');

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d', { willReadFrequently: true });

                intervalRef.current = setInterval(() => {
                    if (!mountedRef.current || scanLockRef.current || loadingRef.current) return;
                    const currentVideo = videoRef.current;
                    if (!currentVideo || currentVideo.readyState !== currentVideo.HAVE_ENOUGH_DATA) return;

                    try {
                        canvas.width = currentVideo.videoWidth;
                        canvas.height = currentVideo.videoHeight;
                        context.drawImage(currentVideo, 0, 0, canvas.width, canvas.height);
                        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                        
                        const code = jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: "dontInvert"
                        });
                        
                        const rawValue = code?.data;
                        if (rawValue && submitCheckInRef.current) {
                            void submitCheckInRef.current(rawValue);
                        }
                    } catch {
                        // Ignore transient detection errors.
                    }
                }, 700);
            } catch (error) {
                setCameraError(
                    error?.message || 'Không thể bật camera. Hãy cấp quyền hoặc nhập mã thủ công.'
                );
            }
        };

        void startCamera();

        return () => {
            stopCamera();
        };
    }, []);

    const submitCheckIn = async (rawValue) => {
        const qrToken = normalizeQrToken(rawValue);
        if (!qrToken) {
            setCheckInResult({
                result: 'FAILED',
                reason: 'INVALID_TOKEN',
                qrToken: ''
            });
            return;
        }

        scanLockRef.current = true;
        loadingRef.current = true;
        setLoading(true);
        setScanHint('Đang xác thực vé...');

        try {
            const response = await ownerApi.checkInTicket({ qrToken });
            const payload = response?.data ?? response;
            if (!mountedRef.current) return;

            setCheckInResult(payload || null);
            setManualQr('');
            setScanHint(
                String(payload?.result || '').toUpperCase() === 'SUCCESS'
                    ? 'Đã ghi nhận check-in thành công.'
                    : 'Quét tiếp để xử lý vé khác.'
            );
            await loadHistory();
        } catch (error) {
            if (!mountedRef.current) return;
            const message = error?.response?.data?.message || error?.message || 'Check-in thất bại.';
            setCheckInResult({
                result: 'FAILED',
                reason: 'INVALID',
                qrToken,
                message
            });
            setScanHint('Không thể xử lý mã QR này.');
        } finally {
            setLoading(false);
            loadingRef.current = false;
            window.setTimeout(() => {
                scanLockRef.current = false;
            }, 1200);
        }
    };

    const handleManualSubmit = async (event) => {
        event.preventDefault();
        await submitCheckIn(manualQr);
    };

    useEffect(() => {
        submitCheckInRef.current = submitCheckIn;
    }, [submitCheckIn]);

    const latestMeta = getResultMeta(checkInResult?.result);
    const cameraStatus = getCameraStatus(cameraError, loading);

    return (
        <div className={styles.page}>
            <div className={styles.glowOne} />
            <div className={styles.glowTwo} />

            <header className={styles.topBar}>
                <button className={styles.backButton} onClick={() => navigate('/account')} type="button">
                    <span className={styles.backArrow}>←</span>
                    Quay lại dashboard owner
                </button>

                <div className={styles.topBarCenter}>
                    <span className={styles.topBarKicker}>Quick scan</span>
                    <strong>Owner Check-in</strong>
                    <span className={styles.topBarSub}>Quét QR, xác nhận vé, lưu log tức thì</span>
                </div>

                <button className={styles.refreshButton} onClick={loadHistory} type="button">
                    Làm mới lịch sử
                </button>
            </header>

            <section className={styles.hero}>
                <div className={styles.heroCopy}>
                    <div className={styles.kicker}>Owner check-in</div>
                    <h1 className={styles.title}>Quét QR, xác nhận check-in và lưu lịch sử theo thời gian thực</h1>
                    <p className={styles.subtitle}>
                        Màn hình này dùng camera để đọc mã QR của vé, gọi backend để kiểm tra hiệu lực,
                        cập nhật trạng thái check-in và ghi log cho owner.
                    </p>

                    <div className={styles.heroChips}>
                        <span>Camera scan</span>
                        <span>Manual fallback</span>
                        <span>Auto history log</span>
                    </div>
                </div>

                <div className={styles.summaryGrid}>
                    {summary.map((item) => (
                        <article className={styles.summaryCard} key={item.label}>
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                        </article>
                    ))}
                </div>
            </section>

            <div className={styles.layout}>
                <section className={styles.scanCard}>
                    <div className={styles.cardHeader}>
                        <div>
                            <div className={styles.cardKicker}>Camera</div>
                            <h2>Đưa QR vào khung quét</h2>
                        </div>
                        <div className={`${styles.badge} ${loading ? styles.badgeActive : ''}`}>{cameraStatus}</div>
                    </div>

                    <div className={styles.cardNote}>
                        Đưa mã QR của khách vào khung hình. Nếu mã quá mờ hoặc camera lỗi, có thể nhập thủ công token ở bên dưới.
                    </div>

                    <div className={styles.cameraFrame}>
                        <video ref={videoRef} className={styles.video} muted playsInline />
                        <div className={styles.overlay} />
                        <div className={styles.scanBox} />
                        <div className={styles.scanLine} />
                    </div>

                    <div className={styles.helperRow}>
                        <div className={styles.helperText}>{scanHint}</div>
                        {cameraError ? <div className={styles.errorText}>{cameraError}</div> : null}
                    </div>

                    <form className={styles.manualForm} onSubmit={handleManualSubmit}>
                        <label>
                            <span>Nhập QR token thủ công</span>
                            <input
                                onChange={(event) => setManualQr(event.target.value)}
                                placeholder="BS86:TICKET:... hoặc chỉ token"
                                value={manualQr}
                            />
                        </label>
                        <button disabled={loading} type="submit">
                            Xác nhận
                        </button>
                    </form>
                </section>

                <aside className={styles.sideColumn}>
                    <section className={styles.resultCard}>
                        <div className={styles.cardHeader}>
                            <div>
                                <div className={styles.cardKicker}>Kết quả gần nhất</div>
                                <h2>Trạng thái check-in</h2>
                            </div>
                            <div className={`${styles.resultBadge} ${latestMeta.className}`}>
                                {latestMeta.label}
                            </div>
                        </div>

                        {checkInResult ? (
                            <div className={styles.resultBody}>
                                <div className={`${styles.resultBanner} ${latestMeta.className}`}>
                                    <div className={styles.resultBannerTitle}>{latestMeta.label}</div>
                                    <div className={styles.resultBannerMeta}>
                                        {checkInResult.ticketCode || '--'} • {checkInResult.fieldName || '--'}
                                    </div>
                                </div>

                                <div className={styles.resultGrid}>
                                    <div className={styles.resultRow}>
                                        <span>Mã vé</span>
                                        <strong>{checkInResult.ticketCode || '--'}</strong>
                                    </div>
                                    <div className={styles.resultRow}>
                                        <span>Sân</span>
                                        <strong>{checkInResult.fieldName || '--'}</strong>
                                    </div>
                                    <div className={styles.resultRow}>
                                        <span>Court</span>
                                        <strong>{checkInResult.courtName || '--'}</strong>
                                    </div>
                                    <div className={styles.resultRow}>
                                        <span>Ngày</span>
                                        <strong>{formatDate(checkInResult.slotDate)}</strong>
                                    </div>
                                    <div className={styles.resultRow}>
                                        <span>Giờ</span>
                                        <strong>
                                            {formatTime(checkInResult.startTime)} - {formatTime(checkInResult.endTime)}
                                        </strong>
                                    </div>
                                    <div className={styles.resultRow}>
                                        <span>Thời điểm xử lý</span>
                                        <strong>{formatDateTime(checkInResult.checkInTime)}</strong>
                                    </div>
                                </div>

                                {checkInResult.result === 'FAILED' ? (
                                    <div className={styles.reasonBox}>{getReasonLabel(checkInResult.reason)}</div>
                                ) : null}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>Chưa quét vé nào trong phiên này.</div>
                        )}
                    </section>
                </aside>
            </div>

            <section className={styles.historyCardFull}>
                        <div className={styles.cardHeader}>
                            <div>
                                <div className={styles.cardKicker}>Lịch sử</div>
                                <h2>Check-in gần đây</h2>
                                <div className={styles.cardSubtext}>{latestCheckInLabel}</div>
                            </div>
                            <button className={styles.refreshBtn} onClick={loadHistory} type="button">
                                Làm mới
                            </button>
                        </div>

                        {historyLoading ? <div className={styles.emptyState}>Đang tải lịch sử...</div> : null}
                        {!historyLoading && historyError ? (
                            <div className={styles.errorText}>{historyError}</div>
                        ) : null}
                        {!historyLoading && !historyError && history.length === 0 ? (
                            <div className={styles.emptyState}>Chưa có lịch sử check-in.</div>
                        ) : null}

                        {!historyLoading && !historyError && history.length > 0 ? (
                            <div className={styles.historyList}>
                                {history.map((item) => {
                                    const meta = getResultMeta(item?.result);
                                    return (
                                        <article
                                            className={styles.historyItem}
                                            key={item?.logId || `${item?.qrToken}-${item?.checkInTime}`}
                                        >
                                            <div className={styles.historyTopRow}>
                                                <strong>{item?.ticketCode || 'Vé không rõ'}</strong>
                                                <span className={`${styles.historyBadge} ${meta.className}`}>
                                                    {meta.label}
                                                </span>
                                            </div>
                                            <div className={styles.historyMeta}>
                                                <span>{item?.fieldName || '--'}</span>
                                                <span>{item?.courtName || '--'}</span>
                                                <span>{formatDateTime(item?.checkInTime)}</span>
                                            </div>
                                            <div className={styles.historyTimes}>
                                                {formatDate(item?.slotDate)} | {formatTime(item?.startTime)} -{' '}
                                                {formatTime(item?.endTime)}
                                            </div>
                                            {item?.result === 'FAILED' ? (
                                                <div className={styles.historyReason}>
                                                    {getReasonLabel(item?.reason)}
                                                </div>
                                            ) : null}
                                        </article>
                                    );
                                })}
                            </div>
                        ) : null}
            </section>
        </div>
    );
}
