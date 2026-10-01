import { Navigate } from 'react-router-dom';

export default function ResetPasswordPage() {
    return <Navigate to='/auth?mode=reset' replace />;
}
