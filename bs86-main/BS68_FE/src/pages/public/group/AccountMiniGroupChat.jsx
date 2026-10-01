import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { groupApi } from '../../../api/groupApi';
import {
    formatDateTime,
    getCurrentUserEmail,
    getErrorMessage,
    mergeMessages,
    normalizeGroup,
    normalizeGroupMessage
} from './groupPage.utils';
import { connectGroupChatSocket } from './groupChatSocket';
import styles from './AccountMiniGroupChat.module.scss';

const PAGE_LIMIT = 20;

export default function AccountMiniGroupChat() {
    const currentUserEmail = useMemo(() => getCurrentUserEmail(), []);
    const listRef = useRef(null);
    const shouldStickToBottomRef = useRef(true);
    const pendingScrollRef = useRef('');
    const [open, setOpen] = useState(false);
    const [groups, setGroups] = useState([]);
    const [groupsLoading, setGroupsLoading] = useState(true);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [messages, setMessages] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [historyError, setHistoryError] = useState('');
    const [socketError, setSocketError] = useState('');
    const [socketConnected, setSocketConnected] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [nextBeforeMessageId, setNextBeforeMessageId] = useState(null);
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState('');
    const [input, setInput] = useState('');

    const selectedGroup = groups.find((group) => String(group.id) === String(selectedGroupId));

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
        let cancelled = false;

        async function loadGroups() {
            setGroupsLoading(true);

            try {
                const data = await groupApi.getMyGroups();
                if (cancelled) return;
                const items = Array.isArray(data) ? data.map(normalizeGroup) : [];
                setGroups(items);
                setSelectedGroupId((current) =>
                    current || (items[0] ? String(items[0].id) : '')
                );
            } catch {
                if (cancelled) return;
                setGroups([]);
                setSelectedGroupId('');
            } finally {
                if (!cancelled) {
                    setGroupsLoading(false);
                }
            }
        }

        loadGroups();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!pendingScrollRef.current) return;
        scrollToBottom();
        pendingScrollRef.current = '';
    }, [messages]);

    useEffect(() => {
        if (!open || !selectedGroup?.id) return;

        let cancelled = false;

        async function loadInitialMessages() {
            setLoadingHistory(true);
            setHistoryError('');
            setSocketError('');

            try {
                const data = await groupApi.getGroupMessages(selectedGroup.id, {
                    limit: PAGE_LIMIT
                });
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
                setHistoryError(getErrorMessage(requestError, 'Không tải được lịch sử chat.'));
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
    }, [open, selectedGroup?.id]);

    useEffect(() => {
        if (!open || !selectedGroup?.id) return;

        const disconnect = connectGroupChatSocket({
            groupId: selectedGroup.id,
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
    }, [open, selectedGroup?.id]);

    async function handleLoadMore() {
        if (!selectedGroup?.id || !hasMore || !nextBeforeMessageId) return;

        setLoadingMore(true);
        setHistoryError('');

        try {
            const data = await groupApi.getGroupMessages(selectedGroup.id, {
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

        setSending(true);
        setSendError('');

        try {
            const sent = await groupApi.sendGroupMessage(selectedGroup.id, {
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

    if (groupsLoading || groups.length === 0) {
        return null;
    }

    return (
        <>
            <button
                className={styles.launcher}
                onClick={() => setOpen((value) => !value)}
                type='button'
            >
                <span className={styles.launcherIcon}>Chat</span>
                <span className={styles.launcherLabel}>Chat nhóm</span>
                <span className={styles.launcherBadge}>{groups.length}</span>
            </button>

            {open ? (
                <section className={styles.widget}>
                    <div className={styles.header}>
                        <div>
                            <div className={styles.eyebrow}>Mini Chat</div>
                            <h2>Chat nhóm</h2>
                        </div>

                        <button
                            className={styles.closeButton}
                            onClick={() => setOpen(false)}
                            type='button'
                        >
                            x
                        </button>
                    </div>

                    <div className={styles.body}>
                        <aside className={styles.sidebar}>
                            <div className={styles.sidebarTitle}>Nhóm tham gia</div>

                            <div className={styles.groupList}>
                                {groups.map((group) => (
                                    <button
                                        key={group.id}
                                        className={`${styles.groupButton} ${
                                            String(group.id) === String(selectedGroupId)
                                                ? styles.groupButtonActive
                                                : ''
                                        }`}
                                        onClick={() => setSelectedGroupId(String(group.id))}
                                        type='button'
                                    >
                                        <strong>{group.name}</strong>
                                        <span>{group.memberCount} thành viên</span>
                                    </button>
                                ))}
                            </div>
                        </aside>

                        <div className={styles.chatPane}>
                            <div className={styles.chatTop}>
                                <div>
                                    <div className={styles.chatGroupName}>
                                        {selectedGroup?.name || 'Chọn nhóm'}
                                    </div>
                                    <div className={styles.chatGroupMeta}>
                                        {socketConnected
                                            ? 'Realtime đang kết nối'
                                            : 'Realtime đang kết nối lại'}
                                    </div>
                                </div>
                            </div>

                            {historyError ? <div className={styles.errorBanner}>{historyError}</div> : null}
                            {socketError ? <div className={styles.warningBanner}>{socketError}</div> : null}

                            {hasMore ? (
                                <div className={styles.loadMoreRow}>
                                    <button
                                        className={styles.loadMoreButton}
                                        disabled={loadingMore}
                                        onClick={handleLoadMore}
                                        type='button'
                                    >
                                        {loadingMore ? 'Đang tải...' : 'Tin nhắn cũ hơn'}
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
                                    <div className={styles.stateBox}>Đang tải lịch sử chat...</div>
                                ) : null}

                                {!loadingHistory && messages.length === 0 && !historyError ? (
                                    <div className={styles.stateBox}>
                                        Chưa có tin nhắn nào trong nhóm này.
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
                                                    isMine
                                                        ? styles.myMessage
                                                        : styles.otherMessage
                                                }`}
                                                key={message.id}
                                            >
                                                <div className={styles.messageMeta}>
                                                    <strong>
                                                       <Link to={`/userprofile/${message.senderId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                           {message.senderEmail}
                                                       </Link>
                                                    </strong>
                                                    <span>{formatDateTime(message.createdAt)}</span>
                                                </div>
                                                <div className={styles.messageBubble}>
                                                    {message.content}
                                                </div>
                                            </article>
                                        );
                                    })}
                            </div>

                            <form className={styles.composer} onSubmit={handleSendMessage}>
                                <textarea
                                    rows={2}
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
                                    placeholder='Nhập tin nhắn...'
                                />
                                {sendError ? <div className={styles.errorText}>{sendError}</div> : null}

                                <div className={styles.composerFooter}>
                                    <span className={styles.helperText}>
                                        Đang chat trong {selectedGroup?.name}
                                    </span>
                                    <button
                                        className={styles.sendButton}
                                        disabled={sending}
                                        type='submit'
                                    >
                                        {sending ? 'Đang gửi...' : 'Gửi'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>
            ) : null}
        </>
    );
}

