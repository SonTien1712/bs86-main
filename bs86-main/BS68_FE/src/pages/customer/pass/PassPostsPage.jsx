import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ContactPassPostModal from '../../../components/pass/ContactPassPostModal';
import { listPassPosts } from '../../../api/passApi';
import { getCurrentUserId, parseAuthFromToken } from '../../../utils/auth';
import {
    formatPassDate,
    formatPassMoney,
    formatPassTime,
    getApiErrorMessage,
    getPassPostStatusLabel
} from './passUi';
import styles from './PassPostsPage.module.css';

function sortNewestFirst(left, right) {
    return new Date(right?.createdAt || 0).getTime() - new Date(left?.createdAt || 0).getTime();
}

export default function PassPostsPage() {
    const navigate = useNavigate();
    const auth = parseAuthFromToken();
    const currentUserId = getCurrentUserId(auth);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [posts, setPosts] = useState([]);
    const [contactPost, setContactPost] = useState(null);

    useEffect(() => {
        let active = true;

        const loadPosts = async () => {
            setLoading(true);
            setError('');

            try {
                const result = await listPassPosts();
                if (!active) {
                    return;
                }

                setPosts([...result].sort(sortNewestFirst));
            } catch (loadError) {
                if (!active) {
                    return;
                }

                setPosts([]);
                setError(getApiErrorMessage(loadError, 'Unable to load pass posts.'));
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        void loadPosts();

        return () => {
            active = false;
        };
    }, []);

    const postCountLabel = useMemo(() => {
        if (loading) return 'Loading...';
        return `${posts.length} active post${posts.length === 1 ? '' : 's'}`;
    }, [loading, posts.length]);

    return (
        <div className={styles.shell}>
            <div className={styles.container}>
                <section className={styles.hero}>
                    <div>
                        <div className={styles.kicker}>Ticket Marketplace</div>
                        <h1 className={styles.title}>Pass Posts</h1>
                        <p className={styles.subtitle}>
                            Browse active ticket pass posts and contact the owner in a private
                            conversation.
                        </p>
                    </div>

                    <div className={styles.heroActions}>
                        <Link className={styles.secondaryBtn} to='/pass-conversations'>
                            Pass Conversations
                        </Link>
                        <button className={styles.primaryBtn} onClick={() => navigate('/userprofile#tickets')} type='button'>
                            Back to My Tickets
                        </button>
                    </div>
                </section>

                <div className={styles.metaRow}>
                    <span className={styles.metaBadge}>{postCountLabel}</span>
                </div>

                {loading ? <div className={styles.feedback}>Loading pass posts...</div> : null}
                {!loading && error ? <div className={styles.feedbackError}>{error}</div> : null}

                {!loading && !error && posts.length === 0 ? (
                    <div className={styles.emptyState}>
                        <strong>No active pass posts yet.</strong>
                        <span>When someone lists a transferable ticket, it will appear here.</span>
                    </div>
                ) : null}

                {!loading && !error && posts.length > 0 ? (
                    <div className={styles.grid}>
                        {posts.map((post) => {
                            const isOwner = Number(post?.ownerUserId) === Number(currentUserId);

                            return (
                                <article className={styles.card} key={post.id}>
                                    <div className={styles.cardHeader}>
                                        <div>
                                            <div className={styles.cardTitle}>
                                                {post.fieldName || 'Unknown field'}
                                            </div>
                                            <div className={styles.cardSubtitle}>
                                                {post.courtName || 'Court not assigned'} •{' '}
                                                {formatPassDate(post.slotDate)} •{' '}
                                                {formatPassTime(post.startTime)} -{' '}
                                                {formatPassTime(post.endTime)}
                                            </div>
                                        </div>

                                        <div className={styles.badgeRow}>
                                            <span className={styles.statusBadge}>
                                                {getPassPostStatusLabel(post.status)}
                                            </span>
                                            {isOwner ? (
                                                <span className={styles.ownerBadge}>Your Post</span>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className={styles.contentBlock}>
                                        <div className={styles.label}>Owner</div>
                                        <div className={styles.value}>{post.ownerFullName || 'Unknown user'}</div>
                                    </div>

                                    <div className={styles.contentBlock}>
                                        <div className={styles.label}>Field Address</div>
                                        <div className={styles.value}>{post.fieldAddress || '--'}</div>
                                    </div>

                                    <div className={styles.contentBlock}>
                                        <div className={styles.label}>Post Content</div>
                                        <div className={styles.copy}>{post.content || '--'}</div>
                                    </div>

                                    <div className={styles.statRow}>
                                        <div className={styles.stat}>
                                            <span>Asking Price</span>
                                            <strong>{formatPassMoney(post.askingPrice)}</strong>
                                        </div>
                                        <div className={styles.stat}>
                                            <span>Ticket Status</span>
                                            <strong>{post.ticketStatus || '--'}</strong>
                                        </div>
                                    </div>

                                    {!isOwner ? (
                                        <div className={styles.actions}>
                                            <button
                                                className={styles.primaryBtn}
                                                onClick={() => setContactPost(post)}
                                                type='button'
                                            >
                                                Contact
                                            </button>
                                        </div>
                                    ) : null}
                                </article>
                            );
                        })}
                    </div>
                ) : null}
            </div>

            <ContactPassPostModal
                onClose={() => setContactPost(null)}
                onSuccess={(conversation) => {
                    setContactPost(null);
                    if (conversation?.id) {
                        navigate(`/pass-conversations/${conversation.id}`);
                    }
                }}
                open={Boolean(contactPost)}
                post={contactPost}
            />
        </div>
    );
}
