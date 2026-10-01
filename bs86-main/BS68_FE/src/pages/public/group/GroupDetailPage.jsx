import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { groupApi } from '../../../api/groupApi';
import GroupFormModal from './GroupFormModal';
import GroupChatSection from './GroupChatSection';
import {
    buildInvitePayload,
    formatDateTime,
    getErrorMessage,
    getMemberStatusLabel,
    getRoleLabel,
    getStatusLabel,
    getStoredToken,
    normalizeGroup,
    normalizeMember
} from './groupPage.utils';
import styles from './GroupDetailPage.module.scss';

function FeedbackState({ title, description, actionLabel, actionHref, onAction }) {
    return (
        <div className={styles.feedbackCard}>
            <div className={styles.feedbackIcon}>G</div>
            <h1>{title}</h1>
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

function LoadingState() {
    return (
        <div className={styles.loadingShell}>
            <div className={styles.loadingHero} />
            <div className={styles.loadingGrid}>
                <div className={styles.loadingCard} />
                <div className={styles.loadingCard} />
            </div>
        </div>
    );
}

function PlaceholderSection({ title, description }) {
    return (
        <div className={styles.placeholderCard}>
            <div className={styles.sectionLabel}>Phase tiếp theo</div>
            <h2>{title}</h2>
            <p>{description}</p>
        </div>
    );
}

function MembersLoadingState() {
    return (
        <div className={styles.membersList}>
            {Array.from({ length: 3 }).map((_, index) => (
                <div className={styles.memberSkeleton} key={`member-skeleton-${index}`}>
                    <span className={styles.memberSkeletonShort} />
                    <span className={styles.memberSkeletonLine} />
                    <span className={styles.memberSkeletonTiny} />
                </div>
            ))}
        </div>
    );
}

function sortMembers(items) {
    return [...items].sort((left, right) => {
        if (left.role === right.role) {
            return left.userEmail.localeCompare(right.userEmail);
        }

        return left.role === 'LEADER' ? -1 : 1;
    });
}

export default function GroupDetailPage() {
    const { groupId = '' } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const hasToken = Boolean(getStoredToken());
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(hasToken);
    const [error, setError] = useState('');
    const [requestKey, setRequestKey] = useState(0);
    const [activeTab, setActiveTab] = useState('overview');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editError, setEditError] = useState('');
    const [inviteInfo, setInviteInfo] = useState(null);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState('');
    const [disbanding, setDisbanding] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [message, setMessage] = useState('');
    const [members, setMembers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [membersError, setMembersError] = useState('');
    const [membersRequestKey, setMembersRequestKey] = useState(0);
    const [actingMemberId, setActingMemberId] = useState(null);

    useEffect(() => {
        if (!location.state?.successMessage) return;

        setMessage(location.state.successMessage);
        navigate(location.pathname, { replace: true, state: {} });
    }, [location.pathname, location.state, navigate]);

    useEffect(() => {
        if (!hasToken) {
            setLoading(false);
            setGroup(null);
            setError('');
            return;
        }

        let cancelled = false;

        async function loadGroupDetail() {
            setLoading(true);
            setError('');

            try {
                const data = await groupApi.getGroupDetail(groupId);
                if (cancelled) return;
                setGroup(normalizeGroup(data));
            } catch (requestError) {
                if (cancelled) return;
                setGroup(null);
                setError(getErrorMessage(requestError, 'Không tải được chi tiết nhóm.'));
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadGroupDetail();

        return () => {
            cancelled = true;
        };
    }, [groupId, hasToken, requestKey]);

    useEffect(() => {
        if (!hasToken || !group?.id || activeTab !== 'members') return;

        let cancelled = false;

        async function loadMembers() {
            setMembersLoading(true);
            setMembersError('');

            try {
                const data = await groupApi.getGroupMembers(group.id);
                if (cancelled) return;
                const items = Array.isArray(data) ? data.map(normalizeMember) : [];
                setMembers(sortMembers(items));
            } catch (requestError) {
                if (cancelled) return;
                setMembers([]);
                setMembersError(
                    getErrorMessage(requestError, 'Không tải được danh sách thành viên.')
                );
            } finally {
                if (!cancelled) {
                    setMembersLoading(false);
                }
            }
        }

        loadMembers();

        return () => {
            cancelled = true;
        };
    }, [activeTab, group?.id, hasToken, membersRequestKey]);

    const isLeader = group?.myRole === 'LEADER';
    const isMember = group?.myRole === 'MEMBER';
    const tabItems = useMemo(
        () =>
            isLeader
                ? [
                      { id: 'overview', label: 'Overview' },
                      { id: 'members', label: 'Members' },
                      { id: 'chat', label: 'Chat' }
                  ]
                : [
                      { id: 'members', label: 'Members' },
                      { id: 'chat', label: 'Chat' }
                  ],
        [isLeader]
    );

    useEffect(() => {
        if (isMember && activeTab === 'overview') {
            setActiveTab('members');
        }
    }, [activeTab, isMember]);

    async function handleUpdateGroup(payload) {
        setEditing(true);
        setEditError('');

        try {
            const updated = await groupApi.updateGroup(groupId, payload);
            setGroup(normalizeGroup(updated));
            setShowEditModal(false);
            setMessage('Đã cập nhật thông tin nhóm.');
        } catch (requestError) {
            setEditError(getErrorMessage(requestError, 'Không cập nhật được nhóm.'));
        } finally {
            setEditing(false);
        }
    }

    async function handleGenerateInvite() {
        setInviteLoading(true);
        setInviteError('');
        setMessage('');

        try {
            const invite = await groupApi.generateInvite(groupId, buildInvitePayload());
            setInviteInfo(invite);
            setMessage('Đã tạo invite link mới.');
        } catch (requestError) {
            setInviteError(getErrorMessage(requestError, 'Không tạo được invite link.'));
        } finally {
            setInviteLoading(false);
        }
    }

    async function handleCopyInvite() {
        if (!inviteInfo?.inviteLink) return;

        try {
            await navigator.clipboard.writeText(inviteInfo.inviteLink);
            setMessage('Đã copy invite link.');
        } catch (copyError) {
            setMessage(getErrorMessage(copyError, 'Không copy được invite link.'));
        }
    }

    async function handleDisbandGroup() {
        if (!group?.id) return;

        const confirmed = window.confirm(
            'Bạn có chắc chắn muốn giải tán nhóm này? Hành động này không thể hoàn tác.'
        );

        if (!confirmed) return;

        setDisbanding(true);
        setMessage('');

        try {
            await groupApi.disbandGroup(group.id);
            navigate('/groups', {
                replace: true,
                state: { successMessage: 'Đã giải tán nhóm thành công.' }
            });
        } catch (requestError) {
            setMessage(getErrorMessage(requestError, 'Không giải tán được nhóm.'));
        } finally {
            setDisbanding(false);
        }
    }

    async function handleLeaveGroup() {
        if (!group?.id) return;

        const confirmed = window.confirm(
            'Bạn có chắc chắn muốn rời nhóm này? Sau khi rời, bạn cần invite mới để tham gia lại.'
        );

        if (!confirmed) return;

        setLeaving(true);
        setMessage('');

        try {
            await groupApi.leaveGroup(group.id);
            navigate('/groups', {
                replace: true,
                state: { successMessage: 'Đã rời nhóm thành công.' }
            });
        } catch (requestError) {
            setMessage(getErrorMessage(requestError, 'Không rời được nhóm.'));
        } finally {
            setLeaving(false);
        }
    }

    async function handleRemoveMember(member) {
        const confirmed = window.confirm(
            `Bạn có chắc chắn muốn xóa ${member.userEmail} khỏi nhóm?`
        );

        if (!confirmed) return;

        setActingMemberId(member.userId);
        setMembersError('');
        setMessage('');

        try {
            await groupApi.removeMember(group.id, member.userId);
            setMessage('Đã xóa thành viên khỏi nhóm.');
            setMembersRequestKey((value) => value + 1);
            setRequestKey((value) => value + 1);
        } catch (requestError) {
            setMembersError(getErrorMessage(requestError, 'Không xóa được thành viên.'));
        } finally {
            setActingMemberId(null);
        }
    }

    async function handleTransferLeader(member) {
        const confirmed = window.confirm(
            `Bạn có chắc chắn muốn chuyển quyền leader cho ${member.userEmail}?`
        );

        if (!confirmed) return;

        setActingMemberId(member.userId);
        setMembersError('');
        setMessage('');

        try {
            await groupApi.transferLeader(group.id, { targetUserId: member.userId });
            setMessage('Đã chuyển quyền leader thành công.');
            setMembersRequestKey((value) => value + 1);
            setRequestKey((value) => value + 1);
        } catch (requestError) {
            setMembersError(getErrorMessage(requestError, 'Không chuyển quyền được.'));
        } finally {
            setActingMemberId(null);
        }
    }

    if (!hasToken) {
        return (
            <FeedbackState
                title='Bạn chưa đăng nhập'
                description='Trang chi tiết nhóm cần token hiện tại để gọi detail, invite và member management theo backend contract.'
                actionLabel='Mở trang đăng nhập'
                actionHref='/auth'
            />
        );
    }

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return (
            <FeedbackState
                title='Không tải được chi tiết nhóm'
                description={error}
                actionLabel='Thử lại'
                onAction={() => setRequestKey((value) => value + 1)}
            />
        );
    }

    if (!group) {
        return (
            <FeedbackState
                title='Không có dữ liệu nhóm'
                description='Trang chi tiết nhóm hiện chưa nhận được payload hợp lệ từ backend.'
                actionLabel='Quay lại danh sách nhóm'
                actionHref='/groups'
            />
        );
    }

    return (
        <div className={styles.page}>
            <section className={styles.hero}>
                <div className={styles.heroMain}>
                    <Link className={styles.backLink} to='/groups'>
                        Quay lại danh sách nhóm
                    </Link>
                    <div className={styles.badgeRow}>
                        <span className={styles.roleBadge}>{getRoleLabel(group.myRole)}</span>
                        <span className={styles.statusBadge}>{getStatusLabel(group.status)}</span>
                    </div>
                    <h1>{group.name}</h1>
                    <p className={styles.description}>{group.description}</p>

                    <div className={styles.heroActions}>
                        {isLeader ? (
                            <>
                                <button
                                    className={styles.primaryButton}
                                    onClick={() => {
                                        setEditError('');
                                        setShowEditModal(true);
                                    }}
                                    type='button'
                                >
                                    Chỉnh sửa nhóm
                                </button>
                                <button
                                    className={styles.secondaryButton}
                                    disabled={inviteLoading}
                                    onClick={handleGenerateInvite}
                                    type='button'
                                >
                                    {inviteLoading ? 'Đang tạo invite...' : 'Tạo invite link'}
                                </button>
                                <button
                                    className={styles.dangerButton}
                                    disabled={disbanding}
                                    onClick={handleDisbandGroup}
                                    type='button'
                                >
                                    {disbanding ? 'Đang giải tán...' : 'Giải tán nhóm'}
                                </button>
                            </>
                        ) : null}

                        {isMember ? (
                            <button
                                className={styles.dangerButton}
                                disabled={leaving}
                                onClick={handleLeaveGroup}
                                type='button'
                            >
                                {leaving ? 'Đang rời nhóm...' : 'Rời nhóm'}
                            </button>
                        ) : null}
                    </div>
                </div>

                <aside className={styles.sidebarCard}>
                    <div className={styles.sectionLabel}>Thông tin nhanh</div>
                    <dl className={styles.detailList}>
                        <div>
                            <dt>Số thành viên</dt>
                            <dd>{group.memberCount}</dd>
                        </div>
                        <div>
                            <dt>Vai trò của tôi</dt>
                            <dd>{getRoleLabel(group.myRole)}</dd>
                        </div>
                        <div>
                            <dt>Trạng thái</dt>
                            <dd>{getStatusLabel(group.status)}</dd>
                        </div>
                        <div>
                            <dt>Tạo lúc</dt>
                            <dd>{formatDateTime(group.createdAt)}</dd>
                        </div>
                        <div>
                            <dt>Cập nhật lúc</dt>
                            <dd>{formatDateTime(group.updatedAt)}</dd>
                        </div>
                    </dl>
                </aside>
            </section>

            {message ? <div className={styles.messageBanner}>{message}</div> : null}
            {inviteError ? <div className={styles.errorBanner}>{inviteError}</div> : null}

            {isLeader ? (
                <section className={styles.invitePanel}>
                    <div className={styles.invitePanelHeader}>
                        <div>
                            <div className={styles.sectionLabel}>Invite</div>
                            <h2>Invite link của nhóm</h2>
                            <p>
                                Leader có thể tạo mới và copy invite link bất kỳ lúc nào ngay
                                trên trang chi tiết nhóm.
                            </p>
                        </div>

                        <div className={styles.invitePanelActions}>
                            <button
                                className={styles.primaryButton}
                                disabled={inviteLoading}
                                onClick={handleGenerateInvite}
                                type='button'
                            >
                                {inviteLoading ? 'Đang tạo invite...' : 'Tạo invite link'}
                            </button>

                            {inviteInfo?.inviteLink ? (
                                <button
                                    className={styles.secondaryButton}
                                    onClick={handleCopyInvite}
                                    type='button'
                                >
                                    Copy link
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {inviteInfo ? (
                        <div className={styles.invitePanelCard}>
                            <div>
                                <span>Code</span>
                                <strong>{inviteInfo.code}</strong>
                            </div>
                            <div>
                                <span>Link</span>
                                <a href={inviteInfo.inviteLink}>{inviteInfo.inviteLink}</a>
                            </div>
                            <div>
                                <span>Hết hạn</span>
                                <strong>{formatDateTime(inviteInfo.expiredAt)}</strong>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.mutedCard}>
                            Invite link sẽ hiện ở đây sau khi tạo thành công.
                        </div>
                    )}
                </section>
            ) : null}

            <section className={styles.tabSection}>
                <div className={styles.tabRow}>
                    {tabItems.map((tab) => (
                        <button
                            key={tab.id}
                            className={`${styles.tabButton} ${
                                activeTab === tab.id ? styles.tabButtonActive : ''
                            }`}
                            onClick={() => setActiveTab(tab.id)}
                            type='button'
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {isLeader && activeTab === 'overview' ? (
                    <div className={styles.overviewGrid}>
                        <article className={styles.mainCard}>
                            <div className={styles.sectionLabel}>Overview</div>
                            <h2>Thông tin nhóm</h2>
                            <p>{group.description}</p>

                            <div className={styles.infoGrid}>
                                <div>
                                    <span>Leader ID</span>
                                    <strong>{group.leaderId ?? 'Đang cập nhật'}</strong>
                                </div>
                                <div>
                                    <span>Member count</span>
                                    <strong>{group.memberCount}</strong>
                                </div>
                                <div>
                                    <span>Created at</span>
                                    <strong>{formatDateTime(group.createdAt)}</strong>
                                </div>
                                <div>
                                    <span>Updated at</span>
                                    <strong>{formatDateTime(group.updatedAt)}</strong>
                                </div>
                            </div>
                        </article>

                        <aside className={styles.stack}>
                            <article className={styles.sideCard}>
                                <div className={styles.sectionLabel}>Members</div>
                                <h3>Quản lý thành viên</h3>
                                <p>
                                    Leader có thể mở tab Members để xem danh sách thành viên,
                                    xóa member và chuyển quyền leader.
                                </p>
                                <button
                                    className={styles.secondaryButton}
                                    onClick={() => setActiveTab('members')}
                                    type='button'
                                >
                                    Mở tab Members
                                </button>
                            </article>
                        </aside>
                    </div>
                ) : null}

                {activeTab === 'members' ? (
                    <div className={styles.membersPanel}>
                        <div className={styles.membersPanelHeader}>
                            <div>
                                <div className={styles.sectionLabel}>Members</div>
                                <h2>Thành viên trong nhóm</h2>
                                <p>
                                    {isLeader
                                        ? 'Leader có quyền remove member và transfer leader. Member thường chỉ có thể xem danh sách.'
                                        : 'Bạn đang ở chế độ member: chỉ xem được danh sách thành viên và tab chat của nhóm.'}
                                </p>
                            </div>

                            <button
                                className={styles.secondaryButton}
                                onClick={() => setMembersRequestKey((value) => value + 1)}
                                type='button'
                            >
                                Tải lại thành viên
                            </button>
                        </div>

                        {membersError ? <div className={styles.errorBanner}>{membersError}</div> : null}

                        {membersLoading ? <MembersLoadingState /> : null}

                        {!membersLoading && !membersError && members.length === 0 ? (
                            <div className={styles.placeholderCard}>
                                <div className={styles.sectionLabel}>Members</div>
                                <h2>Chưa có thành viên nào</h2>
                                <p>
                                    Nhóm này hiện chưa có member hợp lệ trả về từ backend.
                                </p>
                            </div>
                        ) : null}

                        {!membersLoading && !membersError && members.length > 0 ? (
                            <div className={styles.membersList}>
                                {members.map((member) => {
                                    const isSelfLeader = member.userId === group.leaderId;
                                    const canManageMember =
                                        isLeader &&
                                        !isSelfLeader &&
                                        member.status === 'ACTIVE';
                                    const isActing = actingMemberId === member.userId;

                                    return (
                                        <article className={styles.memberCard} key={member.userId}>
                                            <div className={styles.memberTop}>
                                                <div>
                                                    <h3>
                                                        <Link to={`/userprofile/${member.userId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                            {member.userEmail}
                                                        </Link>
                                                    </h3>
                                                    <p className={styles.memberMeta}>
                                                        Joined {formatDateTime(member.joinedAt)}
                                                    </p>
                                                </div>

                                                <div className={styles.memberBadges}>
                                                    <span className={styles.roleBadge}>
                                                        {getRoleLabel(member.role)}
                                                    </span>
                                                    <span className={styles.memberStatusBadge}>
                                                        {getMemberStatusLabel(member.status)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={styles.memberInfoGrid}>
                                                <div>
                                                    <span>User ID</span>
                                                    <strong>{member.userId}</strong>
                                                </div>
                                                <div>
                                                    <span>Role</span>
                                                    <strong>{getRoleLabel(member.role)}</strong>
                                                </div>
                                                <div>
                                                    <span>Status</span>
                                                    <strong>{getMemberStatusLabel(member.status)}</strong>
                                                </div>
                                                <div>
                                                    <span>Joined at</span>
                                                    <strong>{formatDateTime(member.joinedAt)}</strong>
                                                </div>
                                            </div>

                                            {canManageMember ? (
                                                <div className={styles.memberActions}>
                                                    <button
                                                        className={styles.secondaryButton}
                                                        disabled={isActing}
                                                        onClick={() => handleTransferLeader(member)}
                                                        type='button'
                                                    >
                                                        {isActing
                                                            ? 'Đang xử lý...'
                                                            : 'Chuyển leader'}
                                                    </button>
                                                    <button
                                                        className={styles.dangerButton}
                                                        disabled={isActing}
                                                        onClick={() => handleRemoveMember(member)}
                                                        type='button'
                                                    >
                                                        {isActing
                                                            ? 'Đang xử lý...'
                                                            : 'Xóa khỏi nhóm'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className={styles.memberNote}>
                                                    {isSelfLeader
                                                        ? 'Đây là leader hiện tại của nhóm.'
                                                        : 'Chỉ leader mới có quyền quản lý member này.'}
                                                </div>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>
                ) : null}

                {activeTab === 'chat' ? (
                    <GroupChatSection group={group} />
                ) : null}
            </section>

            <GroupFormModal
                open={showEditModal}
                title='Chỉnh sửa nhóm'
                submitLabel='Lưu thay đổi'
                initialValue={{
                    name: group.name,
                    description: group.description
                }}
                submitting={editing}
                errorMessage={editError}
                onClose={() => {
                    if (editing) return;
                    setShowEditModal(false);
                    setEditError('');
                }}
                onSubmit={handleUpdateGroup}
            />
        </div>
    );
}

