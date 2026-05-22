// Bridge between PlannerPage task-forum messages and the main Forum.
// Uses localStorage so both pages stay in sync without a backend.

export interface SharedPost {
  id: string;
  author: string;
  title: string;
  content: string;
  date: string;
  likes: number;
  replies: number;
  tag: "frage" | "lerngruppe" | "material" | "diskussion";
  jahrgang?: string;
  fach?: string;
  vorlesung?: string;
  professor?: string;
  standort?: string;
  kurs?: string;
  studiengang?: string;
  liked?: boolean;
  source?: "planner";
  taskId?: string;
  visibility?: "public" | "private";
  sketch?: string;
  groupId?: string;
  linkedScriptIds?: string[];
  comments?: ForumComment[];
}

export interface ForumComment {
  id: string;
  author: string;
  content: string;
  date: string;
  createdAt: number;
}

const KEY = "forum_posts_v1";
const EVENT = "forum_posts_changed";

export const loadPosts = (): SharedPost[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SharedPost[]) : [];
  } catch {
    return [];
  }
};

export const savePosts = (posts: SharedPost[]) => {
  localStorage.setItem(KEY, JSON.stringify(posts));
  window.dispatchEvent(new Event(EVENT));
};

export const addPost = (post: SharedPost) => {
  const posts = loadPosts();
  savePosts([post, ...posts]);
};

export const updatePost = (id: string, patch: Partial<SharedPost>) => {
  savePosts(loadPosts().map((p) => (p.id === id ? { ...p, ...patch } : p)));
};

export const addComment = (postId: string, comment: ForumComment) => {
  savePosts(
    loadPosts().map((p) =>
      p.id === postId
        ? { ...p, comments: [...(p.comments ?? []), comment], replies: (p.comments?.length ?? p.replies) + 1 }
        : p
    )
  );
};

export const subscribe = (cb: () => void) => {
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
};
