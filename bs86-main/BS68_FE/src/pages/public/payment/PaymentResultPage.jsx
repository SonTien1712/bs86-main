import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    clearPendingPayment,
    consumePendingPaymentQueue,
    createVnpayPayment,
    hasVnpayParams,
    rememberPendingPayment,
    verifyVnpayReturn
} from '../../../api/paymentApi';
import { getPaymentResultUrl } from '../../../config/payment';
import PaymentErrorPage from './PaymentErrorPage';
import PaymentSuccessPage from './PaymentSuccessPage';
import {
    getErrorMessage,
    isFailurePaymentResult,
    isSuccessPaymentResult
} from './paymentResultUtils';
import './PaymentResultPage.css';

function LoadingState() {
    return (
        <div className='payment-result-card neutral'>
            <div className='payment-result-spinner' aria-hidden='true' />
            <div className='payment-result-kicker'>Verifying payment</div>
            <h1 className='payment-result-title'>Processing callback</h1>
            <p className='payment-result-copy'>
                Verifying the VNPay callback with the backend. Please do not refresh this page.
            </p>
        </div>
    );
}

function MissingState({ onGoToProfile, onGoHome }) {
    return (
        <div className='payment-result-card neutral'>
            <div className='payment-result-kicker'>Payment callback</div>
            <h1 className='payment-result-title'>Waiting for VNPay callback data</h1>
            <p className='payment-result-copy'>
                This page should be opened by VNPay redirecting back to the frontend.
            </p>
            <p className='payment-result-subcopy'>
                Configure VNPay return URL to use:
                {' '}
                <b>{getPaymentResultUrl()}</b>
            </p>
            <div className='payment-result-actions'>
                <button className='payment-result-btn primary' onClick={onGoToProfile} type='button'>
                    Back to profile
                </button>
                <button className='payment-result-btn secondary' onClick={onGoHome} type='button'>
                    Back to home
                </button>
            </div>
        </div>
    );
}

function VerificationErrorState({ error, onRetry, onGoToProfile, onGoHome }) {
    return (
        <div className='payment-result-card failure'>
            <div className='payment-result-kicker'>Verification error</div>
            <h1 className='payment-result-title'>Unable to verify payment</h1>
            <p className='payment-result-copy'>{error}</p>
            <div className='payment-result-actions'>
                <button className='payment-result-btn primary' onClick={onRetry} type='button'>
                    Retry verification
                </button>
                <button className='payment-result-btn secondary' onClick={onGoToProfile} type='button'>
                    Back to profile
                </button>
                <button className='payment-result-btn secondary' onClick={onGoHome} type='button'>
                    Back to home
                </button>
            </div>
        </div>
    );
}

export default function PaymentResultPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [state, setState] = useState({
        status: 'idle',
        data: null,
        error: ''
    });
    const [queueState, setQueueState] = useState({
        current: null,
        next: null,
        remainingCount: 0
    });
    const [continuing, setContinuing] = useState(false);
    const [continueError, setContinueError] = useState('');

    const hasParams = useMemo(() => hasVnpayParams(location.search), [location.search]);

    useEffect(() => {
        let active = true;

        async function runVerification() {
            if (!hasParams) {
                setState({
                    status: 'missing',
                    data: null,
                    error: ''
                });
                return;
            }

            setState({
                status: 'loading',
                data: null,
                error: ''
            });

            try {
                const data = await verifyVnpayReturn(location.search);

                if (!active) {
                    return;
                }

                const nextQueueState = consumePendingPaymentQueue(data?.bookingId);

                setState({
                    status: 'resolved',
                    data,
                    error: ''
                });
                clearPendingPayment();
                if (nextQueueState.next) {
                    rememberPendingPayment(nextQueueState.next);
                }
                setQueueState(nextQueueState);
                setContinueError('');
            } catch (error) {
                if (!active) {
                    return;
                }

                setState({
                    status: 'error',
                    data: null,
                    error: getErrorMessage(error, 'Unable to verify payment result')
                });
            }
        }

        runVerification();

        return () => {
            active = false;
        };
    }, [hasParams, location.search]);

    const goToProfile = () => navigate('/profileuser');
    const goHome = () => navigate('/home');
    const goToHistory = () => navigate('/profileuser#transactions');
    const goBackToBooking = (target) => {
        if (target) {
            if (/^https?:\/\//i.test(target)) {
                window.location.assign(target);
            } else {
                navigate(target);
            }
            return;
        }

        navigate('/home');
    };

    const continueNextPayment = async () => {
        if (!queueState.next?.bookingId || continuing) {
            return;
        }

        setContinuing(true);
        setContinueError('');

        try {
            rememberPendingPayment(queueState.next);
            const payment = await createVnpayPayment(queueState.next.bookingId);
            window.location.assign(payment.paymentUrl);
        } catch (error) {
            clearPendingPayment();
            setContinueError(getErrorMessage(error, 'Unable to create the next VNPay payment.'));
            setContinuing(false);
        }
    };

    const result = state.data;
    const isSuccess = isSuccessPaymentResult(result);
    const isFailure = isFailurePaymentResult(result);
    const failureMessage =
        state.error || (isFailure ? '' : 'Payment result returned by backend could not be classified clearly.');

    return (
        <div className='payment-result-shell'>
            {state.status === 'loading' ? <LoadingState /> : null}

            {state.status === 'missing' ? (
                <MissingState onGoToProfile={goToProfile} onGoHome={goHome} />
            ) : null}

            {state.status === 'error' ? (
                <VerificationErrorState
                    error={state.error}
                    onRetry={() => window.location.reload()}
                    onGoToProfile={goToProfile}
                    onGoHome={goHome}
                />
            ) : null}

            {state.status === 'resolved' ? (
                isSuccess ? (
                    <PaymentSuccessPage
                        continueError={continueError}
                        data={result}
                        isContinuing={continuing}
                        onAutoRedirect={goToProfile}
                        onContinueNextPayment={continueNextPayment}
                        onGoToHistory={goToHistory}
                        onBackToProfile={goToProfile}
                        onBackToBookings={goBackToBooking}
                        remainingPayments={queueState.remainingCount}
                    />
                ) : (
                    <PaymentErrorPage
                        continueError={continueError}
                        data={result}
                        errorMessage={failureMessage}
                        isContinuing={continuing}
                        onContinueNextPayment={continueNextPayment}
                        onTryAgain={goBackToBooking}
                        onBackToBooking={goBackToBooking}
                        onGoToProfile={goToProfile}
                        remainingPayments={queueState.remainingCount}
                    />
                )
            ) : null}
        </div>
    );
}
