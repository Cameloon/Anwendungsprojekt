// @vitest-environment edge-runtime
//
// Regressionstests für die admin-only Mutations/Queries in admin.ts und
// postReports.ts. Diese Funktionen sind die kritischste Autorisierungsfläche
// im Projekt (Nutzerfreischaltung, Rollenvergabe, Moderationswarteschlange)
// und hatten bisher keine automatisierten Tests (siehe Rückblick_und_Ausblick.md).
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import { createProfile, identity } from "./helpers";

describe("admin.approveUser — nur für Admins", () => {
  test("Admin kann einen ausstehenden Nutzer freischalten", async () => {
    const t = convexTest(schema);
    await createProfile(t, "admin_1", { role: "admin" });
    await t.run(async (ctx: any) =>
      ctx.db.insert("profiles", {
        userId: "pending_1",
        role: "user",
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );

    await t.withIdentity(identity("admin_1")).mutation(api.admin.approveUser, { userId: "pending_1" });

    const profile = await t.run(async (ctx: any) =>
      ctx.db
        .query("profiles")
        .withIndex("by_user", (q: any) => q.eq("userId", "pending_1"))
        .unique(),
    );
    expect(profile?.status).toBe("active");
  });

  test("Nicht-Admin darf Nutzer NICHT freischalten", async () => {
    const t = convexTest(schema);
    await createProfile(t, "user_1", { role: "user" });
    await t.run(async (ctx: any) =>
      ctx.db.insert("profiles", {
        userId: "pending_1",
        role: "user",
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );

    await expect(
      t.withIdentity(identity("user_1")).mutation(api.admin.approveUser, { userId: "pending_1" }),
    ).rejects.toThrow(/Not authorized/);
  });
});

describe("admin.rejectUser — nur für Admins", () => {
  test("Admin kann einen ausstehenden Nutzer ablehnen", async () => {
    const t = convexTest(schema);
    await createProfile(t, "admin_1", { role: "admin" });
    await t.run(async (ctx: any) =>
      ctx.db.insert("profiles", {
        userId: "pending_1",
        role: "user",
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );

    await t.withIdentity(identity("admin_1")).mutation(api.admin.rejectUser, { userId: "pending_1" });

    const profile = await t.run(async (ctx: any) =>
      ctx.db
        .query("profiles")
        .withIndex("by_user", (q: any) => q.eq("userId", "pending_1"))
        .unique(),
    );
    expect(profile?.status).toBe("rejected");
  });

  test("Nicht-Admin darf Nutzer NICHT ablehnen", async () => {
    const t = convexTest(schema);
    await createProfile(t, "user_1", { role: "user" });
    await t.run(async (ctx: any) =>
      ctx.db.insert("profiles", {
        userId: "pending_1",
        role: "user",
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );

    await expect(
      t.withIdentity(identity("user_1")).mutation(api.admin.rejectUser, { userId: "pending_1" }),
    ).rejects.toThrow(/Not authorized/);
  });
});

describe("admin.updateRole — nur für Admins", () => {
  test("Admin kann die Rolle eines Nutzers ändern", async () => {
    const t = convexTest(schema);
    await createProfile(t, "admin_1", { role: "admin" });
    await createProfile(t, "user_1", { role: "user" });

    await t.withIdentity(identity("admin_1")).mutation(api.admin.updateRole, {
      userId: "user_1",
      role: "admin",
    });

    const profile = await t.run(async (ctx: any) =>
      ctx.db
        .query("profiles")
        .withIndex("by_user", (q: any) => q.eq("userId", "user_1"))
        .unique(),
    );
    expect(profile?.role).toBe("admin");
  });

  test("Nicht-Admin darf Rollen NICHT ändern (auch nicht die eigene)", async () => {
    const t = convexTest(schema);
    await createProfile(t, "user_1", { role: "user" });

    await expect(
      t.withIdentity(identity("user_1")).mutation(api.admin.updateRole, {
        userId: "user_1",
        role: "admin",
      }),
    ).rejects.toThrow(/Not authorized/);
  });
});

describe("postReports.getAdminReports — nur für Admins sichtbar (BUG-009)", () => {
  async function seedReport(t: any) {
    await t.run(async (ctx: any) =>
      ctx.db.insert("postReports", {
        postId: "post_1",
        postTitle: "Gemeldeter Beitrag",
        forumName: "Testforum",
        reason: "Spam",
        reportedBy: "Meldender Nutzer",
        reporterUserId: "reporter_1",
        status: "offen",
        createdAt: Date.now(),
      }),
    );
  }

  test("Admin sieht gemeldete Beiträge", async () => {
    const t = convexTest(schema);
    await createProfile(t, "admin_1", { role: "admin" });
    await seedReport(t);

    const reports = await t.withIdentity(identity("admin_1")).query(api.postReports.getAdminReports, {});
    expect(reports).toHaveLength(1);
    expect(reports[0].postTitle).toBe("Gemeldeter Beitrag");
  });

  test("Nicht-Admin darf gemeldete Beiträge NICHT abrufen", async () => {
    const t = convexTest(schema);
    await createProfile(t, "user_1", { role: "user" });
    await seedReport(t);

    await expect(
      t.withIdentity(identity("user_1")).query(api.postReports.getAdminReports, {}),
    ).rejects.toThrow(/Nicht autorisiert/);
  });
});
