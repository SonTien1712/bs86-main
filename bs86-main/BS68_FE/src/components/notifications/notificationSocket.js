import { Client } from '@stomp/stompjs';
import axiosClient from '../../api/axiosClient';
import { getStoredToken } from '../../utils/auth';

let sockJsLoader = null;

function getSockJsUrl() {
    const baseUrl = axiosClient.defaults.baseURL || window.location.origin;
    return `${String(baseUrl).replace(/\/$/, '')}/ws`;
}

function loadSockJsClient() {
    if (!sockJsLoader) {
        if (typeof globalThis !== 'undefined' && !globalThis.global) {
            globalThis.global = globalThis;
        }

        sockJsLoader = import('sockjs-client/dist/sockjs').then(
            (module) => module.default || module
        );
    }

    return sockJsLoader;
}

export function connectNotificationSocket({ onConnect, onError, onNotification }) {
    const token = getStoredToken();

    if (!token) {
        return () => {};
    }

    let disposed = false;
    let subscription = null;
    let client = null;

    loadSockJsClient()
        .then((SockJS) => {
            if (disposed) return;

            client = new Client({
                webSocketFactory: () => new SockJS(getSockJsUrl()),
                connectHeaders: {
                    Authorization: `Bearer ${token}`
                },
                reconnectDelay: 5000,
                debug: () => {},
                onConnect: () => {
                    if (disposed) return;

                    subscription = client.subscribe('/user/queue/notifications', (frame) => {
                        try {
                            const payload = JSON.parse(frame.body);
                            onNotification?.(payload);
                        } catch {
                            onError?.('Không đọc được dữ liệu thông báo realtime.');
                        }
                    });

                    onConnect?.();
                },
                onStompError: (frame) => {
                    onError?.(
                        frame?.headers?.message ||
                            frame?.body ||
                            'Không kết nối được realtime notification.'
                    );
                },
                onWebSocketError: () => {
                    onError?.('Không kết nối được websocket notification.');
                }
            });

            client.activate();
        })
        .catch(() => {
            onError?.('Không tải được thư viện websocket notification.');
        });

    return () => {
        disposed = true;

        if (subscription) {
            subscription.unsubscribe();
            subscription = null;
        }

        if (client?.active) {
            client.deactivate();
        }
    };
}

