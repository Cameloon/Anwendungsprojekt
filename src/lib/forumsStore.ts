// Unified forum store. A "forum" can be:
// - the special "Allgemein" forum (id = "public")
// - a public, themed forum (visible to everyone, joinable freely)
// - a private forum (invite code or course-based access list)
//
// Existing localStorage groups (forum_groups_v1) are migrated to private forums on first load.

import { loadGroups, saveGroups } from "./groupStore";

export type ForumVisibility = "public" | "private";

export interface Forum {
  id: string;
  name: string;
  description: string;
  visibility: ForumVisibility;
  kurs?: string;
  vorlesung?: string;
  professor?: string;
  standort?: string;
  inviteCode: string;
  members: string[]; // display names
  allowedKurse?: string[]; // private forums: auto-allow these courses
  jahrgang?: string; // Studienjahrgang, z. B. "TIF25B"
  ownerName: string;
  createdAt: number;
  isDefault?: boolean; // "Allgemein"
}

const KEY = "forums_v1";
const EVENT = "forums_changed";

const DEFAULT_FORUM: Forum = {
  id: "public",
  name: "Allgemein",
  description: "Kurs- und standortübergreifend für alle DHBW-Studierenden",
  visibility: "public",
  inviteCode: "",
  members: [],
  ownerName: "system",
  createdAt: 0,
  isDefault: true,
};

const migrate = (): Forum[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Forum[];
  } catch {
    // ignore
  }
  // Build initial state from legacy groups
  const legacy = loadGroups();
  const migrated: Forum[] = [
    DEFAULT_FORUM,
    ...legacy.map<Forum>((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      visibility: "private",
      inviteCode: g.inviteCode,
      members: g.members,
      ownerName: g.ownerName,
      createdAt: g.createdAt,
    })),
  ];
  localStorage.setItem(KEY, JSON.stringify(migrated));
  return migrated;
};

export const loadForums = (): Forum[] => {
  const list = migrate();
  // Always make sure default forum exists at index 0
  if (!list.some((f) => f.id === "public")) list.unshift(DEFAULT_FORUM);
  return list;
};

export const saveForums = (forums: Forum[]) => {
  localStorage.setItem(KEY, JSON.stringify(forums));
  window.dispatchEvent(new Event(EVENT));
  // Keep legacy group store in sync (private forums == groups) so older code still works
  const groups = forums
    .filter((f) => f.visibility === "private" && !f.isDefault)
    .map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      inviteCode: f.inviteCode,
      members: f.members,
      createdAt: f.createdAt,
      ownerName: f.ownerName,
    }));
  saveGroups(groups);
};

export const subscribeForums = (cb: () => void) => {
  const h = () => cb();
  window.addEventListener(EVENT, h);
  window.addEventListener("storage", h);
  return () => {
    window.removeEventListener(EVENT, h);
    window.removeEventListener("storage", h);
  };
};

const randomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export interface CreateForumInput {
  name: string;
  description?: string;
  visibility: ForumVisibility;
  kurs?: string;
  vorlesung?: string;
  professor?: string;
  standort?: string;
  allowedKurse?: string[];
  jahrgang?: string;
  ownerName?: string;
}

export const createForum = (input: CreateForumInput): Forum => {
  const owner = input.ownerName || "Du";
  const f: Forum = {
    id: Date.now().toString(),
    name: input.name.trim(),
    description: (input.description || "").trim(),
    visibility: input.visibility,
    kurs: input.kurs?.trim() || undefined,
    vorlesung: input.vorlesung?.trim() || undefined,
    professor: input.professor?.trim() || undefined,
    standort: input.standort?.trim() || undefined,
    allowedKurse: input.allowedKurse?.filter(Boolean),
    jahrgang: input.jahrgang?.trim().toUpperCase() || undefined,
    inviteCode: randomCode(),
    members: [owner],
    ownerName: owner,
    createdAt: Date.now(),
  };
  const next = [...loadForums(), f];
  saveForums(next);
  return f;
};

export const joinForumByCode = (code: string, member = "Du"): Forum | null => {
  const forums = loadForums();
  const f = forums.find((x) => x.inviteCode && x.inviteCode.toUpperCase() === code.toUpperCase());
  if (!f) return null;
  if (!f.members.includes(member)) f.members.push(member);
  saveForums(forums);
  return f;
};

export const joinForum = (forumId: string, member = "Du"): Forum | null => {
  const forums = loadForums();
  const f = forums.find((x) => x.id === forumId);
  if (!f) return null;
  if (!f.members.includes(member)) f.members.push(member);
  saveForums(forums);
  return f;
};

export const leaveForum = (forumId: string, member = "Du") => {
  const forums = loadForums();
  const f = forums.find((x) => x.id === forumId);
  if (!f || f.isDefault) return;
  f.members = f.members.filter((m) => m !== member);
  saveForums(forums);
};

export const deleteForum = (forumId: string) => {
  const next = loadForums().filter((f) => f.id !== forumId || f.isDefault);
  saveForums(next);
};

// Determine which forums a user can access:
// - the default + all public + all private the user is member of OR matches an allowed Kurs.
export const accessibleForums = (
  member: string,
  userKurs?: string,
  userJahrgang?: string
): Forum[] => {
  return loadForums().filter((f) => {
    if (f.isDefault) return true;
    if (f.members.includes(member)) return true;
    // Jahrgang-Beschränkung: wenn das Forum einem Jahrgang zugeordnet ist,
    // dürfen nur Mitglieder dieses Jahrgangs zugreifen.
    if (f.jahrgang && (!userJahrgang || f.jahrgang !== userJahrgang)) return false;
    if (f.visibility === "public") return true;
    if (userKurs && f.allowedKurse?.includes(userKurs)) return true;
    return false;
  });
};
