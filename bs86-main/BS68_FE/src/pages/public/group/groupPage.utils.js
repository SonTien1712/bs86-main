export function getStoredToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export function getCurrentUserEmail() {
    const token = getStoredToken();
    if (!token) return '';

    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        return payload?.sub || payload?.email || '';
    } catch {
        return '';
    }
}

export function getErrorMessage(error, fallback) {
    return error?.response?.data?.message || error?.message || fallback;
}

export function formatDateTime(value) {
    if (!value) return 'Đang cập nhật';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function getRoleLabel(role) {
    if (role === 'LEADER') return 'Leader';
    if (role === 'MEMBER') return 'Member';
    return role || 'Đang cập nhật';
}

export function getStatusLabel(status) {
    if (status === 'ACTIVE') return 'Active';
    if (status === 'DISBANDED') return 'Disbanded';
    return status || 'Đang cập nhật';
}

export function getMemberStatusLabel(status) {
    if (status === 'ACTIVE') return 'Active';
    if (status === 'REMOVED') return 'Removed';
    if (status === 'LEFT') return 'Left';
    return status || 'Đang cập nhật';
}

export function buildInvitePayload() {
    if (typeof window === 'undefined' || !window.location?.origin) {
        return {};
    }

    return {
        clientBaseUrl: window.location.origin
    };
}

export function normalizeGroup(group) {
    return {
        id: group?.id ?? '',
        name: group?.name || 'Nhóm đang cập nhật tên',
        description:
            group?.description || 'Mô tả nhóm sẽ được cập nhật trong phase tiếp theo.',
        leaderId: group?.leaderId ?? null,
        memberCount: group?.memberCount ?? 0,
        myRole: group?.myRole || 'MEMBER',
        status: group?.status || 'ACTIVE',
        createdAt: group?.createdAt || '',
        updatedAt: group?.updatedAt || ''
    };
}

export function normalizeInvite(invite) {
    return {
        code: invite?.code || '',
        groupId: invite?.groupId ?? '',
        groupName: invite?.groupName || 'Nhóm đang cập nhật tên',
        groupDescription:
            invite?.groupDescription ||
            'Mô tả nhóm sẽ được bổ sung sau khi backend mở rộng thêm.',
        memberCount: invite?.memberCount ?? 0,
        leaderEmail: invite?.leaderEmail || 'Đang cập nhật',
        inviteStatus: invite?.inviteStatus || 'UNKNOWN',
        expiredAt: invite?.expiredAt || '',
        alreadyMember: Boolean(invite?.alreadyMember)
    };
}

export function normalizeMember(member) {
    return {
        userId: member?.userId ?? '',
        userEmail: member?.userEmail || 'Đang cập nhật email',
        role: member?.role || 'MEMBER',
        status: member?.status || 'ACTIVE',
        joinedAt: member?.joinedAt || ''
    };
}

export function normalizeGroupMessage(message) {
    return {
        id: message?.id ?? '',
        groupId: message?.groupId ?? '',
        senderId: message?.senderId ?? '',
        senderEmail: message?.senderEmail || 'Đang cập nhật',
        content: message?.content || '',
        messageType: message?.messageType || 'TEXT',
        createdAt: message?.createdAt || ''
    };
}

export function mergeMessages(currentMessages, incomingMessages, prepend = false) {
    const byId = new Map();
    const seed = prepend
        ? [...incomingMessages, ...currentMessages]
        : [...currentMessages, ...incomingMessages];

    seed.forEach((message) => {
        if (!message?.id) return;
        if (!byId.has(message.id)) {
            byId.set(message.id, message);
        }
    });

    return Array.from(byId.values()).sort((left, right) => left.id - right.id);
}
