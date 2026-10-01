import { Client } from '@stomp/stompjs';
import axiosClient from '../../../api/axiosClient';
import { getStoredToken, normalizeGroupMessage } from './groupPage.utils';

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

export function connectGroupChatSocket({ groupId, onConnect, onError, onMessage }) {
    const token = getStoredToken();

    if (!groupId || !token) {
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

                    subscription = client.subscribe(`/topic/groups/${groupId}`, (frame) => {
                        try {
                            const payload = JSON.parse(frame.body);
                            onMessage?.(normalizeGroupMessage(payload));
                        } catch {
                            onError?.('Không đọc được dữ liệu realtime.');
                        }
                    });

                    onConnect?.();
                },
                onStompError: (frame) => {
                    onError?.(
                        frame?.headers?.message ||
                            frame?.body ||
                            'Không kết nối được realtime chat.'
                    );
                },
                onWebSocketError: () => {
                    onError?.('Không kết nối được websocket chat.');
                }
            });

            client.activate();
        })
        .catch(() => {
            onError?.('Không tải được thư viện websocket chat.');
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

