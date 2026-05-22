// Invitation notifications (forum + planner) stored in localStorage.
// Single-browser demo: notifications show for ALL recipients so the flow
// can be tested without multi-user auth. The recipient is shown explicitly.

import { joinForum } from "./forumsStore";

export type NotificationType = "forum_invite" | "deadline_invite";
export type NotificationStatus = "pending" | "accepted" | "declined";

export interface InviteNotification {
  id: string;
  type: NotificationType;
  recipient: string; // display name of invitee
  from: string;
  title: string; // forum name or deadline title
  message?: string;
  forumId?: string;
  deadlineId?: string;
  createdAt: number;
  status: NotificationStatus;
}

const KEY = "notifications_v1";
const EVENT = "notifications_changed";

export const loadNotifications = (): InviteNotification[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as InviteNotification[]) : [];
  } catch {
    return [];
  }
};

export const saveNotifications = (n: InviteNotification[]) => {
  localStorage.setItem(KEY, JSON.stringify(n));
  window.dispatchEvent(new Event(EVENT));
};

export const subscribeNotifications = (cb: () => void) => {
  const h = () => cb();
  window.addEventListener(EVENT, h);
  window.addEventListener("storage", h);
  return () => {
    window.removeEventListener(EVENT, h);
    window.removeEventListener("storage", h);
  };
};

export const addNotification = (
  n: Omit<InviteNotification, "id" | "createdAt" | "status">
) => {
  const item: InviteNotification = {
    ...n,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    status: "pending",
  };
  saveNotifications([item, ...loadNotifications()]);
  return item;
};

export const inviteToForum = (forumId: string, forumName: string, recipients: string[], from: string) => {
  recipients
    .map((r) => r.trim())
    .filter(Boolean)
    .forEach((recipient) =>
      addNotification({
        type: "forum_invite",
        recipient,
        from,
        title: forumName,
        forumId,
        message: `${from} hat dich ins Forum „${forumName}“ eingeladen.`,
      })
    );
};

export const inviteToDeadline = (deadlineId: string, title: string, recipients: string[], from: string) => {
  recipients
    .map((r) => r.trim())
    .filter(Boolean)
    .forEach((recipient) =>
      addNotification({
        type: "deadline_invite",
        recipient,
        from,
        title,
        deadlineId,
        message: `${from} hat dich zum Termin „${title}“ eingeladen.`,
      })
    );
};

const setStatus = (id: string, status: NotificationStatus) => {
  saveNotifications(loadNotifications().map((n) => (n.id === id ? { ...n, status } : n)));
};

export const acceptNotification = (id: string) => {
  const n = loadNotifications().find((x) => x.id === id);
  if (!n) return;
  if (n.type === "forum_invite" && n.forumId) {
    joinForum(n.forumId, n.recipient);
  }
  // For deadline invites: invitee is already on the deadline; nothing else needed.
  setStatus(id, "accepted");
};

export const declineNotification = (id: string) => setStatus(id, "declined");

export const removeNotification = (id: string) =>
  saveNotifications(loadNotifications().filter((n) => n.id !== id));

export const pendingCount = () => loadNotifications().filter((n) => n.status === "pending").length;
