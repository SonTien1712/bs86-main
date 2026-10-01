import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsApi } from '../../../api/postsApi';
import { ownerApi } from '../../../api/ownerApi';
import AccountHeader from '../../../components/account/AccountHeader';
import PostComposerModal from '../../../components/owner/posts/PostComposerModal';
import OwnerPostsSection from '../../../components/owner/posts/OwnerPostsSection';
import OwnerVerificationForm from '../../../components/owner/verification/OwnerVerificationForm';
import { clearStoredAuthSession, parseAuthFromToken } from '../../../utils/auth';
import OwnerManagementPanels from './OwnerManagementPanels';
import AccountGroupsSection from '../group/AccountGroupsSection';
import AccountMiniGroupChat from '../group/AccountMiniGroupChat';
import styles from './AccountPage.module.css';

const INIT_FORM = { fieldId: '', content: '' };

export default function AccountPage() {
    const navigate = useNavigate();
    const auth = parseAuthFromToken();

    const [posts, setPosts] = useState([]);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(INIT_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [errMsg, setErrMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [ownerStatus, setOwnerStatus] = useState(null);
    const [rejectionReason, setRejectionReason] = useState(null);
    const [attemptCount, setAttemptCount] = useState(0);

    const loadPosts = async () => {
        setLoading(true);

        try {
            const data = await postsApi.getMyPosts();
            setPosts(Array.isArray(data) ? data : []);
        } catch {
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const loadMyFields = async () => {
        try {
            const data = await ownerApi.getMyFields();
            setFields(Array.isArray(data) ? data : []);
        } catch {
            setFields([]);
        }
    };

    const checkOwnerStatus = async () => {
        try {
            const res = await ownerApi.getVerificationStatus();
            const status = res?.status;
            const reason = res?.rejectionReason ?? null;

            if (!status || status === 'NONE') {
                setOwnerStatus(null);
                setRejectionReason(null);
                setAttemptCount(0);
                return;
            }

            setOwnerStatus(status);
            setRejectionReason(reason);
            setAttemptCount(res?.attemptCount ?? 1);

            if (status === 'APPROVED') {
                loadPosts();
            }
        } catch (error) {
            if (error?.response?.status === 404) {
                setOwnerStatus(null);
                setRejectionReason(null);
                return;
            }

            setOwnerStatus('FAILED');
        }
    };

    useEffect(() => {
        if (auth.isOwner && !auth.isAdmin) {
            checkOwnerStatus();
            loadMyFields();
        }
    }, [auth.isAdmin, auth.isOwner]);

    // Programmatic redirect — useEffect avoids the "session history item added without
    // user interaction" warning that <Navigate> triggers on initial mount.
    useEffect(() => {
        if (auth.isAdmin) {
            navigate('/admin', { replace: true });
        } else if (auth.isAuthenticated && !auth.isOwner) {
            navigate('/userprofile', { replace: true });
        }
    }, [auth.isAdmin, auth.isAuthenticated, auth.isOwner]);

    const logout = () => {
        clearStoredAuthSession();
        navigate('/account', { replace: true });
    };

    const openModal = () => {
        setForm({
            ...INIT_FORM,
            fieldId: fields[0] ? String(fields[0].id) : ''
        });
        setErrMsg('');
        setSuccessMsg('');
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!form.fieldId || !form.content.trim()) {
            setErrMsg('Vui lòng chọn sân và nhập nội dung.');
            return;
        }

        setSubmitting(true);
        setErrMsg('');

        try {
            await postsApi.createPost({
                fieldId: Number(form.fieldId),
                category: 'EMPTY_COURT',
                content: form.content.trim()
            });

            setSuccessMsg('Đã đăng bài!');
            setTimeout(() => {
                setShowModal(false);
                loadPosts();
            }, 1000);
        } catch (error) {
            setErrMsg(error?.response?.data?.message || 'Đăng bài thất bại.');
        } finally {
            setSubmitting(false);
        }
    };

    // Redirect handled by useEffect above — return null to avoid a flash of wrong content.
    if (auth.isAdmin) return null;

    if (!auth.isAuthenticated) {
        return (
            <div className={styles.shell}>
                <div className={styles.guestWrap}>
                    <div className={styles.guestIcon}>Guest</div>
                    <div className={styles.guestTitle}>Tài khoản khách</div>
                    <div className={styles.guestSub}>
                        Bạn đang ở chế độ khách.
                        <br />
                        Hãy đăng nhập lại để xem tài khoản, quản lý sân và sử dụng các tính năng cá nhân.
                    </div>
                    <div className={styles.guestActions}>
                        <button className={styles.loginBtn} onClick={() => navigate('/auth?mode=login')}>
                            Đăng nhập lại
                        </button>
                        <button className={styles.guestSecondaryBtn} onClick={() => navigate('/home')}>
                            Về trang chủ
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Redirect handled by useEffect above.
    if (!auth.isOwner) return null;

    const header = <AccountHeader auth={auth} onLogout={logout} styles={styles} />;

    // BLOCKED guard — JWT status field is set by backend in persistUserWithFreshToken().
    // This shows even while the old JWT is still valid, because AccountPage reads
    // auth.status from the JWT payload (which is refreshed on every login).
    // For mid-session blocking, OwnerController.loadAndAssertActive() rejects API calls
    // from the backend side; the owner will see errors and can log out to get a fresh JWT.
    if (auth.status === 'BLOCKED') {
        return (
            <div className={styles.shell}>
                {header}
                <div className={styles.pendingCard} style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)' }}>
                    <div className={styles.pendingTitle} style={{ color: '#f87171' }}>Tài khoản đã bị khóa</div>
                    <div className={styles.pendingDesc}>
                        Tài khoản bị khóa do hết 3 lần xác thực không thành công.
                        Vui lòng liên hệ hỗ trợ để được mở khóa.
                    </div>
                </div>
            </div>
        );
    }

    if (auth.isOwner) {
        return (
            <div className={styles.shell}>
                {header}

                <PostComposerModal
                    styles={styles}
                    show={showModal}
                    fields={fields}
                    form={form}
                    errMsg={errMsg}
                    successMsg={successMsg}
                    submitting={submitting}
                    onClose={() => setShowModal(false)}
                    onSubmit={handleSubmit}
                    onChange={setForm}
                />

                {ownerStatus === 'APPROVED' ? (
                    <div className={styles.ownerMain}>
                        <OwnerPostsSection
                            styles={styles}
                            posts={posts}
                            loading={loading}
                            onCreate={openModal}
                        />

                        <div className={styles.ownerPanelsWrap}>
                            <OwnerManagementPanels />
                        </div>
                    </div>
                ) : ownerStatus === 'PENDING' ? (
                    <div className={styles.pendingCard}>
                        <div className={styles.pendingTitle}>Đang chờ duyệt</div>
                        <div className={styles.pendingDesc}>
                            Hồ sơ đăng ký Chủ Sân của bạn đã được gửi. Vui lòng chờ Admin xét
                            duyệt để bắt đầu quản lý sân bãi.
                        </div>
                    </div>
                ) : ownerStatus === 'REJECTED' ? (
                    <div>
                        <div className={styles.pendingCard} style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)' }}>
                            <div className={styles.pendingTitle} style={{ color: '#f87171' }}>
                                Hồ sơ bị từ chối
                            </div>
                            <div className={styles.pendingDesc}>
                                {rejectionReason
                                    ? <>Lý do: <strong style={{ color: '#fca5a5' }}>{rejectionReason}</strong></>
                                    : 'Hồ sơ của bạn không được phê duyệt. Vui lòng kiểm tra lại thông tin và gửi lại.'}
                            </div>
                            {attemptCount > 0 && (
                                <div style={{ marginTop: 10, fontSize: 13, color: 3 - attemptCount <= 1 ? '#f87171' : '#fb923c', fontWeight: 600 }}>
                                    ⚠ Bạn còn {3 - attemptCount} lần chỉnh sửa hồ sơ.
                                    {3 - attemptCount === 1 && ' Đây là cơ hội cuối cùng!'}
                                </div>
                            )}
                        </div>
                        <OwnerVerificationForm styles={styles} onSuccess={checkOwnerStatus} attemptsLeft={3 - attemptCount} />
                    </div>
                ) : ownerStatus === 'FAILED' ? (
                    <div className={styles.pendingCard}>
                        <div className={styles.pendingTitle} style={{ color: '#f87171' }}>
                            Lỗi tải dữ liệu
                        </div>
                        <div className={styles.pendingDesc}>
                            Không thể kết nối đến máy chủ. Vui lòng thử lại sau.
                        </div>
                    </div>
                ) : (
                    <OwnerVerificationForm styles={styles} onSuccess={checkOwnerStatus} />
                )}

                <AccountGroupsSection />
                <AccountMiniGroupChat />
            </div>
        );
    }

    return (
        <div className={styles.shell}>
            {header}
            <AccountGroupsSection />
            <AccountMiniGroupChat />
            <div className={styles.infoCard}>
                Tài khoản người dùng
                <br />
                <span style={{ fontSize: '0.8rem', color: '#93a4bc' }}>
                    Các tính năng đặt sân, lịch sử booking sẽ được thêm sau.
                </span>
            </div>
        </div>
    );
}
