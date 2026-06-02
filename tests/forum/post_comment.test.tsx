// Test runner imports (Bun) and DOM emulation via JSDOM
import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

// Keys used by the app to store forum/forums/demo data in localStorage
const storageKeys = [
  "demo_user",
  "demo_profile",
  "forum_posts_v1",
  "forums_v1",
  "forum_groups_v1",
  "dashboard_hidden_forums_v1",
];

// Path to the auto-updated status markdown written by the test
const statusDocPath = path.resolve(
  process.cwd(),
  "docs/forum_post_comment_test_status.md",
);

type TestEnv = {
  render: typeof import("@testing-library/react").render;
  fireEvent: typeof import("@testing-library/react").fireEvent;
  screen: typeof import("@testing-library/react").screen;
  waitFor: typeof import("@testing-library/react").waitFor;
  within: typeof import("@testing-library/react").within;
  App: typeof import("../../src/App.tsx").default;
};

// Seed a demo authenticated user and profile in localStorage
const seedDemoUser = () => {
  localStorage.setItem(
    "demo_user",
    JSON.stringify({
      id: "demo-test-user",
      email: "test@example.com",
      created_at: "2026-06-02T08:00:00.000Z",
    }),
  );
  localStorage.setItem(
    "demo_profile",
    JSON.stringify({
      display_name: "Test Nutzer",
      studienfach: "Informatik",
      matrikelnummer: "123456",
      hochschule: "DHBW Mannheim",
      jahrgang: "TINF25A",
      avatar_url: null,
      created_at: "2026-06-02T08:00:00.000Z",
    }),
  );
};

// Create a deterministic forum post fixture in localStorage so the test is
// stable and reproducible across runs.
const seedForumPost = () => {
  localStorage.setItem(
    "forum_posts_v1",
    JSON.stringify([
      {
        id: "post-seed-1",
        author: "Test Nutzer",
        title: "Detaillierter Thread",
        content: "Dies ist ein eindeutiger Beitrag für den UI-Test.",
        date: "02.06.2026, 08:00",
        likes: 0,
        replies: 0,
        tag: "diskussion",
        visibility: "public",
      },
    ]),
  );
};

// Setup a minimal JSDOM environment and bind common browser APIs to the
// Node global so React and the app can run inside the test runner.
const setupEnvironment = async (): Promise<TestEnv> => {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="root"></div></body></html>',
    {
      url: "http://localhost/",
    },
  );

  const windowObject = dom.window as typeof globalThis.window;
  globalThis.window = windowObject;
  globalThis.document = windowObject.document;
  globalThis.navigator = windowObject.navigator;
  globalThis.localStorage = windowObject.localStorage;
  globalThis.sessionStorage = windowObject.sessionStorage;
  globalThis.history = windowObject.history;
  globalThis.HTMLElement = windowObject.HTMLElement;
  globalThis.Element = windowObject.Element;
  globalThis.Node = windowObject.Node;
  globalThis.MutationObserver = windowObject.MutationObserver;
  globalThis.Event = windowObject.Event;
  globalThis.CustomEvent = windowObject.CustomEvent;
  globalThis.DOMRect = windowObject.DOMRect;
  globalThis.getComputedStyle =
    windowObject.getComputedStyle.bind(windowObject);
  windowObject.scrollTo = () => {};
  globalThis.scrollTo = windowObject.scrollTo.bind(windowObject);
  globalThis.requestAnimationFrame =
    windowObject.requestAnimationFrame?.bind(windowObject) ??
    ((cb: any) => setTimeout(() => cb(Date.now()), 0));
  globalThis.cancelAnimationFrame =
    windowObject.cancelAnimationFrame?.bind(windowObject) ??
    ((handle: number) => clearTimeout(handle));

  const matchMedia =
    windowObject.matchMedia?.bind(windowObject) ??
    (() => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));

  Object.defineProperty(windowObject, "matchMedia", { value: matchMedia });
  globalThis.matchMedia = matchMedia;

  const originalSetTimeout = globalThis.setTimeout.bind(globalThis);
  globalThis.setTimeout = ((
    handler: TimerHandler,
    timeout?: number,
    ...args: unknown[]
  ) => {
    if (timeout === 1600 && typeof handler === "function") {
      return originalSetTimeout(() => {
        handler(...args);
      }, 0);
    }
    return originalSetTimeout(handler, timeout, ...args);
  }) as typeof globalThis.setTimeout;

  // Import React Testing Library and the application after the DOM has been
  // bootstrapped (important: some libraries register test hooks at import
  // time and expect a window/document to exist).
  const rtl = await import("@testing-library/react");
  const app = await import("../../src/App.tsx");

  return { ...rtl, App: app.default };
};

// Initialize test environment (DOM + RTL + App)
const env = await setupEnvironment();
let suitePassed = false; // flag written to the status doc in afterAll

// Helper that writes a small markdown file with last-run status so the
// documentation in `docs/` is automatically updated by test runs.
const writeStatusDoc = (status: "passed" | "failed", message: string) => {
  mkdirSync(path.dirname(statusDocPath), { recursive: true });
  writeFileSync(
    statusDocPath,
    [
      "# Forum Post/Comment Test Status",
      "",
      `Last run: ${new Date().toISOString()}`,
      "",
      "- Test: `bun test tests/forum/post_comment.test.tsx`",
      `- Status: **${status}**`,
      `- Result: ${message}`,
      "- Scope: deterministic seeded post + comment chronology in the UI",
      "- Auto-update: this file is rewritten by the test itself after execution",
      "",
    ].join("\n"),
  );
};

// Navigate the rendered app to the forum page and wait for the main UI to
// appear (guard against transient animations/boot sequence using waitFor).
const openForumPage = async () => {
  window.history.pushState({}, "", "/forum");
  env.render(<env.App />);
  await env.waitFor(() => {
    expect(
      env.screen.getByRole("button", { name: /Neuer Beitrag/i }),
    ).toBeTruthy();
  });
};

// Type a comment in the composer and submit it. Wait for the comment text
// to appear in the DOM before returning.
const postComment = async (text: string) => {
  env.fireEvent.change(
    env.screen.getByPlaceholderText("Schreibe einen Kommentar…"),
    {
      target: { value: text },
    },
  );
  env.fireEvent.click(env.screen.getByRole("button", { name: /Posten/i }));
  await env.screen.findByText(text);
};

// Test scenario: verifies that a seeded post is visible in the forum list,
// opening its detail shows author/date/tag/content, and adding two
// comments results in chronological order in the comments list.
describe("Forum post and comment flow", () => {
  // Prepare a clean localStorage and deterministic fixtures before each run
  beforeEach(() => {
    localStorage.clear();
    for (const key of storageKeys) {
      localStorage.removeItem(key);
    }
    seedDemoUser();
    seedForumPost();
  });

  // After the whole suite, persist a short status doc for visibility in docs/
  afterAll(() => {
    if (suitePassed) {
      writeStatusDoc(
        "passed",
        "Seeded post rendered, detail view opened, and both comments appeared in chronological order.",
      );
    } else {
      writeStatusDoc(
        "failed",
        "The forum post/comment UI flow did not complete successfully.",
      );
    }
  });

  it("shows a seeded post, opens the detail view, and keeps comments in chronological order", async () => {
    await openForumPage();

    const title = "Detaillierter Thread";
    const content = "Dies ist ein eindeutiger Beitrag für den UI-Test.";

    const postCard = await env.screen.findByText(title);
    const forumArticle = postCard.closest("article");
    expect(forumArticle).not.toBeNull();

    const forumCard = forumArticle as HTMLElement;
    expect(env.within(forumCard).getByText("Test Nutzer")).toBeTruthy();
    expect(env.within(forumCard).getByText("02.06.2026, 08:00")).toBeTruthy();
    expect(env.within(forumCard).getByText("Diskussion")).toBeTruthy();

    env.fireEvent.click(forumCard);

    await env.screen.findByRole("heading", { name: title });
    const detailArticle = env.screen
      .getByRole("heading", { name: title })
      .closest("article");
    expect(detailArticle).not.toBeNull();

    const postDetail = detailArticle as HTMLElement;
    expect(env.within(postDetail).getByText("Test Nutzer")).toBeTruthy();
    expect(env.within(postDetail).getByText("02.06.2026, 08:00")).toBeTruthy();
    expect(env.within(postDetail).getByText("Diskussion")).toBeTruthy();
    expect(env.within(postDetail).getByText(content)).toBeTruthy();

    await postComment("Erster Kommentar");
    await new Promise((resolve) => setTimeout(resolve, 25));
    await postComment("Zweiter Kommentar");

    const firstComment = env.screen.getByText("Erster Kommentar");
    const secondComment = env.screen.getByText("Zweiter Kommentar");
    expect(
      firstComment.compareDocumentPosition(secondComment) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(env.screen.getByText("2 Kommentare")).toBeTruthy();
    suitePassed = true;
  });
});
