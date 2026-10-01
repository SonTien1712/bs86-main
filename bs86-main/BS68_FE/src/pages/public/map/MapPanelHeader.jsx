import s from './MapPage.module.scss';

export default function MapPanelHeader({
    mode,
    selectedField,
    panelOpen,
    onBack,
    onClose
}) {
    const title =
        mode === 'detail' && selectedField
            ? selectedField.name
            : 'Bản đồ sân công khai';

    return (
        <div className={s.panelTop}>
            <button
                className={s.iconButton}
                onClick={mode === 'detail' ? onBack : onClose}
                type='button'
            >
                {mode === 'detail' ? '←' : '✕'}
            </button>

            <div className={s.panelTitleWrap}>
                <div className={s.panelTitle}>{title}</div>
                <div className={s.panelSubtitle}>
                    {mode === 'detail'
                        ? 'Xem nhanh thông tin và thao tác tiếp theo'
                        : panelOpen
                          ? 'Mở thanh tìm kiếm và danh sách sân gần khu vực này'
                          : 'Bật lại thanh tìm kiếm để xem marker gần đây'}
                </div>
            </div>

            {mode === 'detail' ? (
                <button className={s.iconButton} onClick={onClose} type='button'>
                    ✕
                </button>
            ) : (
                <span className={s.panelHint}>Map</span>
            )}
        </div>
    );
}
