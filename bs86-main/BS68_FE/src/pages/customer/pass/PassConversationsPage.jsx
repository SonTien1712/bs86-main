import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyPassConversations } from '../../../api/passApi';
import { formatPassDateTime, getApiErrorMessage, getPassConversationStatusLabel } from './passUi';
import styles from './PassConversationsPage.module.css';

function sortUpdatedFirst(left, right) {
    return new Date(right?.updatedAt || right?.createdAt || 0).getTime()
        - new Date(left?.updatedAt || left?.createdAt || 0).getTime();
}

export default function PassConversationsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [conversations, setConversations] = useState([]);

    useEffect(() => {
        let active = true;

        const loadConversations = async () => {
            setLoading(true);
            setError('');

            try {
                const result = await getMyPassConversations();
                if (!active) {
                    return;
                }

                setConversations([...result].sort(sortUpdatedFirst));
            } catch (loadError) {
                if (!active) {
                    return;
                }

                setConversations([]);
                setError(getApiErrorMessage(loadError, 'Không tải được danh sách hội thoại pass vé.'));
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        void loadConversations();

        return () => {
            active = false;
        };
    }, []);

    return (
        <div className={styles.shell}>
            <div className={styles.container}>
                <section className={styles.hero}>
                    <div>
                        <div className={styles.kicker}>Hộp thư riêng</div>
                        <h1 className={styles.title}>Hội thoại pass vé</h1>
                        <p className={styles.subtitle}>
                            Trao đổi riêng 1-1 để hỏi vé, thương lượng và chuyển vé khi cần.
                        </p>
                    </div>

                    <div className={styles.heroActions}>
                        <Link className={styles.secondaryBtn} to='/explore?category=PASSSAN'>
                            PASSSAN
                        </Link>
                        <Link className={styles.primaryBtn} to='/userprofile#tickets'>
                            Quay lại Vé của tôi
                        </Link>
                    </div>
                </section>

                {loading ? <div className={styles.feedback}>Đang tải hội thoại...</div> : null}
                {!loading && error ? <div className={styles.feedbackError}>{error}</div> : null}

                {!loading && !error && conversations.length === 0 ? (
                    <div className={styles.emptyState}>
                        <strong>Chưa có hội thoại nào.</strong>
                        <span>Khi bạn liên hệ một bài đăng pass vé, hội thoại sẽ xuất hiện tại đây.</span>
                    </div>
                ) : null}

                {!loading && !error && conversations.length > 0 ? (
                    <div className={styles.list}>
                        {conversations.map((conversation) => (
                            <Link
                                className={styles.card}
                                key={conversation.id}
                                to={`/pass-conversations/${conversation.id}`}
                            >
                                <div className={styles.cardTop}>
                                    <div className={styles.cardIdentity}>
                                        <div className={styles.cardTitle}>
                                            {conversation.counterpartFullName || 'Người dùng chưa cập nhật'}
                                        </div>
                                        <div className={styles.cardSub}>
                                            {conversation.fieldName || 'Chưa có tên sân'} •{' '}
                                            {conversation.courtName || 'Chưa gán sân con'}
                                        </div>
                                    </div>

                                    <span className={styles.statusBadge}>
                                        {getPassConversationStatusLabel(conversation.status)}
                                    </span>
                                </div>

                                <div className={styles.preview}>
                                    {conversation.lastMessagePreview || 'Chưa có tin nhắn nào.'}
                                </div>

                                <div className={styles.metaRow}>
                                    <div className={styles.metaItem}>
                                        <span>Tin nhắn cuối</span>
                                        <strong>{formatPassDateTime(conversation.lastMessageAt)}</strong>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <span>Cập nhật lúc</span>
                                        <strong>{formatPassDateTime(conversation.updatedAt)}</strong>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
