/**
 * Forum – Autor-Kontrolle (FA: "Editieren/Löschen nur durch Autor oder Moderator möglich")
 *
 * Diese Tests prüfen, dass Edit- und Löschen-Buttons auf einem Post bzw. Kommentar
 * ausschließlich für den eigenen Autor sichtbar sind.
 *
 * Voraussetzung in PostDetailPage.tsx (noch zu implementieren):
 *   - `authorId` muss im EnrichedPost-Interface vorhanden und aus Convex zurückgegeben werden
 *   - Post: Button mit aria-label="Beitrag bearbeiten" und aria-label="Beitrag löschen"
 *     nur rendern wenn `user.id === post.authorId`
 *   - Kommentar: Button mit aria-label="Kommentar löschen"
 *     nur rendern wenn `user.id === comment.authorId`
 */
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PostDetailPage from "@/pages/PostDetailPage";
import { ThemeProvider } from "@/hooks/useTheme";

// ── Types ──

type PostComment = {
  _id: string;
  _creationTime: number;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  parentId?: string;
  liked: boolean;
  likeCount: number;
};

type Post = {
  _id: string;
  _creationTime: number;
  forumId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  tag: "frage" | "lerngruppe" | "material" | "diskussion";
  liked: boolean;
  likeCount: number;
  replies: number;
  comments: PostComment[];
};

type Forum = {
  _id: string;
  name: string;
  visibility: "public" | "private";
  description: string;
  members: { userId: string; displayName: string }[];
  ownerId: string;
  inviteCode: string;
};

// ── Reactive in-memory store ──

let postsStore: Post[] = [];
let forumsStore: Forum[] = [];
const listeners = new Set<() => void>();

let snapshot = { posts: postsStore, forums: forumsStore };
const getSnapshot = () => snapshot;
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const emit = () => {
  snapshot = { posts: postsStore, forums: forumsStore };
  listeners.forEach((l) => l());
};

// ── Static mocks ──

vi.mock("@/components/Navbar", () => ({
  default: () => <nav aria-label="Mock Navbar" />,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

vi.mock("@clerk/clerk-react", () => ({
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: { id: "demo-test-user" },
  }),
  useClerk: () => ({ signOut: vi.fn() }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "demo-test-user", email: "test@example.com" },
    isAdmin: false,
    loading: false,
    signOut: async () => {},
  }),
}));

vi.mock("@/hooks/useProfile", () => ({
  useProfile: () => ({
    display_name: "Test Nutzer",
    studienfach: "Informatik",
    matrikelnummer: "123456",
    hochschule: "DHBW Mannheim",
    jahrgang: "TINF25A",
    avatar_url: null,
    created_at: null,
    role: "user",
  }),
}));

vi.mock("../../convex/_generated/api", () => ({
  api: {
    forums: {
      getAllAccessible: "forums.getAllAccessible",
      getById: "forums.getById",
    },
    posts: {
      listByForum: "posts.listByForum",
      getById: "posts.getById",
      create: "posts.create",
      update: "posts.update",
      deletePost: "posts.deletePost",
      toggleLike: "posts.toggleLike",
      toggleCommentLike: "posts.toggleCommentLike",
      addComment: "posts.addComment",
      deleteComment: "posts.deleteComment",
    },
    scripts: {
      listPublic: "scripts.listPublic",
    },
    profiles: {
      getMine: "profiles.getMine",
    },
  },
}));

vi.mock("convex/react", async () => {
  const ReactModule = await import("react");

  return {
    useQuery: (query: string, args?: unknown) => {
      const snap = ReactModule.useSyncExternalStore(subscribe, getSnapshot);

      if (args === "skip") return undefined;

      if (query === "posts.getById") {
        const pid = (args as { postId: string })?.postId;
        return snap.posts.find((p) => p._id === pid) ?? null;
      }

      if (query === "forums.getById") {
        const fid = (args as { forumId: string })?.forumId;
        return snap.forums.find((f) => f._id === fid) ?? null;
      }

      if (query === "scripts.listPublic") return [];
      if (query === "profiles.getMine") return null;

      return undefined;
    },

    useMutation: (mutation: string) => {
      if (mutation === "posts.update") {
        return async (payload: { postId: string; title?: string; content?: string }) => {
          postsStore = postsStore.map((p) =>
            p._id === payload.postId
              ? { ...p, title: payload.title ?? p.title, content: payload.content ?? p.content }
              : p
          );
          emit();
        };
      }

      if (mutation === "posts.deletePost") {
        return async ({ postId }: { postId: string }) => {
          postsStore = postsStore.filter((p) => p._id !== postId);
          emit();
        };
      }

      if (mutation === "posts.deleteComment") {
        return async ({ commentId }: { commentId: string }) => {
          postsStore = postsStore.map((p) => ({
            ...p,
            comments: p.comments.filter((c) => c._id !== commentId),
          }));
          emit();
        };
      }

      return async () => {};
    },

    ConvexProviderWithClerk: ({ children }: { children: React.ReactNode }) =>
      children,
  };
});

// ── Constants & helpers ──

const FORUM_ID = "forum-1";
const TIME_BASE = 1_700_000_000_000;

const CURRENT_USER_ID = "demo-test-user";
const OTHER_USER_ID = "other-user-456";

const makePost = (overrides: Partial<Post>): Post => ({
  _id: "post-1",
  _creationTime: TIME_BASE,
  forumId: FORUM_ID,
  authorId: CURRENT_USER_ID,
  authorName: "Test Nutzer",
  title: "Test-Beitrag",
  content: "Inhalt des Test-Beitrags.",
  tag: "diskussion",
  liked: false,
  likeCount: 0,
  replies: 0,
  comments: [],
  ...overrides,
});

const renderPostDetail = (postId: string) =>
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[`/forum/${FORUM_ID}/post/${postId}`]}>
        <Routes>
          <Route
            path="/forum/:forumId/post/:postId"
            element={<PostDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

// ── Tests ──

describe("Forum – Autor-Kontrolle: Edit/Delete-Buttons", () => {
  beforeEach(() => {
    postsStore = [];
    forumsStore = [
      {
        _id: FORUM_ID,
        name: "Test Forum",
        visibility: "public",
        description: "",
        members: [{ userId: CURRENT_USER_ID, displayName: "Test Nutzer" }],
        ownerId: CURRENT_USER_ID,
        inviteCode: "TEST01",
      },
    ];
    snapshot = { posts: postsStore, forums: forumsStore };
    listeners.clear();
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    window.confirm = vi.fn(() => true);
  });

  it.todo("Autor sieht Bearbeiten- und Löschen-Buttons am eigenen Beitrag", async () => {
    postsStore = [makePost({ authorId: CURRENT_USER_ID })];
    snapshot = { posts: postsStore, forums: forumsStore };

    renderPostDetail("post-1");

    await screen.findByRole("heading", { name: "Test-Beitrag" });

    expect(
      screen.getByRole("button", { name: /Beitrag bearbeiten/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Beitrag löschen/i })
    ).toBeInTheDocument();
  });

  it("Fremder Nutzer sieht keine Bearbeiten/Löschen-Buttons am fremden Beitrag", async () => {
    postsStore = [makePost({ authorId: OTHER_USER_ID, authorName: "Anderer Nutzer" })];
    snapshot = { posts: postsStore, forums: forumsStore };

    renderPostDetail("post-1");

    await screen.findByRole("heading", { name: "Test-Beitrag" });

    expect(
      screen.queryByRole("button", { name: /Beitrag bearbeiten/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Beitrag löschen/i })
    ).not.toBeInTheDocument();
  });

  it.todo("Eigener Kommentar zeigt Löschen-Button, fremder Kommentar nicht", async () => {
    const ownComment: PostComment = {
      _id: "comment-own",
      _creationTime: TIME_BASE + 1000,
      postId: "post-1",
      authorId: CURRENT_USER_ID,
      authorName: "Test Nutzer",
      content: "Mein eigener Kommentar",
      liked: false,
      likeCount: 0,
    };
    const otherComment: PostComment = {
      _id: "comment-other",
      _creationTime: TIME_BASE + 2000,
      postId: "post-1",
      authorId: OTHER_USER_ID,
      authorName: "Anderer Nutzer",
      content: "Kommentar eines anderen Nutzers",
      liked: false,
      likeCount: 0,
    };

    postsStore = [
      makePost({ authorId: CURRENT_USER_ID, comments: [ownComment, otherComment] }),
    ];
    snapshot = { posts: postsStore, forums: forumsStore };

    renderPostDetail("post-1");

    await screen.findByText("Mein eigener Kommentar");
    await screen.findByText("Kommentar eines anderen Nutzers");

    // Eigener Kommentar hat Löschen-Button
    const deleteButtons = screen.getAllByRole("button", { name: /Kommentar löschen/i });
    expect(deleteButtons).toHaveLength(1);

    // Der Button befindet sich nahe am eigenen Kommentar-Inhalt
    const ownCommentNode = screen.getByText("Mein eigener Kommentar");
    const otherCommentNode = screen.getByText("Kommentar eines anderen Nutzers");
    const deleteBtn = deleteButtons[0];

    // Eigener Kommentar liegt vor dem Delete-Button im DOM (gleicher Kommentar-Block)
    expect(
      ownCommentNode.compareDocumentPosition(deleteBtn) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    // Fremder Kommentar liegt nach dem Delete-Button → Button gehört nicht zu ihm
    expect(
      otherCommentNode.compareDocumentPosition(deleteBtn) &
        Node.DOCUMENT_POSITION_PRECEDING
    ).toBeTruthy();
  });

  it.todo("Klick auf Bearbeiten öffnet Inline-Formular mit vorausgefülltem Inhalt", async () => {
    const { fireEvent } = await import("@testing-library/react");

    postsStore = [makePost({ authorId: CURRENT_USER_ID, title: "Original Titel", content: "Original Inhalt" })];
    snapshot = { posts: postsStore, forums: forumsStore };

    renderPostDetail("post-1");

    await screen.findByRole("heading", { name: "Original Titel" });

    fireEvent.click(screen.getByRole("button", { name: /Beitrag bearbeiten/i }));

    await waitFor(() => {
      const titleInput = screen.getByDisplayValue("Original Titel");
      const contentInput = screen.getByDisplayValue("Original Inhalt");
      expect(titleInput).toBeInTheDocument();
      expect(contentInput).toBeInTheDocument();
    });

    // Original-Überschrift nicht mehr sichtbar (ersetzt durch Editierformular)
    expect(screen.queryByRole("heading", { name: "Original Titel" })).not.toBeInTheDocument();

    // Abbrechen-Button ist sichtbar
    expect(screen.getByRole("button", { name: /Abbrechen/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Speichern/i })).toBeInTheDocument();
  });
});
