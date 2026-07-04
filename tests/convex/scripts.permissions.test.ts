// @vitest-environment edge-runtime
//
// Tests für die Zugriffskontrolle auf Skripte (`canAccess` in convex/scripts.ts).
// Die Sichtbarkeitsstufen private/jahrgang/group/public sind laut
// Funktionale_Anforderungen.md ("Zugriffskontrolle verhindert unberechtigten
// Download") ein explizites Akzeptanzkriterium, hatten bisher aber keine Tests.
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import { createProfile, identity } from "./helpers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createScript(t: any, overrides: Record<string, any>) {
  const now = Date.now();
  return await t.run(async (ctx: any) =>
    ctx.db.insert("scripts", {
      title: "Testskript",
      subject: "Mathe1",
      description: "Testbeschreibung",
      authorId: overrides.authorId,
      authorName: "Autor",
      authorKurs: overrides.authorKurs,
      pages: 1,
      type: "PDF",
      visibility: overrides.visibility,
      forumId: overrides.forumId,
      createdAt: now,
      updatedAt: now,
    }),
  );
}

describe("scripts.getById — private", () => {
  test("Autor sieht eigenes privates Skript", async () => {
    const t = convexTest(schema);
    await createProfile(t, "author_1");
    const scriptId = await createScript(t, { authorId: "author_1", visibility: "private" });

    const result = await t.withIdentity(identity("author_1")).query(api.scripts.getById, { scriptId });
    expect(result).not.toBeNull();
  });

  test("Fremder Nutzer sieht privates Skript NICHT", async () => {
    const t = convexTest(schema);
    await createProfile(t, "author_1");
    await createProfile(t, "stranger_1");
    const scriptId = await createScript(t, { authorId: "author_1", visibility: "private" });

    const result = await t.withIdentity(identity("stranger_1")).query(api.scripts.getById, { scriptId });
    expect(result).toBeNull();
  });
});

describe("scripts.getById — group", () => {
  async function createForum(t: any) {
    return await t.run(async (ctx: any) =>
      ctx.db.insert("forums", {
        name: "Testforum",
        description: "Testbeschreibung",
        visibility: "private",
        inviteCode: "TEST123",
        createdAt: Date.now(),
      }),
    );
  }

  test("Forum-Mitglied sieht group-Skript", async () => {
    const t = convexTest(schema);
    await createProfile(t, "author_1");
    await createProfile(t, "member_1");
    const forumId = await createForum(t);
    await t.run(async (ctx: any) =>
      ctx.db.insert("forumMembers", {
        forumId,
        userId: "member_1",
        displayName: "Mitglied",
        joinedAt: Date.now(),
      }),
    );
    const scriptId = await createScript(t, { authorId: "author_1", visibility: "group", forumId });

    const result = await t.withIdentity(identity("member_1")).query(api.scripts.getById, { scriptId });
    expect(result).not.toBeNull();
  });

  test("Nicht-Mitglied sieht group-Skript NICHT", async () => {
    const t = convexTest(schema);
    await createProfile(t, "author_1");
    await createProfile(t, "outsider_1");
    const forumId = await createForum(t);
    const scriptId = await createScript(t, { authorId: "author_1", visibility: "group", forumId });

    const result = await t.withIdentity(identity("outsider_1")).query(api.scripts.getById, { scriptId });
    expect(result).toBeNull();
  });
});

describe("scripts.getById — jahrgang (kursweit)", () => {
  test("Nutzer mit demselben Kurs sieht jahrgang-Skript", async () => {
    const t = convexTest(schema);
    await createProfile(t, "author_1", { kurs: "TIF25B" });
    await createProfile(t, "kollege_1", { kurs: "TIF25B" });
    const scriptId = await createScript(t, {
      authorId: "author_1",
      visibility: "jahrgang",
      authorKurs: "TIF25B",
    });

    const result = await t.withIdentity(identity("kollege_1")).query(api.scripts.getById, { scriptId });
    expect(result).not.toBeNull();
  });

  test("Nutzer mit anderem Kurs sieht jahrgang-Skript NICHT", async () => {
    const t = convexTest(schema);
    await createProfile(t, "author_1", { kurs: "TIF25B" });
    await createProfile(t, "anderer_kurs_1", { kurs: "WWI25A" });
    const scriptId = await createScript(t, {
      authorId: "author_1",
      visibility: "jahrgang",
      authorKurs: "TIF25B",
    });

    const result = await t.withIdentity(identity("anderer_kurs_1")).query(api.scripts.getById, { scriptId });
    expect(result).toBeNull();
  });
});

describe("scripts.getById — public", () => {
  test("public-Skript ist für jeden authentifizierten Nutzer sichtbar", async () => {
    const t = convexTest(schema);
    await createProfile(t, "author_1");
    await createProfile(t, "irgendwer_1");
    const scriptId = await createScript(t, { authorId: "author_1", visibility: "public" });

    const result = await t.withIdentity(identity("irgendwer_1")).query(api.scripts.getById, { scriptId });
    expect(result).not.toBeNull();
  });
});

describe("scripts.listVisible — filtert Sichtbarkeit korrekt", () => {
  test("listVisible zeigt nur öffentliche, eigene und berechtigte Skripte", async () => {
    const t = convexTest(schema);
    await createProfile(t, "author_1", { kurs: "TIF25B" });
    await createProfile(t, "viewer_1", { kurs: "WWI25A" });

    await createScript(t, { authorId: "author_1", visibility: "public" });
    await createScript(t, { authorId: "author_1", visibility: "private" });
    await createScript(t, { authorId: "author_1", visibility: "jahrgang", authorKurs: "TIF25B" });
    await createScript(t, { authorId: "viewer_1", visibility: "private" });

    const visible = await t.withIdentity(identity("viewer_1")).query(api.scripts.listVisible, {});

    // sichtbar: das öffentliche Skript von author_1 + das eigene private Skript
    expect(visible).toHaveLength(2);
    const visibilities = visible.map((s: any) => s.visibility).sort();
    expect(visibilities).toEqual(["private", "public"]);
  });
});
