import { Link } from 'react-router-dom';
import styles from './HotPage.module.css';

const highlights = [
    {
        eyebrow: 'Đặt sân nhanh',
        title: 'Tìm sân phù hợp trong vài giây',
        description:
            'Lọc theo khu vực, môn thể thao và giờ hoạt động để ra quyết định nhanh hơn.'
    },
    {
        eyebrow: 'Bản đồ trực quan',
        title: 'Xem vị trí và di chuyển dễ dàng',
        description:
            'Mở bản đồ để tìm sân gần bạn, theo dõi địa chỉ và chọn điểm đến thuận tiện nhất.'
    },
    {
        eyebrow: 'Cộng đồng sôi động',
        title: 'Kết nối với nhóm và trận đấu nổi bật',
        description:
            'Theo dõi nội dung nổi bật, bài đăng hữu ích và các cơ hội giao lưu cùng người chơi khác.'
    }
];

const stats = [
    { value: '24/7', label: 'Sẵn sàng để bạn khám phá sân mới' },
    { value: 'Map', label: 'Xem vị trí sân ngay trong giao diện' },
    { value: 'One tap', label: 'Đi từ khám phá sang đặt lịch nhanh gọn' }
];

export default function HotPage() {
    return (
        <div className={styles.page}>
            <section className={styles.hero}>
                <div className={styles.copyColumn}>
                    <p className={styles.eyebrow}>Booking Sport Spotlight</p>
                    <h1 className={styles.title}>
                        Khám phá Booking Sport, nơi giúp bạn tìm sân đẹp, đặt
                        lịch nhanh và kết nối cùng cộng đồng thể thao.
                    </h1>
                    <p className={styles.description}>
                        Từ tìm sân theo khu vực, xem bản đồ trực quan cho đến
                        theo dõi những nội dung nổi bật, website được thiết kế
                        để biến hành trình chơi thể thao trở nên mạch lạc, dễ
                        dùng và đầy cảm hứng hơn mỗi ngày.
                    </p>

                    <div className={styles.actionRow}>
                        <Link className={styles.primaryButton} to='/home'>
                            Khám phá sân ngay
                        </Link>
                        <Link className={styles.secondaryButton} to='/map'>
                            Mở bản đồ
                        </Link>
                    </div>

                    <div className={styles.metricRow}>
                        {stats.map((item) => (
                            <div className={styles.metricCard} key={item.value}>
                                <strong>{item.value}</strong>
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.visualColumn}>
                    <div className={styles.visualBackdrop} />

                    <div className={styles.heroCard}>
                        <div className={styles.heroCardTop}>
                            <span className={styles.liveBadge}>Live</span>
                            <span className={styles.heroTag}>
                                Nền tảng đặt sân thông minh
                            </span>
                        </div>

                        <div className={styles.heroCardBody}>
                            <div>
                                <p className={styles.previewLabel}>
                                    Trải nghiệm nổi bật
                                </p>
                                <h2>
                                    Tất cả những gì bạn cần để bắt đầu một trận
                                    chơi tuyệt hơn.
                                </h2>
                            </div>

                            <div className={styles.featureGrid}>
                                <div className={styles.featureCard}>
                                    <span>Tìm nhanh</span>
                                    <strong>Sân, khung giờ, vị trí</strong>
                                </div>
                                <div className={styles.featureCard}>
                                    <span>Đặt lịch</span>
                                    <strong>Chuyển đổi mượt mà trong vài bước</strong>
                                </div>
                                <div className={styles.featureCard}>
                                    <span>Khuyến nghị</span>
                                    <strong>Đề xuất nơi bạn nên xem tiếp</strong>
                                </div>
                                <div className={styles.featureCard}>
                                    <span>Cộng đồng</span>
                                    <strong>Theo dõi nhóm và nội dung hot</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`${styles.floatingCard} ${styles.floatingCardTop}`}>
                        <span className={styles.floatingLabel}>Best flow</span>
                        <strong>Từ khám phá đến đặt lịch trong một mạch</strong>
                    </div>

                    <div className={`${styles.floatingCard} ${styles.floatingCardBottom}`}>
                        <span className={styles.floatingLabel}>For players</span>
                        <strong>Bản đồ, bài đăng, sân công khai và điểm hẹn</strong>
                    </div>
                </div>
            </section>

            <section className={styles.highlightSection}>
                {highlights.map((item) => (
                    <article className={styles.highlightCard} key={item.title}>
                        <p className={styles.highlightEyebrow}>{item.eyebrow}</p>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                    </article>
                ))}
            </section>
        </div>
    );
}
