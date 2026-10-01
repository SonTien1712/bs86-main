import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './ReportField.module.css';
import { getApiBaseUrl } from '../../config/runtime';

const API_BASE = getApiBaseUrl();
export default function ReportField() {
    const { fieldId } = useParams();
    const nav = useNavigate();

    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    const getToken = () => {
        try {
            const auth = localStorage.getItem('auth');
            if (!auth) return null;
            return JSON.parse(auth).token; // 👈 QUAN TRỌNG
        } catch {
            return null;
        }
    };

    const handleSubmit = async () => {
        if (!reason.trim()) {
            setMsg('Vui lòng nhập lý do');
            return;
        }

        setLoading(true);
        setMsg('');

        try {
            const token = getToken();

            const res = await fetch(`${API_BASE}/reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    fieldId: Number(fieldId),
                    reason: reason
                })
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Gửi thất bại');
            }

            setMsg('✅ Báo cáo thành công!');
            setReason('');

            setTimeout(() => {
                nav('/');
            }, 1500);
        } catch (e) {
            setMsg(e.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.reportContainer}>
            <div className={styles.reportCard}>
                <h2>Báo cáo sân</h2>

                <textarea
                    placeholder='Nhập lý do báo cáo...'
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />

                <button onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
                </button>

                {msg && <div className={styles.reportMsg}>{msg}</div>}
            </div>
        </div>
    );
}
