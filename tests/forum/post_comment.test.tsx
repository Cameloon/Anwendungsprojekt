import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ForumPage from "@/pages/ForumPage";
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

let forumsStore: Forum[] = [];
let postsStore: Post[] = [];
const listeners = new Set<() => void>();
let postIdx = 0;
let commentIdx = 0;
let timeBase = 1_700_000_000_000;

// Stable snapshot reference — only replaced on emit() so React's
// useSyncExternalStore doesn't see spurious changes between renders.
let snapshot = { forums: forumsStore, posts: postsStore };

const getSnapshot = () => snapshot;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const emit = () => {
  snapshot = { forums: forumsStore, posts: postsStore };
  listeners.forEach((l) => l());
};

// ── Static mocks ──

vi.mock("@/components/Navbar", () => ({
  default: () => <nav aria-label="Mock Navbar" />,
}));

vi.mock("@/components/Whiteboard", () => ({
  default: () => <div data-testid="whiteboard-mock" />,
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
      create: "forums.create",
      join: "forums.join",
      joinByCode: "forums.joinByCode",
      leave: "forums.leave",
      ensureAllgemeinForum: "forums.ensureAllgemeinForum",
      archiveForum: "forums.archiveForum",
      unarchiveForum: "forums.unarchiveForum",
    },
    posts: {
      listByForum: "posts.listByForum",
      getById: "posts.getById",
      create: "posts.create",
      toggleLike: "posts.toggleLike",
      toggleCommentLike: "posts.toggleCommentLike",
      addComment: "posts.addComment",
      deletePost: "posts.deletePost",
    },
    scripts: {
      listPublic: "scripts.listPublic",
    },
    profiles: {
      getMine: "profiles.getMine",
    },
    notifications: {
      inviteToForum: "notifications.inviteToForum",
    },
    semesterLectures: {
      ensureLectureForums: "semesterLectures.ensureLectureForums",
    },
    sections: {
      list: "sections.list",
      seedDefaultSections: "sections.seedDefaultSections",
    },
  },
}));

vi.mock("convex/react", async () => {
  const ReactModule = await import("react");

  return {
    useQuery: (query: string, args?: unknown) => {
      const snap = ReactModule.useSyncExternalStore(subscribe, getSnapshot);

      if (args === "skip") return undefined;

      if (query === "forums.getAllAccessible") return snap.forums;

      if (query === "posts.listByForum") {
        const fid = (args as { forumId: string })?.forumId;
        return [...snap.posts]
          .filter((p) => p.forumId === fid)
          .sort((a, b) => b._creationTime - a._creationTime);
      }

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
      if (query === "sections.list") return [];

      return undefined;
    },

    useMutation: (mutation: string) => {
      if (mutation === "posts.create") {
        return async (payload: {
          forumId: string;
          title: string;
          content: string;
          tag: string;
        }) => {
          const post: Post = {
            _id: `post-${++postIdx}`,
            _creationTime: timeBase + postIdx * 1_000,
            forumId: payload.forumId,
            authorId: "demo-test-user",
            authorName: "Test Nutzer",
            title: payload.title,
            content: payload.content,
            tag: payload.tag as Post["tag"],
            liked: false,
            likeCount: 0,
            replies: 0,
            comments: [],
          };
          postsStore = [...postsStore, post];
          emit();
          return post._id;
        };
      }

      if (mutation === "posts.addComment") {
        return async (payload: {
          postId: string;
          content: string;
          parentId?: string;
        }) => {
          const comment: PostComment = {
            _id: `comment-${++commentIdx}`,
            _creationTime: timeBase + commentIdx * 1_000,
            postId: payload.postId,
            authorId: "demo-test-user",
            authorName: "Test Nutzer",
            content: payload.content,
            parentId: payload.parentId,
            liked: false,
            likeCount: 0,
          };
          postsStore = postsStore.map((p) =>
            p._id === payload.postId
              ? { ...p, comments: [...p.comments, comment] }
              : p,
          );
          emit();
        };
      }

      if (mutation === "posts.toggleLike") {
        return async ({ postId }: { postId: string }) => {
          postsStore = postsStore.map((p) =>
            p._id === postId
              ? {
                  ...p,
                  liked: !p.liked,
                  likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1,
                }
              : p,
          );
          emit();
        };
      }

      return async () => {};
    },

    ConvexProviderWithClerk: ({ children }: { children: React.ReactNode }) =>
      children,
  };
});

// ── Seed & render helpers ──

const FORUM_ID = "forum-test-1";
const FORUM_NAME = "Test Forum";

const seedForum = () => {
  forumsStore = [
    {
      _id: FORUM_ID,
      name: FORUM_NAME,
      visibility: "public",
      description: "Test-Forum für UI-Tests",
      members: [{ userId: "demo-test-user", displayName: "Test Nutzer" }],
      ownerId: "demo-test-user",
      inviteCode: "TEST01",
    },
  ];
  snapshot = { forums: forumsStore, posts: postsStore };
};

const renderForum = () =>
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/forum"]}>
        <ForumPage />
      </MemoryRouter>
    </ThemeProvider>,
  );

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
    </ThemeProvider>,
  );

// ── Test suite ──

describe("Forum post and comment flow", () => {
  beforeEach(() => {
    localStorage.clear();
    forumsStore = [];
    postsStore = [];
    postIdx = 0;
    commentIdx = 0;
    timeBase = 1_700_000_000_000;
    listeners.clear();
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    seedForum();
  });

  it("creates a post and shows it with author and tag in the forum list", async () => {
    renderForum();

    // The "Neuer Beitrag" button is enabled only when the user is a member.
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Neuer Beitrag/i }),
      ).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Neuer Beitrag/i }));

    await screen.findByPlaceholderText("Titel deines Beitrags");

    fireEvent.change(screen.getByPlaceholderText("Titel deines Beitrags"), {
      target: { value: "Testbeitrag für Forum-UI" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Was möchtest du teilen?"),
      { target: { value: "Das ist der ausführliche Inhalt des Testbeitrags." } },
    );

    // Select the "Diskussion" tag button (only tag buttons are in this group)
    const tagButtons = screen
      .getAllByRole("button")
      .filter((b) => b.textContent === "Diskussion");
    fireEvent.click(tagButtons[0]);

    fireEvent.click(screen.getByRole("button", { name: /^Veröffentlichen$/i }));

    // Post card must appear in the list
    await screen.findByText("Testbeitrag für Forum-UI");

    const postArticle = screen
      .getByText("Testbeitrag für Forum-UI")
      .closest("article");
    expect(postArticle).not.toBeNull();

    const article = postArticle as HTMLElement;
    expect(within(article).getByText("Test Nutzer")).toBeInTheDocument();
    // Tag badge is rendered inside the article as "Diskussion"
    expect(within(article).getByText("Diskussion")).toBeInTheDocument();
  });

  it("shows post detail with author, tag and content; adds comments in chronological order", async () => {
    const POST_ID = "post-detail-seed";
    const POST_TITLE = "Detaillierter Thread";
    const POST_CONTENT =
      "Ausführlicher Inhalt dieses Beitrags für den Detail-Test.";

    postsStore = [
      {
        _id: POST_ID,
        _creationTime: timeBase,
        forumId: FORUM_ID,
        authorId: "demo-test-user",
        authorName: "Test Nutzer",
        title: POST_TITLE,
        content: POST_CONTENT,
        tag: "diskussion",
        liked: false,
        likeCount: 0,
        replies: 0,
        comments: [],
      },
    ];
    snapshot = { forums: forumsStore, posts: postsStore };

    renderPostDetail(POST_ID);

    // Wait for the post heading to appear (query resolves)
    await screen.findByRole("heading", { name: POST_TITLE });

    const postArticle = screen
      .getByRole("heading", { name: POST_TITLE })
      .closest("article");
    expect(postArticle).not.toBeNull();

    const article = postArticle as HTMLElement;
    expect(within(article).getByText("Test Nutzer")).toBeInTheDocument();
    expect(within(article).getByText("Diskussion")).toBeInTheDocument();
    expect(within(article).getByText(POST_CONTENT)).toBeInTheDocument();

    // Add first comment
    const textarea = screen.getByPlaceholderText("Schreibe einen Kommentar…");

    fireEvent.change(textarea, { target: { value: "Erster Kommentar" } });
    fireEvent.click(screen.getByRole("button", { name: /^Posten$/i }));

    await screen.findByText("Erster Kommentar");

    // Add second comment (textarea clears after posting)
    fireEvent.change(textarea, { target: { value: "Zweiter Kommentar" } });
    fireEvent.click(screen.getByRole("button", { name: /^Posten$/i }));

    await screen.findByText("Zweiter Kommentar");

    // Chronological order: first comment appears before second in the DOM
    const firstNode = screen.getByText("Erster Kommentar");
    const secondNode = screen.getByText("Zweiter Kommentar");
    expect(
      firstNode.compareDocumentPosition(secondNode) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    // Comment count in the post's action row
    expect(screen.getByText("2 Kommentare")).toBeInTheDocument();
  });
});
