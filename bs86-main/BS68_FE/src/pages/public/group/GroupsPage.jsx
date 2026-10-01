import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { groupApi } from '../../../api/groupApi';
import GroupFormModal from './GroupFormModal';
import {
    getErrorMessage,
    getRoleLabel,
    getStatusLabel,
    getStoredToken,
    normalizeGroup
} from './groupPage.utils';
import styles from './GroupsPage.module.scss';

function GroupsLoadingState() {
    return (
        <div className={styles.grid}>
            {Array.from({ length: 3 }).map((_, index) => (
                <div className={styles.skeletonCard} key={`group-skeleton-${index}`}>
                    <span className={styles.skeletonLineShort} />
                    <span className={styles.skeletonLine} />
                    <span className={styles.skeletonLine} />
                    <span className={styles.skeletonLineTiny} />
                </div>
            ))}
        </div>
    );
}

function FeedbackState({ title, description, actionLabel, actionHref, onAction }) {
    return (
        <div className={styles.feedbackCard}>
            <div className={styles.feedbackIcon}>G</div>
            <h2>{title}</h2>
            <p>{description}</p>
            {actionLabel ? (
                actionHref ? (
                    <Link className={styles.primaryButton} to={actionHref}>
                        {actionLabel}
                    </Link>
                ) : (
                    <button className={styles.primaryButton} onClick={onAction} type='button'>
                        {actionLabel}
                    </button>
                )
            ) : null}
        </div>
    );
}

function GroupCard({ group }) {
    return (
        <Link className={styles.card} to={`/groups/${group.id}`}>
            <div className={styles.cardTop}>
                <div>
                    <div className={styles.cardEyebrow}>My Group</div>
                    <h2>{group.name}</h2>
                </div>
                <span className={styles.statusBadge}>{getStatusLabel(group.status)}</span>
            </div>

            <p className={styles.cardDescription}>{group.description}</p>

            <dl className={styles.metaGrid}>
                <div>
                    <dt>Thành viên</dt>
                    <dd>{group.memberCount}</dd>
                </div>
                <div>
                    <dt>Vai trò</dt>
                    <dd>{getRoleLabel(group.myRole)}</dd>
                </div>
            </dl>

            <div className={styles.cardAction}>Mở chi tiết nhóm</div>
        </Link>
    );
}

export default function GroupsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const hasToken = Boolean(getStoredToken());
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(hasToken);
    const [error, setError] = useState('');
    const [requestKey, setRequestKey] = useState(0);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (!location.state?.successMessage) return;

        setSuccessMessage(location.state.successMessage);
        navigate(location.pathname, { replace: true, state: {} });
    }, [location.pathname, location.state, navigate]);

    useEffect(() => {
        if (!hasToken) {
            setGroups([]);
            setLoading(false);
            setError('');
            return;
        }

        let cancelled = false;

        async function loadGroups() {
            setLoading(true);
            setError('');

            try {
                const data = await groupApi.getMyGroups();
                if (cancelled) return;
                const items = Array.isArray(data) ? data.map(normalizeGroup) : [];
                setGroups(items);
            } catch (requestError) {
                if (cancelled) return;
                setGroups([]);
                setError(getErrorMessage(requestError, 'Không tải được danh sách nhóm.'));
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadGroups();

        return () => {
            cancelled = true;
        };
    }, [hasToken, requestKey]);

    async function handleCreateGroup(payload) {
        setCreating(true);
        setCreateError('');

        try {
            const created = normalizeGroup(await groupApi.createGroup(payload));
            setShowCreateModal(false);
            navigate(`/groups/${created.id}`, {
                state: { successMessage: 'Đã tạo nhóm thành công.' }
            });
        } catch (requestError) {
            setCreateError(getErrorMessage(requestError, 'Không tạo được nhóm mới.'));
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className={styles.page}>
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <p className={styles.eyebrow}>Groups</p>
                    <h1>Nhóm của tôi</h1>
                    <p className={styles.heroDescription}>
                        Tạo nhóm, quản lý thông tin cơ bản, tạo invite link và giữ sân
                        cấu trúc mở rộng cho members/chat ở phase tiếp theo.
                    </p>

                    <div className={styles.heroActions}>
                        {hasToken ? (
                            <button
                                className={styles.primaryButton}
                                onClick={() => {
                                    setCreateError('');
                                    setShowCreateModal(true);
                                }}
                                type='button'
                            >
                                Tạo nhóm mới
                            </button>
                        ) : (
                            <Link className={styles.primaryButton} to='/auth'>
                                Đăng nhập để tạo nhóm
                            </Link>
                        )}

                        <span className={styles.statPill}>
                            {hasToken ? `${groups.length} nhóm` : 'Cần đăng nhập'}
                        </span>
                    </div>
                </div>
            </section>

            <section className={styles.content}>
                {successMessage ? <div className={styles.successBanner}>{successMessage}</div> : null}

                {!hasToken ? (
                    <FeedbackState
                        title='Bạn chưa đăng nhập'
                        description='Trang Nhóm của tôi cần token hiện tại để gọi /api/groups/my và các thao tác quản lý nhóm.'
                        actionLabel='Mở trang đăng nhập'
                        actionHref='/auth'
                    />
                ) : null}

                {hasToken && loading ? <GroupsLoadingState /> : null}

                {hasToken && !loading && error ? (
                    <FeedbackState
                        title='Không tải được danh sách nhóm'
                        description={error}
                        actionLabel='Thử lại'
                        onAction={() => setRequestKey((value) => value + 1)}
                    />
                ) : null}

                {hasToken && !loading && !error && groups.length === 0 ? (
                    <FeedbackState
                        title='Bạn chưa tham gia nhóm nào'
                        description='Hãy tạo nhóm đầu tiên để bắt đầu flow group phase 1 và 2, hoặc mở invite link để tham gia nhóm có sẵn.'
                        actionLabel='Tạo nhóm mới'
                        onAction={() => {
                            setCreateError('');
                            setShowCreateModal(true);
                        }}
                    />
                ) : null}

                {hasToken && !loading && !error && groups.length > 0 ? (
                    <div className={styles.grid}>
                        {groups.map((group) => (
                            <GroupCard group={group} key={group.id} />
                        ))}
                    </div>
                ) : null}
            </section>

            <GroupFormModal
                open={showCreateModal}
                title='Tạo nhóm mới'
                submitLabel='Tạo nhóm'
                submitting={creating}
                errorMessage={createError}
                onClose={() => {
                    if (creating) return;
                    setShowCreateModal(false);
                    setCreateError('');
                }}
                onSubmit={handleCreateGroup}
            />
        </div>
    );
}

