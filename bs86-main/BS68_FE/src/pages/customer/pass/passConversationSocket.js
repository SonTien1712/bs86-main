import { Client } from '@stomp/stompjs';
import axiosClient from '../../../api/axiosClient';
import { getStoredToken } from '../../../utils/auth';
import { normalizePassConversationMessage } from './passUi';

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

export function connectPassConversationSocket({
    conversationId,
    onConnect,
    onError,
    onMessage
}) {
    const token = getStoredToken();

    if (!conversationId || !token) {
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

                    subscription = client.subscribe(
                        `/topic/pass-conversations/${conversationId}`,
                        (frame) => {
                            try {
                                const payload = JSON.parse(frame.body);
                                onMessage?.(normalizePassConversationMessage(payload));
                            } catch {
                                onError?.('Unable to read realtime conversation data.');
                            }
                        }
                    );

                    onConnect?.();
                },
                onStompError: (frame) => {
                    onError?.(
                        frame?.headers?.message ||
                            frame?.body ||
                            'Unable to connect to pass conversation realtime.'
                    );
                },
                onWebSocketError: () => {
                    onError?.('Unable to connect to the pass conversation websocket.');
                }
            });

            client.activate();
        })
        .catch(() => {
            onError?.('Unable to load the websocket client for private conversation.');
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
