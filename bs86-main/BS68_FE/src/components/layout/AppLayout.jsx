import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from '../nav/BottomNav';
import NotificationBell from '../notifications/NotificationBell';
import { NotificationProvider } from '../notifications/NotificationProvider';
import s from './AppLayout.module.scss';

export default function AppLayout() {
    return (
        <NotificationProvider>
            <div className={s.shell}>
                <NotificationBell />

                <main className={s.main}>
                    <Outlet />
                </main>

                <BottomNav />
            </div>
        </NotificationProvider>
    );
}
