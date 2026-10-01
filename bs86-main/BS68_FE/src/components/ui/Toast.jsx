import { useEffect, useRef } from 'react';

/**
 * Simple 3-second auto-dismiss toast.
 *
 * Usage:
 *   const [toast, setToast] = useState(null); // { message, type: 'success'|'error' }
 *   <Toast toast={toast} onDismiss={() => setToast(null)} />
 *
 *   // trigger:
 *   setToast({ message: 'Duyệt thành công!', type: 'success' });
 */
export default function Toast({ toast, onDismiss, duration = 3000 }) {
    const timerRef = useRef(null);

    useEffect(() => {
        if (!toast) return;
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            onDismiss?.();
        }, duration);
        return () => clearTimeout(timerRef.current);
    }, [toast, duration, onDismiss]);

    if (!toast) return null;

    const isSuccess = toast.type === 'success';

    const containerStyle = {
        position: 'fixed',
        bottom: 28,
        right: 28,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 18px',
        borderRadius: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        fontSize: 14,
        fontWeight: 600,
        color: '#f8fafc',
        minWidth: 240,
        maxWidth: 380,
        cursor: 'pointer',
        animation: 'toastSlideIn 0.22s ease',
        background: isSuccess
            ? 'linear-gradient(135deg, #059669 0%, #065f46 100%)'
            : 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
        border: `1px solid ${isSuccess ? 'rgba(52,211,153,0.3)' : 'rgba(252,165,165,0.3)'}`,
    };

    const iconStyle = {
        fontSize: 18,
        flexShrink: 0,
    };

    return (
        <>
            <style>{`
                @keyframes toastSlideIn {
                    from { opacity: 0; transform: translateY(14px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)     scale(1);    }
                }
            `}</style>
            <div style={containerStyle} onClick={onDismiss} role="alert" aria-live="polite">
                <span style={iconStyle}>{isSuccess ? '✅' : '❌'}</span>
                <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
                <span style={{ opacity: 0.55, fontSize: 16, marginLeft: 4, flexShrink: 0 }}>×</span>
            </div>
        </>
    );
}
