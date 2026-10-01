import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fieldsApi } from '../../../api/fieldsApi';
import { getSportLabel } from '../../../constants/sportTypes';
import styles from './PublicFieldDetailPage.module.scss';

const FIELD_FALLBACK_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1d4ed8"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="720" fill="url(#bg)"/>
  <circle cx="1060" cy="108" r="180" fill="rgba(255,255,255,0.12)"/>
  <circle cx="150" cy="620" r="220" fill="rgba(255,255,255,0.1)"/>
  <text x="74" y="332" fill="#f8fafc" font-family="Arial, sans-serif" font-size="82" font-weight="700">Chi tiết sân</text>
  <text x="74" y="424" fill="#dbeafe" font-family="Arial, sans-serif" font-size="34">Thông tin hình ảnh đang được cập nhật</text>
</svg>
`)}`;

function getSafeValue(value, fallback) {
    return value ? value : fallback;
}

function normalizeFieldDetail(field) {
    return {
        id: field?.id ?? '',
        name: getSafeValue(field?.name, 'Sân đang cập nhật tên'),
        slug: getSafeValue(field?.slug, ''),
        address: getSafeValue(field?.address, 'Địa chỉ đang được cập nhật'),
        sportTypeKey: field?.sportType ?? 'OTHER',
        sportType: getSafeValue(getSportLabel(field?.sportType || 'OTHER'), 'Khác'),
        latitude: field?.latitude,
        longitude: field?.longitude,
        description: getSafeValue(field?.description, 'Mô tả chi tiết của sân sẽ được bổ sung ở phase tiếp theo.'),
        phone: getSafeValue(field?.phone, 'Chưa cập nhật số điện thoại'),
        openingHours: getSafeValue(field?.openingHours, 'Giờ hoạt động đang được cập nhật'),
        bookingPolicy: getSafeValue(field?.bookingPolicy, 'Chính sách đặt sân sẽ được hiển thị đầy đủ ở phase tiếp theo.'),
        coverImageUrl: field?.coverImageUrl ?? ''
    };
}

function LoadingState() {
    return (
        <div className={styles.loadingShell}>
            <div className={styles.loadingHero} />
            <div className={styles.loadingGrid}>
                <div className={styles.loadingCard} />
                <div className={styles.loadingCard} />
                <div className={styles.loadingCard} />
            </div>
        </div>
    );
}

function FeedbackState({ title, description, actionLabel, actionHref, onAction }) {
    const action = actionHref ? (
        <Link className={styles.primaryButton} to={actionHref}>
            {actionLabel}
        </Link>
    ) : (
        <button className={styles.primaryButton} onClick={onAction} type='button'>
            {actionLabel}
        </button>
    );

    return (
        <div className={styles.feedbackCard}>
            <div className={styles.feedbackIcon}>◦</div>
            <h1>{title}</h1>
            <p>{description}</p>
            {action}
        </div>
    );
}

function FieldDetailHero({ field }) {
    const [imageFailed, setImageFailed] = useState(false);
    const imageSrc = !imageFailed && field.coverImageUrl ? field.coverImageUrl : FIELD_FALLBACK_IMAGE;
    const canCall = field.phone && !field.phone.includes('Chưa cập nhật');
    const mapState = {
        focusField: {
            id: field.id,
            slug: field.slug,
            name: field.name,
            address: field.address,
            sportType: field.sportTypeKey,
            openingHours: field.openingHours,
            phone: field.phone,
            latitude: field.latitude,
            longitude: field.longitude,
            coverImageUrl: field.coverImageUrl,
            description: field.description,
            bookingPolicy: field.bookingPolicy
        }
    };

    return (
        <section className={styles.hero}>
            <div className={styles.heroMedia}>
                <img src={imageSrc} alt={field.name} onError={() => setImageFailed(true)} />
            </div>

            <div className={styles.heroContent}>
                <Link className={styles.backLink} to='/san'>
                    ← Quay lại danh sách sân
                </Link>
                <span className={styles.typeBadge}>{field.sportType}</span>
                <h1>{field.name}</h1>
                <p className={styles.heroAddress}>{field.address}</p>

                <div className={styles.heroMeta}>
                    <div>
                        <span>Giờ mở cửa</span>
                        <strong>{field.openingHours}</strong>
                    </div>
                    <div>
                        <span>Liên hệ</span>
                        <strong>{field.phone}</strong>
                    </div>
                </div>

                <div className={styles.heroActions}>
                    {typeof field.id === 'number' ? (
                        <Link className={styles.bookingButton} to={`/booking/${field.id}`}>
                            Đặt lịch
                        </Link>
                    ) : (
                        <span className={styles.bookingButtonDisabled}>Đặt lịch</span>
                    )}
                    {canCall ? (
                        <a className={styles.primaryButton} href={`tel:${field.phone}`}>
                            Liên hệ sân
                        </a>
                    ) : (
                        <span className={styles.primaryButton}>Liên hệ sân</span>
                    )}
                    <Link className={styles.secondaryButton} to='/map' state={mapState}>
                        Mở bản đồ
                    </Link>
                    {typeof field.id === 'number' ? (
                        <Link className={styles.reportButton} to={`/report/${field.id}`}>
                            Báo cáo
                        </Link>
                    ) : (
                        <span className={styles.reportButton}>Báo cáo</span>
                    )}
                </div>
            </div>
        </section>
    );
}

function InfoSection({ field }) {
    return (
        <section className={styles.contentGrid}>
            <article className={styles.mainCard}>
                <div className={styles.sectionLabel}>Giới thiệu sân</div>
                <h2>Mô tả</h2>
                <p>{field.description}</p>
            </article>

            <aside className={styles.sidebarCard}>
                <div className={styles.sectionLabel}>Thông tin nhanh</div>
                <dl className={styles.detailList}>
                    <div>
                        <dt>Slug</dt>
                        <dd>{field.slug || 'Đang cập nhật'}</dd>
                    </div>
                    <div>
                        <dt>Địa chỉ</dt>
                        <dd>{field.address}</dd>
                    </div>
                    <div>
                        <dt>Điện thoại</dt>
                        <dd>{field.phone}</dd>
                    </div>
                    <div>
                        <dt>Tọa độ</dt>
                        <dd>
                            {field.latitude != null && field.longitude != null
                                ? `${field.latitude}, ${field.longitude}`
                                : 'Đang cập nhật tọa độ'}
                        </dd>
                    </div>
                </dl>
            </aside>
        </section>
    );
}

function FieldPolicySection({ policy }) {
    return (
        <section className={styles.policyCard}>
            <div className={styles.sectionLabel}>Chính sách</div>
            <h2>Chính sách đặt sân</h2>
            <p>{policy}</p>
        </section>
    );
}

function PlaceholderSection() {
    return (
        <section className={styles.placeholderCard}>
            <div className={styles.sectionLabel}>Placeholder cho phase sau</div>
            <h2>Khu vực mở rộng cho booking, gallery và review</h2>
            <p>
                Layout này đã chứa sẵn vùng nội dung để gắn thêm booking flow, bộ ảnh sân,
                đánh giá và tiện ích mở rộng mà không phải refactor lại toàn bộ trang chi tiết.
            </p>
        </section>
    );
}

export default function PublicFieldDetailPage() {
    const { slug = '' } = useParams();
    const [field, setField] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notFound, setNotFound] = useState(false);
    const [requestKey, setRequestKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function loadFieldDetail() {
            setLoading(true);
            setError('');
            setNotFound(false);

            try {
                const data = await fieldsApi.getPublicFieldDetail(slug);
                if (cancelled) return;
                setField(data ? normalizeFieldDetail(data) : null);
            } catch (err) {
                if (cancelled) return;

                if (err?.response?.status === 404) {
                    setField(null);
                    setNotFound(true);
                } else {
                    setField(null);
                    setError(err?.response?.data?.message || err?.message || 'Không tải được chi tiết sân.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadFieldDetail();

        return () => {
            cancelled = true;
        };
    }, [slug, requestKey]);

    if (loading) {
        return <LoadingState />;
    }

    if (notFound) {
        return (
            <FeedbackState
                title='Không tìm thấy sân'
                description='Slug này không tồn tại hoặc dữ liệu public field chưa được seed đúng như backend contract.'
                actionLabel='Quay lại danh sách sân'
                actionHref='/san'
            />
        );
    }

    if (error) {
        return (
            <FeedbackState
                title='Không tải được chi tiết sân'
                description={error}
                actionLabel='Thử lại'
                onAction={() => setRequestKey((value) => value + 1)}
            />
        );
    }

    if (!field) {
        return (
            <FeedbackState
                title='Chưa có dữ liệu sân'
                description='Trang chi tiết hiện chưa nhận được dữ liệu hợp lệ từ backend.'
                actionLabel='Quay lại danh sách sân'
                actionHref='/san'
            />
        );
    }

    return (
        <div className={styles.page}>
            <FieldDetailHero field={field} />
            <InfoSection field={field} />
            <FieldPolicySection policy={field.bookingPolicy} />
            <PlaceholderSection />
        </div>
    );
}
