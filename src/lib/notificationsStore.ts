export type NotificationType = "forum_invite" | "deadline_invite";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  fromName: string;
  recipientName: string;
  title: string;
  status: "pending" | "accepted" | "declined";
  createdAt: number;
  forumId?: string;
}

const KEY = "notifications_v1";
const EVENT = "notifications_changed";

const loadNotifications = (): NotificationItem[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as NotificationItem[]) : [];
  } catch {
    return [];
  }
};

const saveNotifications = (items: NotificationItem[]) => {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
};

export const inviteToForum = (forumId: string, forumName: string, invitees: string[], fromName: string) => {
  const next = loadNotifications();
  const createdAt = Date.now();

  for (const recipientName of invitees) {
    next.unshift({
      id: `${forumId}-${recipientName}-${createdAt}`,
      type: "forum_invite",
      fromName,
      recipientName,
      title: forumName,
      status: "pending",
      createdAt,
      forumId,
    });
  }

  saveNotifications(next);
};
