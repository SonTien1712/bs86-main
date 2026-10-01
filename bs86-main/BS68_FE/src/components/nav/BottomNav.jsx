import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './BottomNav.css';
import { getAccountLandingRoute, parseAuthFromToken } from '../../utils/auth';

function HomeIcon() {
    return (
        <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
            <path
                d='M4.75 10.25L12 4.5L19.25 10.25V18.5C19.25 19.19 18.69 19.75 18 19.75H14.25V14.75H9.75V19.75H6C5.31 19.75 4.75 19.19 4.75 18.5V10.25Z'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinecap='round'
                strokeLinejoin='round'
            />
        </svg>
    );
}

function MapIcon() {
    return (
        <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
            <path
                d='M4.75 6.25L9.75 4.5L14.25 6.25L19.25 4.5V17.75L14.25 19.5L9.75 17.75L4.75 19.5V6.25Z'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinecap='round'
                strokeLinejoin='round'
            />
            <path d='M9.75 4.5V17.75' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' />
            <path d='M14.25 6.25V19.5' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' />
        </svg>
    );
}

function CompassIcon() {
    return (
        <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
            <circle cx='12' cy='12' r='8.25' stroke='currentColor' strokeWidth='1.8' />
            <path
                d='M14.9 9.1L13.3 13.3L9.1 14.9L10.7 10.7L14.9 9.1Z'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinecap='round'
                strokeLinejoin='round'
            />
        </svg>
    );
}

function FlameIcon() {
    return (
        <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
            <path
                d='M12.17 4.75C10.92 6.34 10 8.08 10 9.93C10 11.42 10.63 12.79 11.7 13.77C11.72 12.75 12.03 11.79 12.58 10.93C13.13 10.08 13.91 9.43 14.82 9.04C15.97 10.22 16.68 11.82 16.68 13.58C16.68 16.81 14.67 19.25 12 19.25C9.33 19.25 7.32 16.84 7.32 13.58C7.32 10.18 9.33 7.01 12.17 4.75Z'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinecap='round'
                strokeLinejoin='round'
            />
        </svg>
    );
}

function UserIcon() {
    return (
        <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
            <path
                d='M12 12.25C13.93 12.25 15.5 10.68 15.5 8.75C15.5 6.82 13.93 5.25 12 5.25C10.07 5.25 8.5 6.82 8.5 8.75C8.5 10.68 10.07 12.25 12 12.25Z'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinecap='round'
                strokeLinejoin='round'
            />
            <path
                d='M5.75 18.75C5.75 15.99 8.55 13.75 12 13.75C15.45 13.75 18.25 15.99 18.25 18.75'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinecap='round'
                strokeLinejoin='round'
            />
        </svg>
    );
}

const adminTabs = [{ key: 'admin', label: 'Qu\u1ea3n tr\u1ecb', icon: UserIcon, path: '/admin' }];

export default function BottomNav() {
    const nav = useNavigate();
    const { pathname } = useLocation();
    const auth = parseAuthFromToken();
    const accountPath = getAccountLandingRoute(auth);

    const userTabs = [
        { key: 'home', label: 'Trang ch\u1ee7', icon: HomeIcon, path: '/home' },
        { key: 'map', label: 'B\u1ea3n \u0111\u1ed3', icon: MapIcon, path: '/map' },
        { key: 'explore', label: 'Kh\u00e1m ph\u00e1', icon: CompassIcon, path: '/explore', featured: true },
        { key: 'hot', label: 'N\u1ed5i b\u1eadt', icon: FlameIcon, path: '/hot' },
        { key: 'account', label: 'T\u00e0i kho\u1ea3n', icon: UserIcon, path: accountPath }
    ];

    const tabs = auth.isAdmin ? adminTabs : userTabs;
    const activeKey = tabs.find((tab) => {
        if (tab.key === 'account') {
            return pathname === '/account' || pathname === '/userprofile' || pathname === '/profile';
        }

        return pathname.startsWith(tab.path);
    })?.key;

    return (
        <div className='bottomNav'>
            <div className='bottomNavInner'>
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeKey === tab.key;

                    return (
                        <button
                            key={tab.key}
                            type='button'
                            className={`navItem ${tab.featured ? 'navItemFeatured' : ''} ${
                                isActive ? 'active' : ''
                            }`}
                            onClick={() => nav(tab.path)}
                            aria-label={tab.label}
                        >
                            <span className='navIconWrap'>
                                <span className='navIcon'>
                                    <Icon />
                                </span>
                            </span>
                            <span className='navLabel'>{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
