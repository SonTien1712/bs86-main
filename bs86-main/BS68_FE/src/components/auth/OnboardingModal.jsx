import React, { useEffect, useRef } from 'react';

/**
 * OnboardingModal
 *
 * Shown immediately after a successful OTP verification (auto-login).
 * Asks the user whether they want to complete their profile or skip to home.
 *
 * Props:
 *   isOpen   {boolean}   – whether the modal is visible
 *   onYes    {function}  – called when user clicks "Cập nhật hồ sơ"  → navigate('/profile')
 *   onNo     {function}  – called when user clicks "Để sau"          → navigate('/home')
 */
export default function OnboardingModal({ isOpen, onYes, onNo }) {
    const dialogRef = useRef(null);

    // Trap focus & close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const el = dialogRef.current;
        if (el) el.focus();

        const handleKey = (e) => {
            if (e.key === 'Escape') onNo?.();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onNo]);

    if (!isOpen) return null;

    return (
        <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
            {/* Backdrop click → skip */}
            <div style={styles.backdrop} onClick={onNo} />

            <div style={styles.card} ref={dialogRef} tabIndex={-1}>
                {/* Icon */}
                <div style={styles.iconWrap}>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <circle cx="24" cy="24" r="24" fill="rgba(74,222,128,0.12)" />
                        <path
                            d="M16 24.5l5.5 5.5L33 18"
                            stroke="#4ade80"
                            strokeWidth="2.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>

                <h2 id="onboarding-title" style={styles.title}>
                    Tài khoản đã xác thực! 🎉
                </h2>

                <p style={styles.body}>
                    Bạn có muốn cập nhật thông tin hồ sơ ngay bây giờ không?
                    <br />
                    <span style={styles.hint}>Hồ sơ đầy đủ giúp đặt sân nhanh hơn.</span>
                </p>

                <div style={styles.actions}>
                    <button style={styles.yesBtn} onClick={onYes}>
                        Cập nhật hồ sơ
                    </button>
                    <button style={styles.noBtn} onClick={onNo}>
                        Để sau
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Inline styles (no CSS-module dependency, works anywhere)
// ---------------------------------------------------------------------------

const styles = {
    overlay: {
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    backdrop: {
        position: 'absolute',
        inset: 0,
        background: 'rgba(5,10,18,0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
    },
    card: {
        position: 'relative',
        zIndex: 1,
        background: 'linear-gradient(160deg, #0f1e2e 0%, #0a1520 100%)',
        border: '1px solid rgba(74,222,128,0.18)',
        borderRadius: 20,
        padding: '40px 36px 32px',
        width: '100%',
        maxWidth: 400,
        textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(74,222,128,0.06)',
        outline: 'none',
        animation: 'onboardingPop 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
    },
    iconWrap: {
        marginBottom: 20,
        display: 'flex',
        justifyContent: 'center',
    },
    title: {
        margin: '0 0 12px',
        fontSize: 22,
        fontWeight: 700,
        color: '#e8f4f8',
        letterSpacing: '-0.3px',
    },
    body: {
        margin: '0 0 28px',
        fontSize: 15,
        color: '#8daabf',
        lineHeight: 1.6,
    },
    hint: {
        fontSize: 13,
        color: '#5a7a94',
    },
    actions: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
    yesBtn: {
        padding: '13px 0',
        borderRadius: 12,
        border: 'none',
        background: 'linear-gradient(135deg, #16a34a 0%, #4ade80 100%)',
        color: '#fff',
        fontSize: 15,
        fontWeight: 700,
        cursor: 'pointer',
        letterSpacing: '0.2px',
        transition: 'opacity 0.15s',
    },
    noBtn: {
        padding: '12px 0',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'transparent',
        color: '#8daabf',
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'border-color 0.15s, color 0.15s',
    },
};

// Inject keyframe once
if (typeof document !== 'undefined' && !document.getElementById('onboarding-anim')) {
    const style = document.createElement('style');
    style.id = 'onboarding-anim';
    style.textContent = `
        @keyframes onboardingPop {
            from { opacity: 0; transform: scale(0.88) translateY(12px); }
            to   { opacity: 1; transform: scale(1)    translateY(0);     }
        }
    `;
    document.head.appendChild(style);
}