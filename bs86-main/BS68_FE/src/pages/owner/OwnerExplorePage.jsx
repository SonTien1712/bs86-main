import { useEffect, useState } from 'react';
import { postsApi } from '../../api/postsApi';
import { ownerApi } from '../../api/ownerApi';
import PostComposerModal from '../../components/owner/posts/PostComposerModal';
import OwnerPostsSection from '../../components/owner/posts/OwnerPostsSection';
import styles from './OwnerExplorePage.module.scss';

const INIT_FORM = { fieldId: '', content: '' };

export default function OwnerExplorePage() {
    const [posts, setPosts] = useState([]);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(INIT_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [errMsg, setErrMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const loadMyPosts = async () => {
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

    useEffect(() => {
        loadMyPosts();
        loadMyFields();
    }, []);

    const openModal = () => {
        setForm({ ...INIT_FORM, fieldId: fields[0] ? String(fields[0].id) : '' });
        setErrMsg('');
        setSuccessMsg('');
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!form.fieldId || !form.content.trim()) {
            setErrMsg('Vui lòng chọn sân và nhập nội dung thông báo.');
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
            setSuccessMsg('Đã đăng bài thành công!');
            setTimeout(() => {
                setShowModal(false);
                loadMyPosts();
            }, 1200);
        } catch (e) {
            setErrMsg(e?.response?.data?.message || e?.message || 'Đăng bài thất bại.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.shell}>
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <div>
                        <div className={styles.headerTitle}>Bài Đăng Của Tôi</div>
                        <div className={styles.headerSub}>Quản lý thông báo sân trống</div>
                    </div>
                    <button className={styles.newBtn} onClick={openModal}>
                        + Đăng sân trống
                    </button>
                </div>
            </div>

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

            <OwnerPostsSection
                styles={styles}
                variant='explore'
                posts={posts}
                loading={loading}
            />
        </div>
    );
}

