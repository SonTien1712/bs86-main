import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { groupApi } from '../../../api/groupApi';
import GroupFormModal from './GroupFormModal';
import {
    getErrorMessage,
    getRoleLabel,
    getStatusLabel,
    normalizeGroup
} from './groupPage.utils';
import styles from './AccountGroupsSection.module.scss';

function LoadingState() {
    return (
        <div className={styles.list}>
            {Array.from({ length: 2 }).map((_, index) => (
                <div className={styles.skeletonCard} key={`account-group-skeleton-${index}`}>
                    <span className={styles.skeletonLineShort} />
                    <span className={styles.skeletonLine} />
                    <span className={styles.skeletonLineTiny} />
                </div>
            ))}
        </div>
    );
}

export default function AccountGroupsSection() {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createError, setCreateError] = useState('');
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState('');
    const [requestKey, setRequestKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function loadGroups() {
            setLoading(true);
            setError('');

            try {
                const data = await groupApi.getMyGroups();
                if (cancelled) return;
                setGroups(Array.isArray(data) ? data.map(normalizeGroup) : []);
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
    }, [requestKey]);

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
        <section className={styles.section}>
            <div className={styles.header}>
                <div>
                    <div className={styles.eyebrow}>Group</div>
                    <h2>Nhóm chat / giao lưu</h2>
                    <p>
                        Tạo nhóm, vào trang chi tiết nhóm và chia sẻ invite link ngay trong
                        khu vực account.
                    </p>
                </div>

                <div className={styles.actions}>
                    <button
                        className={styles.primaryButton}
                        onClick={() => {
                            setCreateError('');
                            setShowCreateModal(true);
                        }}
                        type='button'
                    >
                        Tạo group
                    </button>
                    <Link className={styles.secondaryButton} to='/groups'>
                        Mở trang group
                    </Link>
                </div>
            </div>

            {message ? <div className={styles.successBanner}>{message}</div> : null}

            {loading ? <LoadingState /> : null}

            {!loading && error ? (
                <div className={styles.feedbackCard}>
                    <div className={styles.feedbackTitle}>Không tải được group</div>
                    <div className={styles.feedbackText}>{error}</div>
                    <button
                        className={styles.primaryButton}
                        onClick={() => setRequestKey((value) => value + 1)}
                        type='button'
                    >
                        Thử lại
                    </button>
                </div>
            ) : null}

            {!loading && !error && groups.length === 0 ? (
                <div className={styles.feedbackCard}>
                    <div className={styles.feedbackTitle}>Bạn chưa có group nào</div>
                    <div className={styles.feedbackText}>
                        Tạo group đầu tiên ngay trong trang account, sau đó có thể vào trang
                        chi tiết để invite thêm thành viên.
                    </div>
                    <button
                        className={styles.primaryButton}
                        onClick={() => {
                            setCreateError('');
                            setShowCreateModal(true);
                        }}
                        type='button'
                    >
                        Tạo group đầu tiên
                    </button>
                </div>
            ) : null}

            {!loading && !error && groups.length > 0 ? (
                <div className={styles.list}>
                    {groups.slice(0, 3).map((group) => (
                        <Link className={styles.card} key={group.id} to={`/groups/${group.id}`}>
                            <div className={styles.cardTop}>
                                <h3>{group.name}</h3>
                                <span className={styles.statusBadge}>
                                    {getStatusLabel(group.status)}
                                </span>
                            </div>
                            <p>{group.description}</p>
                            <div className={styles.metaRow}>
                                <span>{group.memberCount} thành viên</span>
                                <span>{getRoleLabel(group.myRole)}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : null}

            <GroupFormModal
                open={showCreateModal}
                title='Tạo group mới'
                submitLabel='Tạo group'
                submitting={creating}
                errorMessage={createError}
                onClose={() => {
                    if (creating) return;
                    setShowCreateModal(false);
                    setCreateError('');
                }}
                onSubmit={handleCreateGroup}
            />
        </section>
    );
}


