import { Navigate } from 'react-router-dom';

export default function LoginPage() {
    return <Navigate to='/auth?mode=login' replace />;
}
