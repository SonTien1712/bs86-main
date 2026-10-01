import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import AuthPage from './pages/auth/AuthPage';
import OwnerRegisterPage from './pages/auth/OwnerRegisterPage';
import CreateFieldPage from './pages/owner/CreateFieldPage';
import OwnerCheckInPage from './pages/owner/OwnerCheckInPage';
import OwnerExplorePage from './pages/owner/OwnerExplorePage';
import AdminWorkspacePage from './pages/admin/AdminWorkspacePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminFieldApprovalPage from './pages/admin/AdminFieldApprovalPage';
import AdminOwnerApprovalPage from './pages/admin/AdminOwnerApprovalPage';
import MapPage from './pages/public/map/MapPage';
import ExplorePage from './pages/public/explore/ExplorePage';
import AccountPage from './pages/public/account/AccountPage';
import BookingPage from './pages/public/booking/BookingPage';
import BookingDetailPage from './pages/public/booking/BookingDetailPage';
import PublicFieldsPage from './pages/public/fields/PublicFieldsPage';
import PublicFieldDetailPage from './pages/public/fields/PublicFieldDetailPage';
import HotPage from './pages/public/hot/HotPage';
import GroupsPage from './pages/public/group/GroupsPage';
import GroupDetailPage from './pages/public/group/GroupDetailPage';
import GroupInvitePage from './pages/public/group/GroupInvitePage';
import PaymentResultPage from './pages/public/payment/PaymentResultPage';
import ProfilePage from './pages/customer/ProfilePage';
import PassConversationsPage from './pages/customer/pass/PassConversationsPage';
import PassConversationDetailPage from './pages/customer/pass/PassConversationDetailPage';
import { parseAuthFromToken } from './utils/auth';
import ReportField from './components/report/ReportField';

function AdminRoute({ children }) {
    const auth = parseAuthFromToken();

    if (!auth.isAuthenticated) {
        return <Navigate to='/auth' replace />;
    }

    if (!auth.isAdmin) {
        return <Navigate to='/account' replace />;
    }

    return children;
}

function OwnerRoute({ children }) {
    const auth = parseAuthFromToken();

    if (!auth.isAuthenticated) {
        return <Navigate to='/auth' replace />;
    }

    if (auth.isAdmin) {
        return <Navigate to='/admin' replace />;
    }

    if (!auth.rawIsOwner) {
        return <Navigate to='/account' replace />;
    }

    // Block PENDING/BLOCKED owners from accessing owner management pages
    const status = auth.payload?.status;
    if (status && status !== 'ACTIVE') {
        return <Navigate to='/account' replace />;
    }

    return children;
}

function UserProfileRoute({ children }) {
    const auth = parseAuthFromToken();

    if (!auth.isAuthenticated) {
        return <Navigate to='/auth' replace />;
    }

    if (auth.isAdmin) {
        return <Navigate to='/admin' replace />;
    }

    if (auth.rawIsOwner) {
        return <Navigate to='/account' replace />;
    }

    return children;
}

export default function App() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route path='/' element={<Navigate to='/home' />} />
                <Route path='/home' element={<PublicFieldsPage />} />
                <Route path='/san' element={<PublicFieldsPage />} />
                <Route path='/san/:slug' element={<PublicFieldDetailPage />} />

                <Route path='/groups' element={<GroupsPage />} />
                <Route path='/groups/invite' element={<GroupInvitePage />} />
                <Route path='/groups/:groupId' element={<GroupDetailPage />} />

                <Route path='/map' element={<MapPage />} />
                <Route path='/explore' element={<ExplorePage />} />
                <Route
                    path='/fields/:fieldId/booking'
                    element={<BookingPage />}
                />
                <Route
                    path='/bookings/:bookingId'
                    element={<BookingDetailPage />}
                />
                <Route path='/payment-result' element={<PaymentResultPage />} />
                <Route path='/hot' element={<HotPage />} />
                <Route path='/account' element={<AccountPage />} />
                <Route
                    path='/userprofile/:id?'
                    element={
                        <UserProfileRoute>
                            <ProfilePage />
                        </UserProfileRoute>
                    }
                />
                <Route path='/report/:fieldId' element={<ReportField />} />
                <Route
                    path='/profileuser'
                    element={
                        <UserProfileRoute>
                            <ProfilePage />
                        </UserProfileRoute>
                    }
                />
                <Route
                    path='/profileuser/:id'
                    element={
                        <UserProfileRoute>
                            <ProfilePage />
                        </UserProfileRoute>
                    }
                />
                <Route
                    path='/profile'
                    element={
                        <UserProfileRoute>
                            <ProfilePage />
                        </UserProfileRoute>
                    }
                />
                <Route
                    path='/pass-posts'
                    element={
                        <Navigate to='/explore?category=PASSSAN' replace />
                    }
                />
                <Route
                    path='/pass-conversations'
                    element={
                        <UserProfileRoute>
                            <PassConversationsPage />
                        </UserProfileRoute>
                    }
                />
                <Route
                    path='/pass-conversations/:id'
                    element={
                        <UserProfileRoute>
                            <PassConversationDetailPage />
                        </UserProfileRoute>
                    }
                />

                <Route
                    path='/owner/create-field'
                    element={
                        <OwnerRoute>
                            <CreateFieldPage />
                        </OwnerRoute>
                    }
                />
                <Route
                    path='/owner/explore'
                    element={
                        <OwnerRoute>
                            <OwnerExplorePage />
                        </OwnerRoute>
                    }
                />
                <Route
                    path='/owner/check-in'
                    element={
                        <OwnerRoute>
                            <OwnerCheckInPage />
                        </OwnerRoute>
                    }
                />

                <Route path='/booking/:fieldId' element={<BookingPage />} />

                <Route
                    path='/admin'
                    element={
                        <AdminRoute>
                            <AdminWorkspacePage />
                        </AdminRoute>
                    }
                />
                <Route
                    path='/admin/dashboard'
                    element={
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    }
                />
                <Route
                    path='/admin/fields-approval'
                    element={
                        <AdminRoute>
                            <AdminFieldApprovalPage />
                        </AdminRoute>
                    }
                />
                <Route
                    path='/admin/owners-approval'
                    element={
                        <AdminRoute>
                            <AdminOwnerApprovalPage />
                        </AdminRoute>
                    }
                />
            </Route>

            <Route path='/auth' element={<AuthPage />} />
            <Route path='/register-owner' element={<OwnerRegisterPage />} />
            <Route
                path='/login'
                element={<Navigate to='/auth?mode=login' replace />}
            />
            <Route
                path='/register'
                element={<Navigate to='/auth?mode=register' replace />}
            />
            <Route
                path='/otp'
                element={<Navigate to='/auth?mode=verify' replace />}
            />
            <Route
                path='/forgot-password'
                element={<Navigate to='/auth?mode=forgot' replace />}
            />
            <Route
                path='/reset-password'
                element={<Navigate to='/auth?mode=reset' replace />}
            />
        </Routes>
    );
}
