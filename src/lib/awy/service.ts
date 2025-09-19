// src/lib/awy/service.ts
import type {
  AWYConnection,
  AWYInteraction,
  AWYNotification,
  AWYPresence,
} from '@/types/billing';

export type PresenceStatus = 'online' | 'offline' | 'busy';
export type PresenceMap = Record<string, PresenceStatus>;
export type Conn = {
  id: string;
  email: string;
  relationship: string | null;
  display_name: string | null;
  status: string | null;
};

type FetchJsonOptions<T> = {
  url: string;
  label: string;
  init?: RequestInit;
  fallback: T;
};

const API_BASE = '/api/awy';

async function fetchJson<T>({ url, label, init, fallback }: FetchJsonOptions<T>): Promise<T> {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      ...init,
    });

    if (!response.ok) {
      throw new Error(`${label} failed with status ${response.status}`);
    }

    const data = (await response.json()) as T;
    return data ?? fallback;
  } catch (error) {
    console.warn(`[awy/service] ${label}:`, (error as Error)?.message || error);
    return fallback;
  }
}

function normalizeConnection(raw: any): Conn {
  const email = typeof raw?.email === 'string' ? raw.email.toLowerCase() : '';
  const relationship = raw?.relationship ?? raw?.relationship_label ?? null;
  const displayName = raw?.display_name ?? raw?.name ?? null;
  const status = typeof raw?.status === 'string' ? raw.status : null;

  return {
    id: String(raw?.id ?? `conn_${Math.random().toString(36).slice(2, 10)}`),
    email,
    relationship,
    display_name: displayName,
    status,
  };
}

function toAWYConnection(conn: Conn): AWYConnection {
  const now = new Date().toISOString();
  const baseRelationship = conn.relationship ?? 'Loved one';
  const status: AWYConnection['status'] =
    conn.status === 'active' || conn.status === 'blocked' || conn.status === 'declined'
      ? conn.status
      : 'pending';

  return {
    id: conn.id,
    user_id: '',
    connected_user_id: undefined,
    connection_email: conn.email,
    relationship_label: baseRelationship,
    display_name: conn.display_name ?? undefined,
    status,
    permissions: {
      can_see_online_status: true,
      can_initiate_calls: true,
      can_see_calendar: false,
      can_receive_updates: true,
    },
    invitation_token: undefined,
    invitation_expires_at: undefined,
    connected_at: undefined,
    created_at: now,
    updated_at: now,
  };
}

function toAWYPresenceRecord(map: PresenceMap): Record<string, AWYPresence> {
  const now = new Date().toISOString();
  const entries: [string, AWYPresence][] = Object.entries(map).map(([id, status]) => [
    id,
    {
      user_id: id,
      is_online: status === 'online',
      last_seen: now,
      current_activity: undefined,
      mood: undefined,
      location_context: undefined,
      study_session_active: false,
      do_not_disturb: status === 'busy',
      custom_status: undefined,
      metadata: {},
      updated_at: now,
    },
  ]);

  return Object.fromEntries(entries);
}

export async function getConnections(userId?: string): Promise<Conn[]> {
  const data = await fetchJson<{ connections?: any[] }>({
    url: `${API_BASE}/connections`,
    label: 'fetch connections',
    fallback: { connections: [] },
  });

  return (data.connections ?? []).map(normalizeConnection);
}

export async function getPresenceMap(userId?: string): Promise<PresenceMap> {
  const data = await fetchJson<{ lovedOnes?: Array<{ email?: string; status?: string }> } | null>({
    url: `${API_BASE}/presence`,
    label: 'fetch presence',
    fallback: { lovedOnes: [] },
  });

  const map: PresenceMap = {};
  (data?.lovedOnes ?? []).forEach((entry) => {
    if (entry?.email) {
      const status = entry.status === 'busy' ? 'busy' : entry.status === 'online' ? 'online' : 'offline';
      map[entry.email] = status as PresenceStatus;
    }
  });
  return map;
}

export async function getRecentInteractions(userId: string, limit = 20): Promise<AWYInteraction[]> {
  const search = new URLSearchParams();
  if (limit) search.set('limit', String(limit));

  const data = await fetchJson<{ interactions?: AWYInteraction[] }>({
    url: `${API_BASE}/interactions?${search.toString()}`,
    label: 'fetch interactions',
    fallback: { interactions: [] },
  });

  return data.interactions ?? [];
}

export async function getUserNotifications(userId: string, limitOrUnread?: number | boolean, unreadOnly = false): Promise<AWYNotification[]> {
  const search = new URLSearchParams();
  const limit = typeof limitOrUnread === 'number' ? limitOrUnread : undefined;
  const onlyUnread = typeof limitOrUnread === 'boolean' ? limitOrUnread : unreadOnly;
  if (limit) search.set('limit', String(limit));
  if (onlyUnread) search.set('unread_only', 'true');

  const data = await fetchJson<{ notifications?: AWYNotification[] }>({
    url: `${API_BASE}/notifications?${search.toString()}`,
    label: 'fetch notifications',
    fallback: { notifications: [] },
  });

  return data.notifications ?? [];
}

export async function updatePresence(status: PresenceStatus): Promise<{ ok: true }> {
  console.info('[awy/service] updatePresence called with status:', status);
  return { ok: true };
}

export function subscribeToPresenceUpdates(cb: (map: PresenceMap) => void): { unsubscribe(): void } {
  let cancelled = false;
  Promise.resolve().then(() => {
    if (!cancelled) cb({});
  });

  return {
    unsubscribe() {
      cancelled = true;
    },
  };
}

export async function sendInvite(email: string): Promise<{ ok: true }> {
  await fetchJson({
    url: `${API_BASE}/invite`,
    label: 'send invite',
    init: {
      method: 'POST',
      body: JSON.stringify({ email, relationship: 'Loved one', displayName: null }),
    },
    fallback: { ok: true },
  });
  return { ok: true };
}

export async function startCall(email: string): Promise<{ ok: true; callId: string; roomUrl: string }> {
  const data = await fetchJson<{ ok?: boolean; callId?: string; roomUrl?: string }>({
    url: `${API_BASE}/calls`,
    label: 'start call',
    init: {
      method: 'POST',
      body: JSON.stringify({ email }),
    },
    fallback: {},
  });

  const callId = data.callId ?? `call_${Date.now()}`;
  const roomUrl = data.roomUrl ?? `/call/${callId}`;

  return { ok: true, callId, roomUrl };
}

async function getUserConnections(userId?: string): Promise<AWYConnection[]> {
  const conns = await getConnections(userId);
  return conns.map(toAWYConnection);
}

async function getPresenceForConnections(userId?: string): Promise<Record<string, AWYPresence>> {
  const map = await getPresenceMap(userId);
  return toAWYPresenceRecord(map);
}

function subscribeToPresenceUpdatesLegacy(userId: string, cb: (presence: AWYPresence) => void) {
  const controller = subscribeToPresenceUpdates((map) => {
    const record = toAWYPresenceRecord(map);
    Object.values(record).forEach((presence) => cb(presence));
  });
  return controller;
}

function subscribeToInteractions(userId: string, cb: (interaction: AWYInteraction) => void) {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastSeen: string | null = null;

  const poll = async () => {
    if (cancelled) return;
    const [latest] = await getRecentInteractions(userId, 1);
    if (!cancelled && latest && latest.id !== lastSeen) {
      lastSeen = latest.id;
      cb(latest);
    }
    if (!cancelled) {
      timer = setTimeout(poll, 30000);
    }
  };

  timer = setTimeout(poll, 30000);

  return {
    unsubscribe() {
      cancelled = true;
      if (timer) clearTimeout(timer);
    },
  };
}

async function createConnection(
  userId: string,
  email: string,
  relationship: string,
  displayName?: string,
): Promise<string> {
  const payload = await fetchJson<{ connectionId?: string }>({
    url: `${API_BASE}/invite`,
    label: 'create connection',
    init: {
      method: 'POST',
      body: JSON.stringify({ email, relationship, displayName }),
    },
    fallback: {},
  });

  return payload.connectionId ?? '';
}

async function deleteConnection(connectionId: string): Promise<void> {
  await fetchJson({
    url: `${API_BASE}/connections`,
    label: 'delete connection',
    init: {
      method: 'DELETE',
      body: JSON.stringify({ id: connectionId }),
    },
    fallback: {},
  });
}

async function updateConnectionPermissions(connectionId: string, permissions: AWYConnection['permissions']): Promise<{ ok: true }> {
  console.info('[awy/service] updateConnectionPermissions called for', connectionId, permissions);
  return { ok: true };
}

async function updatePresenceLegacy(userId: string, presenceData: Partial<AWYPresence>): Promise<{ ok: true }> {
  if (presenceData?.custom_status) {
    console.info('[awy/service] Presence custom status:', presenceData.custom_status);
  }
  return { ok: true };
}

async function sendInteraction(
  userId: string,
  connectionId: string,
  interactionType: AWYInteraction['interaction_type'],
  message?: string,
): Promise<string> {
  const response = await fetchJson<{ interactionId?: string }>({
    url: `${API_BASE}/interactions`,
    label: 'send interaction',
    init: {
      method: 'POST',
      body: JSON.stringify({
        connectionId,
        interactionType,
        message,
      }),
    },
    fallback: {},
  });

  return response.interactionId ?? '';
}

async function markInteractionAsRead(interactionId: string): Promise<{ ok: true }> {
  await fetchJson({
    url: `${API_BASE}/interactions`,
    label: 'mark interaction as read',
    init: {
      method: 'PUT',
      body: JSON.stringify({ interactionId }),
    },
    fallback: {},
  });
  return { ok: true };
}

async function markNotificationAsRead(notificationId: string): Promise<{ ok: true }> {
  await fetchJson({
    url: `${API_BASE}/notifications`,
    label: 'mark notification as read',
    init: {
      method: 'PUT',
      body: JSON.stringify({ notificationId }),
    },
    fallback: {},
  });
  return { ok: true };
}

async function markAllNotificationsAsRead(userId: string): Promise<{ ok: true }> {
  await fetchJson({
    url: `${API_BASE}/notifications`,
    label: 'mark all notifications as read',
    init: {
      method: 'PUT',
      body: JSON.stringify({ markAllAsRead: true }),
    },
    fallback: {},
  });
  return { ok: true };
}

async function initiateCall(
  connectionId: string,
  initiatorUserId: string,
  recipientUserId: string,
  sessionType: 'video' | 'voice' | 'screen_share' = 'video',
): Promise<string> {
  console.info('[awy/service] initiateCall requested', {
    connectionId,
    initiatorUserId,
    recipientUserId,
    sessionType,
  });

  const response = await startCall('');
  return response.roomUrl;
}

export const awyService = {
  getConnections,
  getRecentInteractions,
  getUserNotifications,
  getPresenceMap,
  updatePresence: updatePresenceLegacy,
  subscribeToPresenceUpdates: subscribeToPresenceUpdatesLegacy,
  sendInvite,
  startCall,
  getUserConnections,
  getPresenceForConnections,
  subscribeToInteractions,
  createConnection,
  deleteConnection,
  updateConnectionPermissions,
  sendInteraction,
  markInteractionAsRead,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  initiateCall,
};
