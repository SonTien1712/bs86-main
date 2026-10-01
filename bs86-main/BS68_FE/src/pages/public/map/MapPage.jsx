import { useEffect, useState } from 'react';
import FieldMap from '../../../components/map/FieldMap';
import { fieldsApi } from '../../../api/fieldsApi';
import MapDetailPanel from './MapDetailPanel';
import MapFloatingTools from './MapFloatingTools';
import MapListState from './MapListState';
import MapPanelHeader from './MapPanelHeader';
import MapResultList from './MapResultList';
import MapSearchBar from './MapSearchBar';
import s from './MapPage.module.scss';
import {
    DEFAULT_CENTER,
    DEFAULT_NEARBY_LIMIT,
    SPORT_FILTERS,
    calculateDistanceKm,
    formatDistance,
    getNearbyAnchor,
    getSportMeta,
    isValidBounds,
    normalizeDetail,
    normalizeMarker,
    useDebounce
} from './mapPage.utils';
import { useLocation, useNavigate } from 'react-router-dom';

export default function MapPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const [activeSportType, setActiveSportType] = useState('ALL');
    const [panelOpen, setPanelOpen] = useState(false);
    const [panelMode, setPanelMode] = useState('list');
    const [query, setQuery] = useState('');
    const [bounds, setBounds] = useState(null);
    const debouncedBounds = useDebounce(bounds, 250);

    const [markers, setMarkers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedField, setSelectedField] = useState(null);
    const [focusTarget, setFocusTarget] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');
    const [detailCache, setDetailCache] = useState({});
    const [routeFocusedField, setRouteFocusedField] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationMessage, setLocationMessage] = useState('');

    useEffect(() => {
        const previousBodyOverflow = document.body.style.overflow;
        const previousDocumentOverflow = document.documentElement.style.overflow;
        const rootElement = document.getElementById('root');
        const previousRootOverflow = rootElement?.style.overflow ?? '';

        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        if (rootElement) {
            rootElement.style.overflow = 'hidden';
        }

        return () => {
            document.body.style.overflow = previousBodyOverflow;
            document.documentElement.style.overflow = previousDocumentOverflow;
            if (rootElement) {
                rootElement.style.overflow = previousRootOverflow;
            }
        };
    }, []);

    useEffect(() => {
        if (!isValidBounds(debouncedBounds)) return;

        let cancelled = false;

        async function loadMarkers() {
            setLoading(true);
            setError('');

            try {
                const params = { ...debouncedBounds };
                if (activeSportType !== 'ALL') {
                    params.type = activeSportType;
                }

                const data = await fieldsApi.getMapMarkers(params);
                if (!cancelled) {
                    setMarkers(Array.isArray(data) ? data.map(normalizeMarker) : []);
                }
            } catch (err) {
                if (!cancelled) {
                    setMarkers([]);
                    setError(
                        err?.response?.data?.message ||
                            err?.message ||
                            'Không tải được dữ liệu bản đồ.'
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadMarkers();

        return () => {
            cancelled = true;
        };
    }, [debouncedBounds, activeSportType]);

    useEffect(() => {
        if (!selectedField?.id) return;

        const updatedField = markers.find((item) => item.id === selectedField.id);
        if (!updatedField) {
            if (routeFocusedField?.id === selectedField.id) return;

            setSelectedField(null);
            setPanelMode('list');
            setDetailError('');
            return;
        }

        setSelectedField({
            ...updatedField,
            ...(detailCache[updatedField.slug] ?? {})
        });
    }, [markers, detailCache, routeFocusedField?.id, selectedField?.id]);

    const normalizedQuery = query.trim().toLowerCase();
    const visibleMarkers = markers.filter((item) => {
        if (!normalizedQuery) return true;

        return [item.name, item.address, item.sportLabel].some((value) =>
            String(value).toLowerCase().includes(normalizedQuery)
        );
    });

    const nearbyAnchor = getNearbyAnchor(debouncedBounds, userLocation);
    const nearbyMarkers = [...visibleMarkers]
        .map((item) => {
            const distanceKm = calculateDistanceKm(nearbyAnchor, item);
            return {
                ...item,
                distanceKm,
                distanceLabel: formatDistance(distanceKm)
            };
        })
        .sort((left, right) => {
            const leftDistance = left.distanceKm ?? Number.POSITIVE_INFINITY;
            const rightDistance = right.distanceKm ?? Number.POSITIVE_INFINITY;
            return leftDistance - rightDistance;
        })
        .slice(0, DEFAULT_NEARBY_LIMIT);

    const displayMarkers = normalizedQuery ? visibleMarkers : nearbyMarkers;

    async function handleSelectField(field, options = {}) {
        const { shouldFocus = true } = options;
        const normalizedField = normalizeMarker(field);
        const cachedDetail = normalizedField.slug
            ? detailCache[normalizedField.slug]
            : null;

        if (shouldFocus) {
            setFocusTarget(normalizedField);
        }

        setPanelOpen(true);
        setPanelMode('detail');
        setDetailError('');
        setSelectedField({
            ...normalizedField,
            ...(cachedDetail ?? {})
        });

        if (!normalizedField.slug || cachedDetail) {
            setDetailLoading(false);
            return;
        }

        setDetailLoading(true);

        try {
            const detailData = await fieldsApi.getPublicFieldDetail(normalizedField.slug);
            const normalizedDetailData = normalizeDetail(detailData);

            setDetailCache((current) => ({
                ...current,
                [normalizedField.slug]: normalizedDetailData
            }));

            setSelectedField((current) => {
                if (!current || current.slug !== normalizedField.slug) return current;
                return { ...current, ...normalizedDetailData };
            });
        } catch (err) {
            setDetailError(
                err?.response?.data?.message ||
                    err?.message ||
                    'Không tải được chi tiết sân.'
            );
        } finally {
            setDetailLoading(false);
        }
    }

    function handleChangeFilter(nextType) {
        setActiveSportType(nextType);
        setQuery('');
        setPanelMode('list');
        setDetailError('');

        if (selectedField && nextType !== 'ALL' && selectedField.sportType !== nextType) {
            setSelectedField(null);
        }
    }

    function handleToggleSearchPanel() {
        if (panelOpen && panelMode === 'list') {
            setPanelOpen(false);
            return;
        }

        setPanelOpen(true);
        setPanelMode('list');
        setDetailError('');
    }

    function handleLocateMe() {
        if (!navigator.geolocation) {
            setLocationMessage('Trình duyệt này không hỗ trợ định vị.');
            console.error('[MapPage] Geolocation unsupported by browser');
            return;
        }

        setLocationLoading(true);
        setLocationMessage('');

        if (navigator.permissions?.query) {
            navigator.permissions
                .query({ name: 'geolocation' })
                .then((result) => {
                    console.info(
                        `[MapPage] Geolocation permission state: ${result.state}`
                    );
                })
                .catch((permissionError) => {
                    console.warn(
                        '[MapPage] Unable to read geolocation permission state',
                        permissionError
                    );
                });
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const nextLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };

                console.info('[MapPage] Geolocation success', {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });

                setUserLocation(nextLocation);
                setFocusTarget(nextLocation);
                setLocationLoading(false);
                setLocationMessage('Đã xác định vị trí hiện tại của bạn.');
            },
            (geoError) => {
                setLocationLoading(false);
                console.error('[MapPage] Geolocation error', {
                    code: geoError?.code,
                    message: geoError?.message
                });

                if (geoError?.code === 1) {
                    setLocationMessage('Bạn đã từ chối quyền truy cập vị trí.');
                    return;
                }

                if (geoError?.code === 2) {
                    setLocationMessage(
                        'Không thể xác định vị trí hiện tại. Hãy kiểm tra GPS, Wi-Fi hoặc Location trên máy.'
                    );
                    return;
                }

                if (geoError?.code === 3) {
                    setLocationMessage(
                        'Hết thời gian lấy vị trí. Hãy thử lại ở nơi có sóng GPS/Wi-Fi tốt hơn.'
                    );
                    return;
                }

                setLocationMessage(
                    geoError?.message || 'Lấy vị trí thất bại. Vui lòng thử lại.'
                );
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    }

    useEffect(() => {
        const autoLocate = location.state?.autoLocate;
        const focusField = location.state?.focusField;

        if (!autoLocate && !focusField) return;

        if (focusField) {
            const normalizedFocusField = normalizeMarker(focusField);

            setRouteFocusedField(normalizedFocusField);
            setFocusTarget(normalizedFocusField);
            setSelectedField(normalizedFocusField);
            setPanelOpen(true);
            setPanelMode('detail');
            setDetailError('');
        }

        if (autoLocate) {
            handleLocateMe();
        }

        navigate(location.pathname, { replace: true, state: null });
    }, [location.pathname, location.state, navigate]);

    useEffect(() => {
        if (!routeFocusedField?.id) return;

        const matchedMarker = markers.find((item) => item.id === routeFocusedField.id);
        if (!matchedMarker) return;

        handleSelectField(matchedMarker, { shouldFocus: false });
        setRouteFocusedField(null);
    }, [markers, routeFocusedField?.id]);

    return (
        <div className={s.mapShell}>
            <div className={s.mapCanvas}>
                <FieldMap
                    defaultCenter={DEFAULT_CENTER}
                    focusMarker={focusTarget}
                    markers={visibleMarkers}
                    onFocusHandled={() => setFocusTarget(null)}
                    onBoundsChange={setBounds}
                    onSelect={handleSelectField}
                    selectedMarkerId={selectedField?.id}
                    userLocation={userLocation}
                />
            </div>

            <div className={`${s.leftPanel} ${panelOpen ? '' : s.hiddenPanel}`}>
                <MapPanelHeader
                    mode={panelMode}
                    onBack={() => {
                        setPanelMode('list');
                        setDetailError('');
                    }}
                    onClose={() => setPanelOpen(false)}
                    panelOpen={panelOpen}
                    selectedField={selectedField}
                />

                {panelMode === 'list' ? (
                    <div className={s.panelBody}>
                        <MapSearchBar
                            onChange={setQuery}
                            onClear={() => setQuery('')}
                            query={query}
                        />

                        <div className={s.resultsMeta}>
                            <span>
                                {loading
                                    ? 'Đang tải sân...'
                                    : normalizedQuery
                                      ? `${displayMarkers.length} kết quả`
                                      : `${displayMarkers.length} marker gần nhất`}
                            </span>
                            <span>
                                {activeSportType === 'ALL'
                                    ? normalizedQuery
                                        ? 'Tất cả loại sân'
                                        : 'Quanh khu vực đang xem'
                                    : getSportMeta(activeSportType).label}
                            </span>
                        </div>

                        {loading ? (
                            <MapListState
                                description='Đang lấy dữ liệu sân trong vùng bản đồ hiện tại.'
                                title='Đang tải bản đồ'
                            />
                        ) : null}

                        {!loading && error ? (
                            <MapListState
                                actionLabel='Tải lại'
                                description={error}
                                onAction={() => setBounds({ ...debouncedBounds })}
                                title='Không tải được dữ liệu'
                            />
                        ) : null}

                        {!loading && !error && displayMarkers.length === 0 ? (
                            <MapListState
                                actionLabel={query ? 'Xóa tìm kiếm' : undefined}
                                description={
                                    query
                                        ? 'Không có sân nào khớp từ khóa trong vùng bản đồ này.'
                                        : 'Chưa có marker gần đây trong vùng nhìn hiện tại. Hãy rê bản đồ sang khu vực khác hoặc zoom out.'
                                }
                                onAction={query ? () => setQuery('') : undefined}
                                title='Không có sân phù hợp'
                            />
                        ) : null}

                        {!loading && !error && displayMarkers.length > 0 ? (
                            <MapResultList
                                items={displayMarkers}
                                onSelect={handleSelectField}
                                selectedFieldId={selectedField?.id}
                            />
                        ) : null}
                    </div>
                ) : selectedField ? (
                    <div className={s.panelBody}>
                        <MapDetailPanel
                            error={detailError}
                            field={selectedField}
                            loading={detailLoading}
                            onBack={() => {
                                setPanelMode('list');
                                setDetailError('');
                            }}
                        />
                    </div>
                ) : null}
            </div>

            <div className={`${s.chipRow} ${panelOpen ? s.chipRowShifted : ''}`}>
                {SPORT_FILTERS.map((filter) => {
                    const active = activeSportType === filter.key;

                    return (
                        <button
                            className={`${s.chip} ${active ? s.chipActive : ''}`}
                            key={filter.key}
                            onClick={() => handleChangeFilter(filter.key)}
                            type='button'
                        >
                            <span
                                className={s.chipIcon}
                                style={{
                                    backgroundColor: active
                                        ? filter.color
                                        : `${filter.color}18`,
                                    color: active ? '#ffffff' : filter.color
                                }}
                            >
                                {filter.icon}
                            </span>
                            <span className={s.chipText}>{filter.label}</span>
                        </button>
                    );
                })}
            </div>

            <MapFloatingTools
                locationLoading={locationLoading}
                onLocateMe={handleLocateMe}
                onToggleSearchPanel={handleToggleSearchPanel}
                panelMode={panelMode}
                panelOpen={panelOpen}
                userLocation={userLocation}
            />

            {locationMessage ? (
                <div className={s.locationMessage}>{locationMessage}</div>
            ) : null}
        </div>
    );
}
