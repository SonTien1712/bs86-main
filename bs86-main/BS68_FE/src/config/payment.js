export const PAYMENT_RESULT_PATH = '/payment-result';

export function getFrontendOrigin() {
    const envOrigin =
        import.meta.env.VITE_FRONTEND_ORIGIN ||
        import.meta.env.VITE_APP_ORIGIN ||
        '';

    if (envOrigin) {
        return envOrigin.replace(/\/+$/, '');
    }

    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
    }

    return '';
}

export function getPaymentResultUrl() {
    const origin = getFrontendOrigin();
    return origin ? `${origin}${PAYMENT_RESULT_PATH}` : PAYMENT_RESULT_PATH;
}
