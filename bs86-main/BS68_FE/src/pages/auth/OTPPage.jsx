import { Navigate } from 'react-router-dom';

export default function OTPPage() {
    return <Navigate to='/auth?mode=verify' replace />;
}
