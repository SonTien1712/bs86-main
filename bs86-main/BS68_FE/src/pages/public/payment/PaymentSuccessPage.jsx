import { useEffect } from 'react';
import {
    formatAmount,
    formatDateTime,
    getBookingReturnTarget,
    getPaymentStatus
} from './paymentResultUtils';
import './PaymentResultPage.css';

export default function PaymentSuccessPage({
    continueError,
    data,
    isContinuing,
    onAutoRedirect,
    onContinueNextPayment,
    onGoToHistory,
    onBackToProfile,
    onBackToBookings,
    remainingPayments
}) {
    useEffect(() => {
        if (remainingPayments > 0) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            if (typeof onAutoRedirect === 'function') {
                onAutoRedirect();
            }
        }, 2500);

        return () => window.clearTimeout(timer);
    }, [onAutoRedirect, remainingPayments]);

    const bookingTarget = getBookingReturnTarget(data);

    return (
        <div className='payment-result-card success'>
            <div className='payment-result-kicker'>Payment verified</div>
            <h1 className='payment-result-title'>Payment successful</h1>
            <p className='payment-result-copy'>
                Backend has confirmed the VNPay callback and updated booking, slot, and transaction
                status.
            </p>
            {remainingPayments > 0 ? (
                <p className='payment-result-subcopy'>
                    Còn {remainingPayments} booking cần thanh toán. Bạn có thể tiếp tục mở phiên VNPay
                    tiếp theo ngay tại đây.
                </p>
            ) : null}
            {continueError ? <p className='payment-result-subcopy'>{continueError}</p> : null}

            <div className='payment-result-details'>
                <div className='payment-result-item'>
                    <span>Booking ID</span>
                    <strong>{data?.bookingId ?? '--'}</strong>
                </div>
                <div className='payment-result-item'>
                    <span>Amount</span>
                    <strong>{formatAmount(data?.amount)}</strong>
                </div>
                <div className='payment-result-item'>
                    <span>Transaction ID</span>
                    <strong>{data?.transactionId || data?.orderCode || '--'}</strong>
                </div>
                <div className='payment-result-item'>
                    <span>Payment status</span>
                    <strong>{getPaymentStatus(data) || 'SUCCESS'}</strong>
                </div>
            </div>

            <div className='payment-result-meta'>
                <div className='payment-result-meta-item'>
                    <span>Booking status</span>
                    <strong>{data?.bookingStatus || '--'}</strong>
                </div>
                <div className='payment-result-meta-item'>
                    <span>Paid at</span>
                    <strong>{formatDateTime(data?.paidAt)}</strong>
                </div>
                <div className='payment-result-meta-item'>
                    <span>Order code</span>
                    <strong>{data?.orderCode || '--'}</strong>
                </div>
            </div>

            <div className='payment-result-actions'>
                {remainingPayments > 0 ? (
                    <button
                        className='payment-result-btn primary'
                        disabled={isContinuing}
                        onClick={onContinueNextPayment}
                        type='button'
                    >
                        {isContinuing ? 'Đang mở VNPay tiếp theo...' : 'Thanh toán booking tiếp theo'}
                    </button>
                ) : null}
                <button className='payment-result-btn primary' onClick={onGoToHistory} type='button'>
                    View transaction history
                </button>
                <button className='payment-result-btn secondary' onClick={onBackToProfile} type='button'>
                    Back to profile
                </button>
                <button
                    className='payment-result-btn secondary'
                    onClick={() => onBackToBookings(bookingTarget)}
                    type='button'
                >
                    Back to bookings
                </button>
            </div>
        </div>
    );
}
