import {
    formatAmount,
    formatDateTime,
    getBookingReturnTarget,
    getPaymentStatus,
    getResultMessage,
    isFailurePaymentResult
} from './paymentResultUtils';
import './PaymentResultPage.css';

export default function PaymentErrorPage({
    continueError,
    data,
    errorMessage,
    isContinuing,
    onContinueNextPayment,
    onTryAgain,
    onBackToBooking,
    onGoToProfile,
    remainingPayments
}) {
    const bookingTarget = getBookingReturnTarget(data);
    const expired = getPaymentStatus(data).toUpperCase() === 'EXPIRED' || data?.bookingStatus === 'EXPIRED';
    const reason = errorMessage || getResultMessage(data, 'Payment was not completed.');

    return (
        <div className='payment-result-card failure'>
            <div className='payment-result-kicker'>Payment failed</div>
            <h1 className='payment-result-title'>Payment could not be completed</h1>
            <p className='payment-result-copy'>{reason}</p>
            {expired ? (
                <p className='payment-result-subcopy'>
                    The temporary slot hold has been released and the booking is available again.
                </p>
            ) : null}
            {remainingPayments > 0 ? (
                <p className='payment-result-subcopy'>
                    Còn {remainingPayments} booking khác đang chờ thanh toán, bạn có thể tiếp tục với
                    booking kế tiếp.
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
                    <strong>{getPaymentStatus(data) || (isFailurePaymentResult(data) ? 'FAILED' : '--')}</strong>
                </div>
            </div>

            <div className='payment-result-meta'>
                <div className='payment-result-meta-item'>
                    <span>Booking status</span>
                    <strong>{data?.bookingStatus || '--'}</strong>
                </div>
                <div className='payment-result-meta-item'>
                    <span>Processed at</span>
                    <strong>{formatDateTime(data?.updatedAt || data?.createdAt)}</strong>
                </div>
                <div className='payment-result-meta-item'>
                    <span>Fail reason</span>
                    <strong>{data?.failReason || data?.message || '--'}</strong>
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
                <button
                    className='payment-result-btn primary'
                    onClick={() => onTryAgain(bookingTarget)}
                    type='button'
                >
                    Try again
                </button>
                <button
                    className='payment-result-btn secondary'
                    onClick={() => onBackToBooking(bookingTarget)}
                    type='button'
                >
                    Back to booking
                </button>
                <button className='payment-result-btn secondary' onClick={onGoToProfile} type='button'>
                    Go to profile
                </button>
            </div>
        </div>
    );
}
