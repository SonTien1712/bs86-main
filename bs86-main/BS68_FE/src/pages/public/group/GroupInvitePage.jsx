import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { groupApi } from '../../../api/groupApi';
import {
    formatDateTime,
    getErrorMessage,
    getStoredToken,
    normalizeInvite
} from './groupPage.utils';
import styles from './GroupInvitePage.module.scss';

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

export default function GroupInvitePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const code = searchParams.get('code') || '';
    const hasToken = Boolean(getStoredToken());
    const [invite, setInvite] = useState(null);
    const [loading, setLoading] = useState(Boolean(code));
    const [error, setError] = useState('');
    const [requestKey, setRequestKey] = useState(0);
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState('');

    useEffect(() => {
        if (!code) {
            setInvite(null);
            setLoading(false);
            setError('');
            return;
        }

        let cancelled = false;

        async function loadInvite() {
            setLoading(true);
            setError('');
            setJoinError('');

            try {
                const data = await groupApi.validateInvite(code);
                if (cancelled) return;
                setInvite(normalizeInvite(data));
            } catch (requestError) {
                if (cancelled) return;
                setInvite(null);
                setError(getErrorMessage(requestError, 'Không xác thực được invite link.'));
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadInvite();

        return () => {
            cancelled = true;
        };
    }, [code, requestKey]);

    async function handleJoinGroup() {
        if (!code) return;

        if (!hasToken) {
            navigate('/auth');
            return;
        }

        setJoining(true);
        setJoinError('');

        try {
            const joined = await groupApi.joinGroupByCode(code);
            navigate(`/groups/${joined?.id}`, {
                replace: true,
                state: { successMessage: 'Đã tham gia nhóm thành công.' }
            });
        } catch (requestError) {
            setJoinError(getErrorMessage(requestError, 'Không tham gia được nhóm bằng invite.'));
        } finally {
            setJoining(false);
        }
    }

    if (!code) {
        return (
            <FeedbackState
                title='Invite link không hợp lệ'
                description='Trang này cần query param code, ví dụ /groups/invite?code=abc123.'
                actionLabel='Mở danh sách nhóm'
                actionHref='/groups'
            />
        );
    }

    if (loading) {
        return (
            <div className={styles.loadingShell}>
                <div className={styles.loadingCard} />
            </div>
        );
    }

    if (error) {
        return (
            <FeedbackState
                title='Không mở được invite'
                description={error}
                actionLabel='Thử lại'
                onAction={() => setRequestKey((value) => value + 1)}
            />
        );
    }

    if (!invite) {
        return (
            <FeedbackState
                title='Không có dữ liệu invite'
                description='Backend không trả về payload invite hợp lệ cho link này.'
                actionLabel='Mở danh sách nhóm'
                actionHref='/groups'
            />
        );
    }

    return (
        <div className={styles.page}>
            <section className={styles.card}>
                <p className={styles.eyebrow}>Private Group Invite</p>
                <h1>Tham gia nhóm riêng</h1>
                <p className={styles.description}>
                    Xác nhận thông tin nhóm trước khi tham gia. Flow này đang dùng 100%
                    backend phase 2: validate invite và join by code.
                </p>

                <div className={styles.groupCard}>
                    <div className={styles.headerRow}>
                        <div>
                            <div className={styles.groupLabel}>Group name</div>
                            <h2>{invite.groupName}</h2>
                        </div>
                        <span className={styles.statusBadge}>{invite.inviteStatus}</span>
                    </div>

                    <p className={styles.groupDescription}>{invite.groupDescription}</p>

                    <dl className={styles.metaGrid}>
                        <div>
                            <dt>Thành viên</dt>
                            <dd>{invite.memberCount}</dd>
                        </div>
                        <div>
                            <dt>Leader email</dt>
                            <dd>{invite.leaderEmail}</dd>
                        </div>
                        <div>
                            <dt>Code</dt>
                            <dd>{invite.code}</dd>
                        </div>
                        <div>
                            <dt>Hết hạn</dt>
                            <dd>{formatDateTime(invite.expiredAt)}</dd>
                        </div>
                    </dl>
                </div>

                {joinError ? <div className={styles.errorBanner}>{joinError}</div> : null}

                <div className={styles.actionRow}>
                    {invite.alreadyMember ? (
                        <Link className={styles.primaryButton} to={`/groups/${invite.groupId}`}>
                            Bạn đã là thành viên, mở chi tiết nhóm
                        </Link>
                    ) : (
                        <button
                            className={styles.primaryButton}
                            disabled={joining}
                            onClick={handleJoinGroup}
                            type='button'
                        >
                            {joining
                                ? 'Đang tham gia...'
                                : hasToken
                                  ? 'Tham gia nhóm'
                                  : 'Đăng nhập để tham gia'}
                        </button>
                    )}

                    <Link className={styles.secondaryButton} to='/groups'>
                        Quay lại danh sách nhóm
                    </Link>
                </div>

                <div className={styles.notice}>
                    <strong>Phase sau:</strong> sau khi backend mở rộng thêm members/chat,
                    trang này có thể điều hướng sang room hoặc tab member mà không cần đợi
                    lại route invite.
                </div>
            </section>
        </div>
    );
}

