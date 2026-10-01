import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext'; // 👈 thêm dòng này

import 'normalize.css';
import '../node_modules/tw-animate-css/dist/tw-animate.css';
import './index.css';
import '@styles/main.scss';

try {
    const pendingPath = window.sessionStorage.getItem('spa-redirect-path');

    if (pendingPath && window.location.pathname === '/') {
        window.sessionStorage.removeItem('spa-redirect-path');
        window.history.replaceState(null, '', pendingPath);
    }
} catch (error) {}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            {' '}
            {/* 👈 bọc ở đây */}
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </AuthProvider>
    </React.StrictMode>
);
