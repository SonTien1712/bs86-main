import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownerApi } from '../../../api/ownerApi';
import FormManageFields from '../../../components/owner/FormManageFields';
import FormAddField from '../../../components/owner/panels/FormAddField';
import FormAddCourts from '../../../components/owner/panels/FormAddCourts';
import FormPriceTemplate from '../../../components/owner/panels/FormPriceTemplate';
import FormOverridePrice from '../../../components/owner/panels/FormOverridePrice';
import OwnerFinancePanel from '../../../components/owner/finance/OwnerFinancePanel';
import styles from './OwnerManagementPanels.module.scss';

const TABS = [
    {
        id: 'addField',
        navLabel: 'Cụm sân',
        step: '01',
        title: 'Đăng ký cụm sân mới',
        description: 'Tạo field mới, định vị trên bản đồ và hoàn thiện thông tin cơ bản theo từng nhóm input.'
    },
    {
        id: 'addCourts',
        navLabel: 'Sân lẻ',
        step: '02',
        title: 'Quản lý court theo field',
        description: 'Thêm court theo dãy số, tải lại danh sách và kiểm tra trạng thái template ngay trong một panel.'
    },
    {
        id: 'priceTemplate',
        navLabel: 'Bảng giá',
        step: '03',
        title: 'Template giá và khung giờ',
        description: 'Chọn field, chọn court, cấu hình giờ mở cửa, thời lượng ca và giá cơ bản.'
    },
    {
        id: 'overridePrice',
        navLabel: 'Ưu đãi',
        step: '04',
        title: 'Ưu đãi, override và deal',
        description: 'Chọn slot thực tế trong ngày, để giá từng khung và đăng bài ưu đãi nhanh cho owner.'
    },
    {
        id: 'manageFields',
        navLabel: 'Cài đặt',
        step: '05',
        title: 'Cập nhật field đã tạo',
        description: 'Chỉnh sửa thông tin cơ bản, chi tiết, ảnh bìa và toàn bộ thiết lập của field đang hoạt động.'
    },
    {
        id: 'finance',
        navLabel: 'Tài chính',
        step: '06',
        title: 'Ví tiền, rút tiền và ăn chia',
        description: 'Theo dõi số dư chờ admin chuyển, cập nhật tài khoản nhận tiền và gửi yêu cầu rút tiền.'
    }
];

function getStatusType(status) {
    switch (String(status || '').toUpperCase()) {
        case 'ACTIVE':
            return 'good';
        case 'PENDING_VERIFICATION':
            return 'warn';
        case 'INACTIVE':
            return 'muted';
        default:
            return 'muted';
    }
}

function getStatusLabel(status) {
    switch (String(status || '').toUpperCase()) {
        case 'ACTIVE':
            return 'Đang hoạt động';
        case 'PENDING_VERIFICATION':
            return 'Chờ duyệt';
        case 'INACTIVE':
            return 'Tạm dừng';
        default:
            return status || 'Không rõ';
    }
}

export default function OwnerManagementPanels() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('addField');
    const [fields, setFields] = useState([]);
    const [loadingFields, setLoadingFields] = useState(true);
    const [fieldsError, setFieldsError] = useState('');

    const loadFields = async () => {
        setLoadingFields(true);
        setFieldsError('');

        try {
            const data = await ownerApi.getMyFields();
            setFields(Array.isArray(data) ? data : []);
        } catch (error) {
            setFields([]);
            setFieldsError(
                error?.response?.data?.message ||
                    error?.message ||
                    'Không tải được danh sách field của bạn.'
            );
        } finally {
            setLoadingFields(false);
        }
    };

    useEffect(() => {
        loadFields();
    }, []);

    const activeMeta = useMemo(
        () => TABS.find((tab) => tab.id === activeTab) || TABS[0],
        [activeTab]
    );

    const stats = useMemo(() => {
        const total = fields.length;
        const active = fields.filter(
            (field) => String(field?.status || '').toUpperCase() === 'ACTIVE'
        ).length;
        const pending = fields.filter(
            (field) => String(field?.status || '').toUpperCase() === 'PENDING_VERIFICATION'
        ).length;
        const inactive = fields.filter(
            (field) => String(field?.status || '').toUpperCase() === 'INACTIVE'
        ).length;

        return [
            {
                label: 'Tổng field',
                value: total,
                caption: total > 0 ? 'Hệ thống sân đang quản lý' : 'Chưa có field nào'
            },
            {
                label: 'Field ACTIVE',
                value: active,
                caption: 'Sân đang sẵn sàng cho public booking'
            },
            {
                label: 'Chờ duyệt',
                value: pending,
                caption: 'Hồ sơ đang đợi admin xác nhận'
            },
            {
                label: 'Tạm dừng',
                value: inactive,
                caption: 'Kiểm tra lại để mở bán trở lại'
            }
        ];
    }, [fields]);

    return (
        <section className={styles.container}>
            <div className={styles.hero}>
                <div className={styles.heroCopy}>
                    <div className={styles.heroEyebrow}>Trung tâm điều hành chủ sân</div>
                    <h2 className={styles.heroTitle}>Hệ thống quản lý sân thể thao</h2>
                    <p className={styles.heroDesc}>
                        Quản lý field, court, bảng giá và chương trình ưu đãi trong cùng một
                        dashboard. Mỗi tab đều giữ nguyên logic API hiện tại, nhưng được gom lại
                        theo card system để dễ theo dõi hơn.
                    </p>
                </div>

                <div className={styles.heroActions}>
                    <button className={styles.secondaryAction} onClick={loadFields} type='button'>
                        Làm mới dữ liệu
                    </button>
                    <button
                        className={styles.primaryAction}
                        onClick={() => setActiveTab('addField')}
                        type='button'
                    >
                        Tạo field mới
                    </button>
                    <button
                        className={styles.secondaryAction}
                        onClick={() => navigate('/owner/check-in')}
                        type='button'
                    >
                        Quét vé
                    </button>
                </div>
            </div>

            <div className={styles.summaryGrid}>
                {stats.map((item) => (
                    <article className={styles.summaryCard} key={item.label}>
                        <div className={styles.summaryLabel}>{item.label}</div>
                        <div className={styles.summaryValue}>{item.value}</div>
                        <div className={styles.summaryText}>{item.caption}</div>
                    </article>
                ))}
            </div>

            <div className={styles.workspaceLayout}>
                <aside className={styles.sideNav}>
                    <div className={styles.sideNavTitle}>Khu vực làm việc</div>
                    <div className={styles.navList}>
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    className={`${styles.navItem} ${
                                        isActive ? styles.navItemActive : ''
                                    }`}
                                    onClick={() => setActiveTab(tab.id)}
                                    type='button'
                                >
                                    <span className={styles.navStep}>{tab.step}</span>
                                    <span className={styles.navBody}>
                                        <span className={styles.navLabel}>{tab.navLabel}</span>
                                        <span className={styles.navDescription}>{tab.description}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className={styles.sideHelperCard}>
                        <div className={styles.sideHelperTitle}>Tình trạng field</div>
                        {loadingFields ? (
                            <div className={styles.sideHelperText}>Đang đồng bộ danh sách field...</div>
                        ) : fields.length === 0 ? (
                            <div className={styles.sideHelperText}>Chưa có field nào để hiển thị trong dashboard.</div>
                        ) : (
                            <div className={styles.statusStack}>
                                {fields.slice(0, 4).map((field) => (
                                    <div className={styles.statusRow} key={field.id}>
                                        <span>{field.name}</span>
                                        <span
                                            className={`${styles.statusPill} ${styles[getStatusType(field.status)]}`}
                                        >
                                            {getStatusLabel(field.status)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                <section className={styles.mainPanel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <div className={styles.panelEyebrow}>{activeMeta.navLabel}</div>
                            <h3 className={styles.panelTitle}>{activeMeta.title}</h3>
                            <p className={styles.panelDesc}>{activeMeta.description}</p>
                        </div>
                    </div>

                    {fieldsError ? (
                        <div className={`${styles.msg} ${styles.error}`}>{fieldsError}</div>
                    ) : null}

                    <div className={styles.panelContent}>
                        {activeTab === 'addField' ? <FormAddField onCreated={loadFields} /> : null}
                        {activeTab === 'addCourts' ? (
                            <FormAddCourts
                                fields={fields}
                                loadingFields={loadingFields}
                                fieldsError={fieldsError}
                            />
                        ) : null}
                        {activeTab === 'priceTemplate' ? (
                            <FormPriceTemplate
                                fields={fields}
                                loadingFields={loadingFields}
                                fieldsError={fieldsError}
                            />
                        ) : null}
                        {activeTab === 'overridePrice' ? (
                            <FormOverridePrice
                                fields={fields}
                                loadingFields={loadingFields}
                                fieldsError={fieldsError}
                            />
                        ) : null}
                        {activeTab === 'manageFields' ? <FormManageFields /> : null}
                        {activeTab === 'finance' ? <OwnerFinancePanel /> : null}
                    </div>
                </section>
            </div>
        </section>
    );
}
