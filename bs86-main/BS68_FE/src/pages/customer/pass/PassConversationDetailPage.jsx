import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTicketDetail } from '../../../api/bookingApi';
import {
    closePassConversation,
    getPassConversation,
    sendPassConversationMessage,
    transferPassConversationTicket
} from '../../../api/passApi';
import { getCurrentUserId, parseAuthFromToken } from '../../../utils/auth';
import {
    formatPassDate,
    formatPassDateTime,
    formatPassTime,
    getApiErrorMessage,
    getPassConversationStatusLabel,
    mergePassConversationMessages,
    normalizePassConversationMessage
} from './passUi';
import { connectPassConversationSocket } from './passConversationSocket';
import styles from './PassConversationDetailPage.module.css';

export default function PassConversationDetailPage() {
    const { id } = useParams();
    const auth = parseAuthFromToken();
    const currentUserId = getCurrentUserId(auth);
    const listRef = useRef(null);
    const shouldStickToBottomRef = useRef(true);
    const pendingScrollRef = useRef('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [conversation, setConversation] = useState(null);
    const [ticketDetail, setTicketDetail] = useState(null);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [closing, setClosing] = useState(false);
    const [showTransferDialog, setShowTransferDialog] = useState(false);
    const [transfering, setTransfering] = useState(false);
    const [transferError, setTransferError] = useState('');
    const [transferSuccess, setTransferSuccess] = useState('');
    const [socketConnected, setSocketConnected] = useState(false);
    const [socketError, setSocketError] = useState('');

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
        if (!pendingScrollRef.current) return;
        scrollToBottom();
        pendingScrollRef.current = '';
    }, [conversation?.messages]);

    const loadConversation = async (conversationId = id) => {
        if (!conversationId) {
            setConversation(null);
            setTicketDetail(null);
            setLoading(false);
            setError('Conversation ID is missing.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await getPassConversation(conversationId);
            setConversation(
                result
                    ? {
                          ...result,
                          messages: mergePassConversationMessages([], result.messages || [])
                      }
                    : null
            );
            if (result?.ticketId) {
                try {
                    const detail = await getTicketDetail(result.ticketId);
                    setTicketDetail(detail);
                } catch {
                    setTicketDetail(null);
                }
            } else {
                setTicketDetail(null);
            }
        } catch (loadError) {
            setConversation(null);
            setTicketDetail(null);
            setError(getApiErrorMessage(loadError, 'Unable to load this conversation.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadConversation();
    }, [id]);

    useEffect(() => {
        shouldStickToBottomRef.current = true;
    }, [id]);

    useEffect(() => {
        if (!id) {
            return undefined;
        }

        const disconnect = connectPassConversationSocket({
            conversationId: id,
            onConnect: () => {
                setSocketConnected(true);
                setSocketError('');
            },
            onError: (message) => {
                setSocketConnected(false);
                setSocketError(message);
            },
            onMessage: (incomingMessage) => {
                setConversation((currentValue) => {
                    if (!currentValue) {
                        return currentValue;
                    }

                    const mergedMessages = mergePassConversationMessages(
                        currentValue.messages || [],
                        [incomingMessage]
                    );

                    return {
                        ...currentValue,
                        messages: mergedMessages,
                        lastMessagePreview: incomingMessage.content || currentValue.lastMessagePreview,
                        lastMessageAt: incomingMessage.createdAt || currentValue.lastMessageAt,
                        updatedAt: incomingMessage.createdAt || currentValue.updatedAt
                    };
                });

                if (shouldStickToBottomRef.current) {
                    pendingScrollRef.current = 'append';
                }
            }
        });

        return () => {
            setSocketConnected(false);
            disconnect?.();
        };
    }, [id]);

    const counterpartName = useMemo(() => {
        if (!conversation) return 'Unknown user';

        return Number(conversation.ownerUserId) === Number(currentUserId)
            ? conversation.interestedUserFullName || 'Unknown user'
            : conversation.ownerFullName || 'Unknown user';
    }, [conversation, currentUserId]);

    const isOwner = Number(conversation?.ownerUserId) === Number(currentUserId);
    const isOpen = String(conversation?.status || '').trim().toUpperCase() === 'OPEN';
    const canTransfer = isOwner && isOpen;

    const handleSend = async (event) => {
        event.preventDefault();
        const trimmedMessage = message.trim();

        if (!trimmedMessage || !conversation?.id) {
            return;
        }

        setSending(true);
        setTransferError('');

        try {
            const sentMessage = await sendPassConversationMessage(conversation.id, {
                content: trimmedMessage
            });

            setConversation((currentValue) =>
                currentValue
                    ? {
                          ...currentValue,
                          messages: mergePassConversationMessages(
                              currentValue.messages || [],
                              [normalizePassConversationMessage(sentMessage)]
                          ),
                          lastMessagePreview: trimmedMessage,
                          lastMessageAt:
                              sentMessage?.createdAt ||
                              sentMessage?.updatedAt ||
                              currentValue.lastMessageAt,
                          updatedAt:
                              sentMessage?.createdAt ||
                              sentMessage?.updatedAt ||
                              currentValue.updatedAt
                      }
                    : currentValue
            );
            setMessage('');
            pendingScrollRef.current = 'append';
        } catch (sendError) {
            setTransferError(getApiErrorMessage(sendError, 'Unable to send this message.'));
        } finally {
            setSending(false);
        }
    };

    const handleCloseConversation = async () => {
        if (!conversation?.id) {
            return;
        }

        setClosing(true);
        setTransferError('');

        try {
            const updated = await closePassConversation(conversation.id);
            setConversation(updated);
        } catch (closeError) {
            setTransferError(getApiErrorMessage(closeError, 'Unable to close this conversation.'));
        } finally {
            setClosing(false);
        }
    };

    const handleTransfer = async () => {
        if (!conversation?.id) {
            return;
        }

        setTransfering(true);
        setTransferError('');
        setTransferSuccess('');

        try {
            const ticketDetail = await transferPassConversationTicket(conversation.id);
            setTicketDetail(ticketDetail || null);
            setShowTransferDialog(false);
            setTransferSuccess(
                `Ticket transferred successfully. New ticket holder now owns ${ticketDetail?.ticketCode || 'this ticket'}.`
            );
            setMessage('');
            await loadConversation(conversation.id);
        } catch (transferActionError) {
            setTransferError(
                getApiErrorMessage(transferActionError, 'Unable to transfer this ticket.')
            );
        } finally {
            setTransfering(false);
        }
    };

    return (
        <div className={styles.shell}>
            <div className={styles.container}>
                <section className={styles.hero}>
                    <div>
                        <div className={styles.kicker}>Private Conversation</div>
                        <h1 className={styles.title}>{counterpartName}</h1>
                        <p className={styles.subtitle}>
                            {conversation?.fieldName || 'Unknown field'} |{' '}
                            {conversation?.courtName || 'Court not assigned'} |{' '}
                            {getPassConversationStatusLabel(conversation?.status)}
                        </p>
                        {ticketDetail ? (
                            <p className={styles.subtitleSecondary}>
                                {formatPassDate(ticketDetail.slotDate)} |{' '}
                                {formatPassTime(ticketDetail.startTime)} -{' '}
                                {formatPassTime(ticketDetail.endTime)}
                            </p>
                        ) : null}
                    </div>

                    <div className={styles.heroActions}>
                        <Link className={styles.secondaryBtn} to='/pass-conversations'>
                            Back to Conversations
                        </Link>
                        <Link className={styles.secondaryBtn} to='/explore?category=PASSSAN'>
                            PASSSAN
                        </Link>
                    </div>
                </section>

                {loading ? <div className={styles.feedback}>Loading conversation...</div> : null}
                {!loading && error ? <div className={styles.feedbackError}>{error}</div> : null}

                {!loading && !error && conversation ? (
                    <>
                        <section className={styles.contextCard}>
                            <div className={styles.contextGrid}>
                                <div className={styles.contextBlock}>
                                    <span>Status</span>
                                    <strong>{getPassConversationStatusLabel(conversation.status)}</strong>
                                </div>
                                <div className={styles.contextBlock}>
                                    <span>Owner</span>
                                    <strong>{conversation.ownerFullName || '--'}</strong>
                                </div>
                                <div className={styles.contextBlock}>
                                    <span>Interested User</span>
                                    <strong>{conversation.interestedUserFullName || '--'}</strong>
                                </div>
                                <div className={styles.contextBlock}>
                                    <span>Updated</span>
                                    <strong>{formatPassDateTime(conversation.updatedAt)}</strong>
                                </div>
                            </div>

                            <div className={styles.postCopy}>
                                <span>Pass Post Context</span>
                                <p>{conversation.postContent || 'No post content provided.'}</p>
                            </div>

                            <div className={styles.actionRow}>
                                {isOpen ? (
                                    <button
                                        className={styles.secondaryBtn}
                                        disabled={closing}
                                        onClick={handleCloseConversation}
                                        type='button'
                                    >
                                        {closing ? 'Closing...' : 'Close Conversation'}
                                    </button>
                                ) : null}

                                {canTransfer ? (
                                    <button
                                        className={styles.primaryBtn}
                                        onClick={() => setShowTransferDialog(true)}
                                        type='button'
                                    >
                                        Transfer Ticket
                                    </button>
                                ) : null}

                                {!canTransfer && isOwner ? (
                                    <div className={styles.inlineHint}>
                                        Transfer becomes unavailable after the conversation is closed or completed.
                                    </div>
                                ) : null}
                            </div>
                        </section>

                        {transferSuccess ? (
                            <div className={styles.successBanner}>{transferSuccess}</div>
                        ) : null}
                        {transferError ? <div className={styles.feedbackError}>{transferError}</div> : null}

                        <section className={styles.chatCard}>
                            <div className={styles.chatHeader}>
                                <div>
                                    <div className={styles.chatTitle}>Messages</div>
                                    <div className={styles.chatSubtitle}>
                                        Private one-to-one history for this ticket pass.
                                    </div>
                                </div>
                                <div
                                    className={`${styles.connectionBadge} ${
                                        socketConnected ? styles.connectionOn : styles.connectionOff
                                    }`}
                                >
                                    {socketConnected
                                        ? 'Realtime connected'
                                        : 'Realtime reconnecting'}
                                </div>
                            </div>

                            {socketError ? <div className={styles.socketWarning}>{socketError}</div> : null}

                            {conversation.messages?.length ? (
                                <div
                                    className={styles.messageList}
                                    onScroll={() => {
                                        shouldStickToBottomRef.current = isNearBottom();
                                    }}
                                    ref={listRef}
                                >
                                    {conversation.messages.map((item) => {
                                        const isMine =
                                            Number(item.senderUserId) === Number(currentUserId);

                                        return (
                                            <div
                                                className={`${styles.messageRow} ${
                                                    isMine ? styles.messageRowMine : ''
                                                }`}
                                                key={item.id}
                                            >
                                                <div
                                                    className={`${styles.messageBubble} ${
                                                        isMine ? styles.messageBubbleMine : ''
                                                    }`}
                                                >
                                                    <div className={styles.messageSender}>
                                                        {item.senderFullName || 'Unknown user'}
                                                    </div>
                                                    <div className={styles.messageContent}>
                                                        {item.content}
                                                    </div>
                                                    <div className={styles.messageTime}>
                                                        {formatPassDateTime(item.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <strong>No messages yet.</strong>
                                    <span>Send the first message to start this conversation.</span>
                                </div>
                            )}

                            <form className={styles.composeForm} onSubmit={handleSend}>
                                <textarea
                                    className={styles.composeInput}
                                    disabled={!isOpen || sending}
                                    maxLength={2000}
                                    onChange={(event) => setMessage(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' && !event.shiftKey) {
                                            event.preventDefault();
                                            event.currentTarget.form?.requestSubmit();
                                        }
                                    }}
                                    placeholder={
                                        isOpen
                                            ? 'Type a private message...'
                                            : 'This conversation is no longer open.'
                                    }
                                    rows={4}
                                    value={message}
                                />
                                <div className={styles.composeActions}>
                                    {!isOpen ? (
                                        <span className={styles.inlineHint}>
                                            Messages are disabled because this conversation is not open.
                                        </span>
                                    ) : socketConnected ? (
                                        <span className={styles.inlineHint}>
                                            New messages will appear automatically while this page stays open.
                                        </span>
                                    ) : null}
                                    <button
                                        className={styles.primaryBtn}
                                        disabled={!isOpen || sending || !message.trim()}
                                        type='submit'
                                    >
                                        {sending ? 'Sending...' : 'Send Message'}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </>
                ) : null}
            </div>

            {showTransferDialog ? (
                <div className={styles.dialogOverlay} role='dialog' aria-modal='true'>
                    <div className={styles.dialog}>
                        <div className={styles.dialogTitle}>Confirm Ticket Transfer</div>
                        <p className={styles.dialogCopy}>
                            This ticket will be transferred to {counterpartName}. The old QR will no
                            longer be valid, and the current owner will stop seeing this ticket in My
                            Tickets after the next refresh.
                        </p>
                        <div className={styles.dialogActions}>
                            <button
                                className={styles.secondaryBtn}
                                disabled={transfering}
                                onClick={() => setShowTransferDialog(false)}
                                type='button'
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.primaryBtn}
                                disabled={transfering}
                                onClick={handleTransfer}
                                type='button'
                            >
                                {transfering ? 'Transferring...' : 'Confirm Transfer'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
