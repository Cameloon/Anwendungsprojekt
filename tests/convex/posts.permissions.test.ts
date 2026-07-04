// @vitest-environment edge-runtime
//
// Regressionstests für BUG-003: Der Löschen-Button für Kommentare war im UI
// nur für Admins sichtbar, obwohl das Backend dem Autor eines Kommentars das
// Löschen/Bearbeiten immer schon erlaubt hat. Diese Tests sichern das
// tatsächliche Backend-Verhalten (Autor oder Admin) ab.
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import { createProfile, identity } from "./helpers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createForumAndPost(t: any, postAuthorId: string) {
  const forumId = await t.run(async (ctx: any) =>
    ctx.db.insert("forums", {
      name: "Testforum",
      description: "Testbeschreibung",
      visibility: "public",
      inviteCode: "TEST123",
      createdAt: Date.now(),
    }),
  );
  const postId = await t.run(async (ctx: any) =>
    ctx.db.insert("posts", {
      forumId,
      authorId: postAuthorId,
      authorName: "Post-Autor",
      title: "Testpost",
      content: "Inhalt",
      tag: "diskussion",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
  );
  return { forumId, postId };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createComment(t: any, postId: any, authorId: string) {
  return await t.run(async (ctx: any) =>
    ctx.db.insert("postComments", {
      postId,
      authorId,
      authorName: "Kommentator",
      content: "Ursprünglicher Kommentar",
      createdAt: Date.now(),
    }),
  );
}

describe("posts.deleteComment — Autor oder Admin (BUG-003)", () => {
  test("Autor darf eigenen Kommentar löschen", async () => {
    const t = convexTest(schema);
    await createProfile(t, "author_1");
    const { postId } = await createForumAndPost(t, "post_author");
    const commentId = await createComment(t, postId, "author_1");

    await t.withIdentity(identity("author_1")).mutation(api.posts.deleteComment, { commentId });

    const deleted = await t.run(async (ctx: any) => ctx.db.get(commentId));
    expect(deleted).toBeNull();
  });

  test("Fremder Nutzer darf Kommentar NICHT löschen", async () => {
    const t = convexTest(schema);
    await createProfile(t, "author_1");
    await createProfile(t, "stranger_1");
    const { postId } = await createForumAndPost(t, "post_author");
    const commentId = await createComment(t, postId, "author_1");

    await expect(
      t.withIdentity(identity("stranger_1")).mutation(api.posts.deleteComment, { commentId }),
    ).rejects.toThrow(/Not authorized/);
  });

  test("Admin darf fremden Kommentar löschen (Moderation)", async () => {
    const t = convexTest(schema);
    await createProfile(t, "author_1");
    await createProfile(t, "admin_1", { role: "admin" });
    const { postId } = await createForumAndPost(t, "post_author");
    const commentId = await createComment(t, postId, "author_1");

    await t.withIdentity(identity("admin_1")).mutation(api.posts.deleteComment, { commentId });

    const deleted = await t.run(async (ctx: any) => ctx.db.get(commentId));
    expect(deleted).toBeNull();
  });
});

describe("posts.updateComment — Autor oder Admin (BUG-003)", () => {
  test("Autor darf eigenen Kommentar bearbeiten", async () => {
    const t = convexTest(schema);
    await createProfile(t, "author_1");
    const { postId } = await createForumAndPost(t, "post_author");
    const commentId = await createComment(t, postId, "author_1");

    await t.withIdentity(identity("author_1")).mutation(api.posts.updateComment, {
      commentId,
      content: "Bearbeiteter Kommentar",
    });

    const updated = await t.run(async (ctx: any) => ctx.db.get(commentId));
    expect(updated?.content).toBe("Bearbeiteter Kommentar");
  });

  test("Fremder Nutzer darf Kommentar NICHT bearbeiten", async () => {
    const t = convexTest(schema);
    await createProfile(t, "author_1");
    await createProfile(t, "stranger_1");
    const { postId } = await createForumAndPost(t, "post_author");
    const commentId = await createComment(t, postId, "author_1");

    await expect(
      t.withIdentity(identity("stranger_1")).mutation(api.posts.updateComment, {
        commentId,
        content: "Hack",
      }),
    ).rejects.toThrow(/Not authorized/);
  });
});
