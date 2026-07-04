// @vitest-environment edge-runtime
//
// Regressionstests für BUG-005: Berechtigungsprüfung bei Terminen galt vorher
// nur für visibility "private". `update` (Besitzer oder Eingeladene) und
// `deleteDeadline` (nur Besitzer) müssen unabhängig von visibility gelten.
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import { createProfile, identity } from "./helpers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createDeadline(
  t: any,
  overrides: {
    ownerId: string;
    visibility: "public" | "private";
    invitees?: string[];
  },
) {
  const now = Date.now();
  return await t.run(async (ctx: any) =>
    ctx.db.insert("deadlines", {
      title: "Testtermin",
      date: "2026-12-31",
      category: "abgabe",
      done: false,
      visibility: overrides.visibility,
      invitees: overrides.invitees,
      ownerId: overrides.ownerId,
      createdAt: now,
      updatedAt: now,
    }),
  );
}

describe("deadlines.update — Berechtigung unabhängig von visibility (BUG-005)", () => {
  test("Besitzer darf eigenen (öffentlichen) Termin bearbeiten", async () => {
    const t = convexTest(schema);
    await createProfile(t, "owner_1");
    const deadlineId = await createDeadline(t, { ownerId: "owner_1", visibility: "public" });

    await t.withIdentity(identity("owner_1")).mutation(api.deadlines.update, {
      deadlineId,
      title: "Neuer Titel",
    });

    const updated = await t.run(async (ctx: any) => ctx.db.get(deadlineId));
    expect(updated?.title).toBe("Neuer Titel");
  });

  test("Eingeladener darf öffentlichen Termin bearbeiten", async () => {
    const t = convexTest(schema);
    await createProfile(t, "owner_1");
    await createProfile(t, "invited_1");
    const deadlineId = await createDeadline(t, {
      ownerId: "owner_1",
      visibility: "public",
      invitees: ["invited_1"],
    });

    await t.withIdentity(identity("invited_1")).mutation(api.deadlines.update, {
      deadlineId,
      title: "Von Eingeladenem bearbeitet",
    });

    const updated = await t.run(async (ctx: any) => ctx.db.get(deadlineId));
    expect(updated?.title).toBe("Von Eingeladenem bearbeitet");
  });

  test("Fremder Nutzer darf öffentlichen Termin NICHT bearbeiten (Regression BUG-005)", async () => {
    const t = convexTest(schema);
    await createProfile(t, "owner_1");
    await createProfile(t, "stranger_1");
    const deadlineId = await createDeadline(t, { ownerId: "owner_1", visibility: "public" });

    await expect(
      t.withIdentity(identity("stranger_1")).mutation(api.deadlines.update, {
        deadlineId,
        title: "Hack",
      }),
    ).rejects.toThrow(/Not authorized/);
  });

  test("Fremder Nutzer darf privaten Termin NICHT bearbeiten", async () => {
    const t = convexTest(schema);
    await createProfile(t, "owner_1");
    await createProfile(t, "stranger_1");
    const deadlineId = await createDeadline(t, { ownerId: "owner_1", visibility: "private" });

    await expect(
      t.withIdentity(identity("stranger_1")).mutation(api.deadlines.update, {
        deadlineId,
        title: "Hack",
      }),
    ).rejects.toThrow(/Not authorized/);
  });
});

describe("deadlines.deleteDeadline — nur Besitzer darf löschen (BUG-005)", () => {
  test("Besitzer darf eigenen Termin löschen", async () => {
    const t = convexTest(schema);
    await createProfile(t, "owner_1");
    const deadlineId = await createDeadline(t, { ownerId: "owner_1", visibility: "private" });

    await t.withIdentity(identity("owner_1")).mutation(api.deadlines.deleteDeadline, { deadlineId });

    const deleted = await t.run(async (ctx: any) => ctx.db.get(deadlineId));
    expect(deleted).toBeNull();
  });

  test("Eingeladener darf öffentlichen Termin NICHT löschen (Regression BUG-005)", async () => {
    const t = convexTest(schema);
    await createProfile(t, "owner_1");
    await createProfile(t, "invited_1");
    const deadlineId = await createDeadline(t, {
      ownerId: "owner_1",
      visibility: "public",
      invitees: ["invited_1"],
    });

    await expect(
      t.withIdentity(identity("invited_1")).mutation(api.deadlines.deleteDeadline, { deadlineId }),
    ).rejects.toThrow(/Not authorized/);
  });

  test("Fremder Nutzer darf privaten Termin eines anderen NICHT löschen", async () => {
    const t = convexTest(schema);
    await createProfile(t, "owner_1");
    await createProfile(t, "stranger_1");
    const deadlineId = await createDeadline(t, { ownerId: "owner_1", visibility: "private" });

    await expect(
      t.withIdentity(identity("stranger_1")).mutation(api.deadlines.deleteDeadline, { deadlineId }),
    ).rejects.toThrow(/Not authorized/);
  });
});
