import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fieldsApi } from '../../../api/fieldsApi';
import { getSportLabel } from '../../../constants/sportTypes';
import styles from './PublicFieldsPage.module.css';

const FIELD_FALLBACK_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="100%" stop-color="#14532d"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="720" fill="url(#bg)"/>
  <circle cx="988" cy="120" r="180" fill="rgba(255,255,255,0.12)"/>
  <circle cx="208" cy="620" r="230" fill="rgba(255,255,255,0.1)"/>
  <text x="72" y="332" fill="#f8fafc" font-family="Arial, sans-serif" font-size="86" font-weight="700">Sân thể thao</text>
  <text x="72" y="424" fill="#d1fae5" font-family="Arial, sans-serif" font-size="34">Hình ảnh đang được cập nhật</text>
</svg>
`)}`;

function getSafeValue(value, fallback) {
    return value ? value : fallback;
}

function normalizeField(field, index) {
    return {
        id: field?.id ?? `field-${index}`,
        name: getSafeValue(field?.name, 'Sân đang cập nhật tên'),
        slug: field?.slug ?? '',
        address: getSafeValue(field?.address, 'Địa chỉ đang được cập nhật'),
        sportTypeKey: field?.sportType ?? 'OTHER',
        sportType: getSafeValue(getSportLabel(field?.sportType || 'OTHER'), 'Khác'),
        openingHours: getSafeValue(field?.openingHours, 'Giờ hoạt động đang được cập nhật'),
        coverImageUrl: field?.coverImageUrl ?? '',
        latitude: field?.latitude,
        longitude: field?.longitude
    };
}

function FieldCard({ field }) {
    const [imageFailed, setImageFailed] = useState(false);
    const imageSrc = !imageFailed && field.coverImageUrl ? field.coverImageUrl : FIELD_FALLBACK_IMAGE;
    const detailPath = field.slug ? `/san/${field.slug}` : '/san';
    const mapState = {
        focusField: {
            id: field.id,
            slug: field.slug,
            name: field.name,
            address: field.address,
            sportType: field.sportTypeKey,
            openingHours: field.openingHours,
            latitude: field.latitude,
            longitude: field.longitude,
            coverImageUrl: field.coverImageUrl
        }
    };

    return (
        <article className={styles.card}>
            <Link className={styles.cardMedia} to={detailPath} aria-label={`Xem chi tiết ${field.name}`}>
                <img
                    src={imageSrc}
                    alt={field.name}
                    loading='lazy'
                    onError={() => setImageFailed(true)}
                />
                <span className={styles.sportBadge}>{field.sportType}</span>
            </Link>

            <div className={styles.cardBody}>
                <div className={styles.cardMeta}>Sân công khai</div>
                <h2 className={styles.cardTitle}>{field.name}</h2>

                <dl className={styles.infoList}>
                    <div className={styles.infoItem}>
                        <dt>Địa chỉ</dt>
                        <dd>{field.address}</dd>
                    </div>
                    <div className={styles.infoItem}>
                        <dt>Giờ mở cửa</dt>
                        <dd>{field.openingHours}</dd>
                    </div>
                </dl>

                <div className={styles.cardActions}>
                    {typeof field.id === 'number' ? (
                        <Link className={styles.bookingButton} to={`/booking/${field.id}`}>
                            Đặt lịch
                        </Link>
                    ) : (
                        <span className={styles.bookingButtonDisabled}>Đặt lịch</span>
                    )}

                    <Link className={styles.primaryButton} to={detailPath}>
                        Xem chi tiết
                    </Link>

                    <Link className={styles.secondaryButton} to='/map' state={mapState}>
                        Xem bản đồ
                    </Link>
                </div>
            </div>
        </article>
    );
}

function LoadingState() {
    return (
        <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, index) => (
                <div className={styles.skeletonCard} key={`skeleton-${index}`}>
                    <div className={styles.skeletonMedia} />
                    <div className={styles.skeletonBody}>
                        <span className={styles.skeletonLineShort} />
                        <span className={styles.skeletonLine} />
                        <span className={styles.skeletonLine} />
                        <span className={styles.skeletonLineTiny} />
                    </div>
                </div>
            ))}
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
            <h2>{title}</h2>
            <p>{description}</p>
            {actionLabel ? action : null}
        </div>
    );
}

export default function PublicFieldsPage() {
    const [fields, setFields] = useState([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [requestKey, setRequestKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function loadFields() {
            setLoading(true);
            setError('');

            try {
                const data = await fieldsApi.getPublicFields();
                if (cancelled) return;
                setFields(Array.isArray(data) ? data : []);
            } catch (err) {
                if (cancelled) return;
                setFields([]);
                setError(err?.response?.data?.message || err?.message || 'Không tải được danh sách sân.');
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadFields();

        return () => {
            cancelled = true;
        };
    }, [requestKey]);

    const normalizedFields = fields.map(normalizeField);
    const normalizedQuery = query.trim().toLowerCase();
    const visibleFields = normalizedFields.filter((field) => {
        if (!normalizedQuery) return true;

        return [field.name, field.address, field.sportType].some((value) =>
            value.toLowerCase().includes(normalizedQuery)
        );
    });

    return (
        <div className={styles.page}>
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <p className={styles.eyebrow}>Public Fields</p>
                    <h1>Danh sách sân công khai</h1>
                    <p className={styles.heroDescription}>
                        Xem nhanh thông tin sân, giờ hoạt động và đi vào trang chi tiết theo slug
                        để mở rộng tiếp cho booking ở phase sau.
                    </p>

                    <div className={styles.heroActions}>
                        <Link className={styles.primaryButton} to='/map'>
                            Khám phá trên bản đồ
                        </Link>
                        <span className={styles.statPill}>
                            {loading ? 'Đang tải...' : `${visibleFields.length} sân hiển thị`}
                        </span>
                    </div>
                </div>

                <div className={styles.searchPanel}>
                    <label className={styles.searchLabel} htmlFor='public-field-search'>
                        Tìm sân theo tên, địa chỉ hoặc môn thể thao
                    </label>
                    <input
                        id='public-field-search'
                        className={styles.searchInput}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder='Ví dụ: Thủ Đức, bóng đá, sân A'
                    />
                </div>
            </section>

            <section className={styles.content}>
                {loading ? <LoadingState /> : null}

                {!loading && error ? (
                    <FeedbackState
                        title='Không tải được danh sách sân'
                        description={error}
                        actionLabel='Thử lại'
                        onAction={() => setRequestKey((value) => value + 1)}
                    />
                ) : null}

                {!loading && !error && visibleFields.length === 0 ? (
                    <FeedbackState
                        title={fields.length === 0 ? 'Chưa có sân công khai' : 'Không tìm thấy sân phù hợp'}
                        description={
                            fields.length === 0
                                ? 'Backend chưa trả về dữ liệu sân công khai cho danh sách này.'
                                : 'Hãy thử đổi từ khóa tìm kiếm hoặc quay lại bản đồ để xem khu vực khác.'
                        }
                        actionLabel={fields.length === 0 ? 'Mở bản đồ' : 'Xóa bộ lọc'}
                        actionHref={fields.length === 0 ? '/map' : undefined}
                        onAction={fields.length === 0 ? undefined : () => setQuery('')}
                    />
                ) : null}

                {!loading && !error && visibleFields.length > 0 ? (
                    <div className={styles.grid}>
                        {visibleFields.map((field) => (
                            <FieldCard field={field} key={field.id} />
                        ))}
                    </div>
                ) : null}
            </section>
        </div>
    );
}
