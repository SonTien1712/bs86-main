import s from './MapPage.module.scss';

export default function MapResultList({ items, selectedFieldId, onSelect }) {
    return (
        <div className={s.resultsList}>
            {items.map((item) => {
                const selected = item.id === selectedFieldId;

                return (
                    <button
                        className={`${s.resultCard} ${selected ? s.resultCardActive : ''}`}
                        key={item.id ?? item.slug}
                        onClick={() => onSelect(item)}
                        type='button'
                    >
                        <span
                            className={s.resultBullet}
                            style={{ backgroundColor: item.markerColor }}
                            aria-hidden='true'
                        />

                        <div className={s.resultContent}>
                            <div className={s.resultTitleRow}>
                                <div className={s.resultTitle}>{item.name}</div>
                                <span
                                    className={s.resultTypeChip}
                                    style={{ color: item.markerColor }}
                                >
                                    {item.sportIcon} {item.sportLabel}
                                </span>
                            </div>

                            {item.distanceLabel ? (
                                <div className={s.resultDistance}>
                                    {item.distanceLabel} từ khu vực đang xem
                                </div>
                            ) : null}

                            <div className={s.resultAddress}>{item.address}</div>
                            <div className={s.resultMeta}>🕒 {item.openingHours}</div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
