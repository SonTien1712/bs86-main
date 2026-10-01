function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
}

export default function OwnerPostsSection({
    styles,
    variant = 'account',
    posts = [],
    loading,
    onCreate
}) {
    if (variant === 'explore') {
        return (
            <div className={styles.section}>
                <div className={styles.sectionTitle}>
                    {posts.length > 0 ? `${posts.length} bài đăng hoạt động` : 'Bài đăng'}
                </div>

                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner} />
                        <div>Đang tải...</div>
                    </div>
                ) : null}

                {!loading && posts.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>Bài</div>
                        <div>Chưa có bài đăng nào.</div>
                        <div style={{ fontSize: '0.8rem', marginTop: 6 }}>
                            Nhấn <b>+ Đăng sân trống</b> để bắt đầu.
                        </div>
                    </div>
                ) : null}

                {!loading &&
                    posts.map((post) => (
                        <div className={styles.card} key={post.id}>
                            <div className={styles.cardTop}>
                                <div className={styles.postText}>{post.content}</div>
                                <span className={styles.activeBadge}>Đang hiển thị</span>
                            </div>
                            <div className={styles.cardMeta}>
                                <div className={styles.metaInfo}>
                                    Field <span>#{post.fieldId}</span>
                                </div>
                                <div className={styles.postTime}>{timeAgo(post.createdAt)}</div>
                            </div>
                        </div>
                    ))}
            </div>
        );
    }

    return (
        <section className={styles.ownerPostPanel}>
            <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleWrap}>
                    <div className={styles.sectionEyebrow}>Thông báo nhanh</div>
                    <div className={styles.sectionTitle}>
                        Bài đăng của tôi {posts.length > 0 ? `(${posts.length})` : ''}
                    </div>
                    <div className={styles.sectionSubcopy}>
                        Đăng bài nhanh khi còn sân trống để tiếp cận người chơi và tăng booking.
                    </div>
                </div>
                <button className={styles.newPostBtn} onClick={onCreate} type='button'>
                    + Đăng sân trống
                </button>
            </div>

            <div className={styles.postsList}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner} />
                        <div>Đang tải...</div>
                    </div>
                ) : null}

                {!loading && posts.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>Bài</div>
                        <div>Chưa có bài đăng nào.</div>
                        <div style={{ fontSize: '0.78rem', marginTop: 6 }}>
                            Nhấn <b>+ Đăng sân trống</b> để thông báo sân trống của bạn.
                        </div>
                    </div>
                ) : null}

                {!loading &&
                    posts.map((post) => (
                        <div className={styles.postCard} key={post.id}>
                            <div className={styles.postCardTop}>
                                <div className={styles.postText}>{post.content}</div>
                                <span className={styles.activePill}>Đang hiển thị</span>
                            </div>
                            <div className={styles.postMeta}>
                                <span>
                                    Field <span>#{post.fieldId}</span>
                                </span>
                                <span>{timeAgo(post.createdAt)}</span>
                            </div>
                        </div>
                    ))}
            </div>
        </section>
    );
}
