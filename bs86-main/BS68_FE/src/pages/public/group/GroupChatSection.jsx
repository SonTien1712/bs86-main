import { useEffect, useMemo, useRef, useState } from 'react';
import { groupApi } from '../../../api/groupApi';
import {
    formatDateTime,
    getCurrentUserEmail,
    getErrorMessage,
    mergeMessages,
    normalizeGroupMessage
} from './groupPage.utils';
import { connectGroupChatSocket } from './groupChatSocket';
import styles from './GroupChatSection.module.scss';

const PAGE_LIMIT = 20;

export default function GroupChatSection({ group }) {
    const currentUserEmail = useMemo(() => getCurrentUserEmail(), []);
    const listRef = useRef(null);
    const shouldStickToBottomRef = useRef(true);
    const pendingScrollRef = useRef('');
    const [messages, setMessages] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [historyError, setHistoryError] = useState('');
    const [socketError, setSocketError] = useState('');
    const [sendError, setSendError] = useState('');
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [nextBeforeMessageId, setNextBeforeMessageId] = useState(null);
    const [socketConnected, setSocketConnected] = useState(false);

    function scrollToBottom() {
        const element = listRef.current;
        if (!element) return;
        element.scrollTop = element.scrollHeight;
    }

    function isNearBottom() {
        const element = listRef.current;
        if (!element) return true;
        return element.scrollHeight - element.scrollTop - element.clientHeight < 80;
    }

    useEffect(() => {
        shouldStickToBottomRef.current = true;
    }, [group?.id]);

    useEffect(() => {
        if (!pendingScrollRef.current) return;
        scrollToBottom();
        pendingScrollRef.current = '';
    }, [messages]);

    useEffect(() => {
        if (!group?.id) return;

        let cancelled = false;

        async function loadInitialMessages() {
            setLoadingHistory(true);
            setHistoryError('');
            setSocketError('');

            try {
                const data = await groupApi.getGroupMessages(group.id, { limit: PAGE_LIMIT });
                if (cancelled) return;
                const items = Array.isArray(data?.items)
                    ? data.items.map(normalizeGroupMessage)
                    : [];
                setMessages(mergeMessages([], items));
                setHasMore(Boolean(data?.hasMore));
                setNextBeforeMessageId(data?.nextBeforeMessageId ?? null);
                pendingScrollRef.current = 'initial';
            } catch (requestError) {
                if (cancelled) return;
                setMessages([]);
                setHistoryError(
                    getErrorMessage(requestError, 'Không tải được lịch sử chat nhóm.')
                );
            } finally {
                if (!cancelled) {
                    setLoadingHistory(false);
                }
            }
        }

        loadInitialMessages();

        return () => {
            cancelled = true;
        };
    }, [group?.id]);

    useEffect(() => {
        if (!group?.id) return;

        const disconnect = connectGroupChatSocket({
            groupId: group.id,
            onConnect: () => {
                setSocketConnected(true);
                setSocketError('');
            },
            onError: (message) => {
                setSocketConnected(false);
                setSocketError(message);
            },
            onMessage: (incomingMessage) => {
                setMessages((current) => mergeMessages(current, [incomingMessage]));
                if (shouldStickToBottomRef.current) {
                    pendingScrollRef.current = 'append';
                }
            }
        });

        return () => {
            setSocketConnected(false);
            disconnect?.();
        };
    }, [group?.id]);

    async function handleLoadMore() {
        if (!group?.id || !hasMore || !nextBeforeMessageId) return;

        setLoadingMore(true);
        setHistoryError('');

        try {
            const data = await groupApi.getGroupMessages(group.id, {
                beforeMessageId: nextBeforeMessageId,
                limit: PAGE_LIMIT
            });
            const items = Array.isArray(data?.items)
                ? data.items.map(normalizeGroupMessage)
                : [];
            setMessages((current) => mergeMessages(current, items, true));
            setHasMore(Boolean(data?.hasMore));
            setNextBeforeMessageId(data?.nextBeforeMessageId ?? null);
        } catch (requestError) {
            setHistoryError(getErrorMessage(requestError, 'Không tải thêm được tin nhắn cũ.'));
        } finally {
            setLoadingMore(false);
        }
    }

    async function handleSendMessage(event) {
        event.preventDefault();

        const trimmed = input.trim();

        if (!trimmed) {
            setSendError('Nội dung tin nhắn không được để trống.');
            return;
        }

        if (trimmed.length > 2000) {
            setSendError('Nội dung tối đa 2000 ký tự.');
            return;
        }

        setSending(true);
        setSendError('');

        try {
            const sent = await groupApi.sendGroupMessage(group.id, {
                content: trimmed
            });
            setMessages((current) => mergeMessages(current, [normalizeGroupMessage(sent)]));
            setInput('');
            pendingScrollRef.current = 'append';
        } catch (requestError) {
            setSendError(getErrorMessage(requestError, 'Không gửi được tin nhắn.'));
        } finally {
            setSending(false);
        }
    }

    return (
        <section className={styles.chatShell}>
            <div className={styles.chatHeader}>
                <div>
                    <div className={styles.eyebrow}>Chat</div>
                    <h2>Chat nhóm</h2>
                    <p>
                        Lịch sử chat đang load bằng REST, còn tin nhắn mới được đẩy qua
                        websocket STOMP theo group hiện tại.
                    </p>
                </div>

                <div
                    className={`${styles.connectionBadge} ${
                        socketConnected ? styles.connectionOn : styles.connectionOff
                    }`}
                >
                    {socketConnected ? 'Realtime đang kết nối' : 'Realtime đang kết nối lại'}
                </div>
            </div>

            {historyError ? <div className={styles.errorBanner}>{historyError}</div> : null}
            {socketError ? <div className={styles.warningBanner}>{socketError}</div> : null}

            <div className={styles.chatCard}>
                {hasMore ? (
                    <div className={styles.loadMoreRow}>
                        <button
                            className={styles.loadMoreButton}
                            disabled={loadingMore}
                            onClick={handleLoadMore}
                            type='button'
                        >
                            {loadingMore ? 'Đang tải...' : 'Tải thêm tin nhắn cũ'}
                        </button>
                    </div>
                ) : null}

                <div
                    className={styles.messageList}
                    onScroll={() => {
                        shouldStickToBottomRef.current = isNearBottom();
                    }}
                    ref={listRef}
                >
                    {loadingHistory ? (
                        <div className={styles.loadingState}>Đang tải lịch sử chat...</div>
                    ) : null}

                    {!loadingHistory && messages.length === 0 && !historyError ? (
                        <div className={styles.emptyState}>
                            Chưa có tin nhắn nào. Hãy gửi tin nhắn đầu tiên cho nhóm.
                        </div>
                    ) : null}

                    {!loadingHistory &&
                        messages.map((message) => {
                            const isMine =
                                currentUserEmail &&
                                message.senderEmail.toLowerCase() ===
                                    currentUserEmail.toLowerCase();

                            return (
                                <article
                                    className={`${styles.messageItem} ${
                                        isMine ? styles.myMessage : styles.otherMessage
                                    }`}
                                    key={message.id}
                                >
                                    <div className={styles.messageMeta}>
                                        <strong>{message.senderEmail}</strong>
                                        <span>{formatDateTime(message.createdAt)}</span>
                                    </div>
                                    <div className={styles.messageBubble}>{message.content}</div>
                                </article>
                            );
                        })}
                </div>

                <form className={styles.chatComposer} onSubmit={handleSendMessage}>
                    <textarea
                        rows={3}
                        value={input}
                        onChange={(event) => {
                            setInput(event.target.value);
                            if (sendError) {
                                setSendError('');
                            }
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault();
                                event.currentTarget.form?.requestSubmit();
                            }
                        }}
                        placeholder='Nhập tin nhắn cho nhóm...'
                    />

                    {sendError ? <div className={styles.errorText}>{sendError}</div> : null}

                    <div className={styles.chatComposerFooter}>
                        <span className={styles.helperText}>
                            {group?.status === 'ACTIVE'
                                ? 'Tin nhắn mới sẽ tự động cập nhật khi đang mở trang.'
                                : 'Nhóm không ở trạng thái active, backend có thể từ chối gửi tin nhắn.'}
                        </span>
                        <button
                            className={styles.sendButton}
                            disabled={sending}
                            type='submit'
                        >
                            {sending ? 'Đang gửi...' : 'Gửi tin nhắn'}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}

