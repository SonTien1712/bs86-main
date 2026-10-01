import { useState } from 'react';
import { Link } from 'react-router-dom';
import s from './MapPage.module.scss';
import { FALLBACK_IMAGE } from './mapPage.utils';

export default function MapDetailPanel({ field, loading, error, onBack }) {
    const [imageFailed, setImageFailed] = useState(false);
    const imageSrc =
        !imageFailed && field?.coverImageUrl ? field.coverImageUrl : FALLBACK_IMAGE;

    return (
        <div className={s.detailPanel}>
            <button className={s.backToList} onClick={onBack} type='button'>
                ← Quay lại danh sách
            </button>

            <div className={s.detailHero}>
                <img
                    alt={field?.name ?? 'Sân'}
                    className={s.detailHeroImage}
                    onError={() => setImageFailed(true)}
                    src={imageSrc}
                />

                <div className={s.detailHeroContent}>
                    <div
                        className={s.detailTypeBadge}
                        style={{
                            backgroundColor: `${field.markerColor}18`,
                            color: field.markerColor
                        }}
                    >
                        {field.sportIcon} {field.sportLabel}
                    </div>
                    <h2 className={s.detailTitle}>{field.name}</h2>
                    <div className={s.detailAddress}>{field.address}</div>

                    <div className={s.detailMetaCardList}>
                        <div className={s.detailMetaCard}>
                            <span>Giờ mở cửa</span>
                            <strong>{field.openingHours}</strong>
                        </div>
                        <div className={s.detailMetaCard}>
                            <span>Liên hệ</span>
                            <strong>{field.phone}</strong>
                        </div>
                    </div>

                    <div className={s.detailActions}>
                        {typeof field.id === 'number' ? (
                            <Link className={s.primaryAction} to={`/booking/${field.id}`}>
                                Đặt lịch
                            </Link>
                        ) : (
                            <span className={s.primaryActionDisabled}>Đặt lịch</span>
                        )}
                        {field.slug ? (
                            <Link className={s.secondaryAction} to={`/san/${field.slug}`}>
                                Xem chi tiết
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className={s.detailLoading}>Đang tải thêm thông tin sân...</div>
            ) : null}

            {error ? <div className={s.detailError}>{error}</div> : null}

            <div className={s.detailSection}>
                <div className={s.detailSectionLabel}>Thông tin</div>
                <p>{field.description || 'Thông tin mô tả đang được cập nhật.'}</p>
            </div>

            <div className={s.detailSection}>
                <div className={s.detailSectionLabel}>Điều khoản</div>
                <p>
                    {field.bookingPolicy ||
                        'Chính sách đặt sân sẽ được cập nhật thêm ở phase sau.'}
                </p>
            </div>
        </div>
    );
}
