// Forum groups stored locally with invite codes.
export interface Group {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  members: string[]; // display names
  createdAt: number;
  ownerName: string;
}

const KEY = "forum_groups_v1";
const EVENT = "forum_groups_changed";

export const loadGroups = (): Group[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Group[]) : [];
  } catch {
    return [];
  }
};

export const saveGroups = (g: Group[]) => {
  localStorage.setItem(KEY, JSON.stringify(g));
  window.dispatchEvent(new Event(EVENT));
};

export const createGroup = (name: string, description: string, ownerName = "Du"): Group => {
  const g: Group = {
    id: Date.now().toString(),
    name,
    description,
    inviteCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
    members: [ownerName],
    createdAt: Date.now(),
    ownerName,
  };
  saveGroups([g, ...loadGroups()]);
  return g;
};

export const joinGroup = (code: string, member = "Du"): Group | null => {
  const groups = loadGroups();
  const g = groups.find((x) => x.inviteCode.toUpperCase() === code.toUpperCase());
  if (!g) return null;
  if (!g.members.includes(member)) g.members.push(member);
  saveGroups(groups);
  return g;
};

export const subscribeGroups = (cb: () => void) => {
  const h = () => cb();
  window.addEventListener(EVENT, h);
  window.addEventListener("storage", h);
  return () => {
    window.removeEventListener(EVENT, h);
    window.removeEventListener("storage", h);
  };
};
