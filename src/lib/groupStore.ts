export interface GroupRecord {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  members: string[];
  createdAt: number;
  ownerName: string;
}

const KEY = "forum_groups_v1";
const EVENT = "forum_groups_changed";

export const loadGroups = (): GroupRecord[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GroupRecord[]) : [];
  } catch {
    return [];
  }
};

export const saveGroups = (groups: GroupRecord[]) => {
  localStorage.setItem(KEY, JSON.stringify(groups));
  window.dispatchEvent(new Event(EVENT));
};

export const subscribeGroups = (cb: () => void) => {
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
};
