// @vitest-environment edge-runtime
//
// Regressionstests: Annahme eines Termins (public/eingeladen) über die drei
// unabhängigen Wege — deadlines.acceptDeadline, deadlines.toggleDone und
// notifications.accept — darf niemals mehr als eine eigene Kopie erzeugen,
// egal in welcher Reihenfolge oder Kombination die Wege genutzt werden.
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
    category?: "abgabe" | "pruefung" | "sonstiges";
    date?: string;
  },
) {
  const now = Date.now();
  return await t.run(async (ctx: any) =>
    ctx.db.insert("deadlines", {
      title: "Testtermin",
      date: overrides.date ?? "2026-12-31",
      category: overrides.category ?? "abgabe",
      done: false,
      visibility: overrides.visibility,
      invitees: overrides.invitees,
      ownerId: overrides.ownerId,
      createdAt: now,
      updatedAt: now,
    }),
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createPendingInvite(t: any, deadlineId: any, recipientId: string) {
  return await t.run(async (ctx: any) =>
    ctx.db.insert("notifications", {
      type: "deadline_invite",
      recipientId,
      recipientName: recipientId,
      fromId: "owner_1",
      fromName: "owner_1",
      title: "Testtermin",
      deadlineId,
      status: "pending",
      createdAt: Date.now(),
    }),
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ownCopiesOf(t: any, userId: string) {
  return await t.run(async (ctx: any) =>
    ctx.db
      .query("deadlines")
      .filter((q: any) => q.eq(q.field("ownerId"), userId))
      .filter((q: any) => q.eq(q.field("title"), "Testtermin"))
      .collect(),
  );
}

describe("Termin annehmen — nur eine eigene Kopie, egal über welchen Weg", () => {
  test("acceptDeadline zweimal hintereinander erzeugt nur eine Kopie", async () => {
    const t = convexTest(schema);
    await createProfile(t, "owner_1");
    await createProfile(t, "invited_1");
    const deadlineId = await createDeadline(t, {
      ownerId: "owner_1",
      visibility: "public",
      invitees: ["invited_1"],
    });

    await t
      .withIdentity(identity("invited_1"))
      .mutation(api.deadlines.acceptDeadline, { deadlineId });

    // Zweiter Aufruf (z. B. Doppelklick, bevor die UI den neuen Zustand sieht):
    // invited_1 wurde beim ersten Annehmen bereits aus invitees entfernt, der
    // zweite Aufruf schlägt also fehl statt eine weitere Kopie anzulegen.
    await expect(
      t.withIdentity(identity("invited_1")).mutation(api.deadlines.acceptDeadline, { deadlineId }),
    ).rejects.toThrow(/Nicht eingeladen/);

    expect(await ownCopiesOf(t, "invited_1")).toHaveLength(1);
  });

  test("toggleDone auf noch nicht angenommenen Termin legt Kopie an und markiert Einladung als angenommen", async () => {
    const t = convexTest(schema);
    await createProfile(t, "owner_1");
    await createProfile(t, "invited_1");
    const deadlineId = await createDeadline(t, {
      ownerId: "owner_1",
      visibility: "public",
      invitees: ["invited_1"],
    });
    const notifId = await createPendingInvite(t, deadlineId, "invited_1");

    await t
      .withIdentity(identity("invited_1"))
      .mutation(api.deadlines.toggleDone, { deadlineId });

    const copies = await ownCopiesOf(t, "invited_1");
    expect(copies).toHaveLength(1);
    expect(copies[0].done).toBe(true);

    const notif = await t.run(async (ctx: any) => ctx.db.get(notifId));
    expect(notif?.status).toBe("accepted");
  });

  test("toggleDone gefolgt von notifications.accept erzeugt keine zweite Kopie", async () => {
    const t = convexTest(schema);
    await createProfile(t, "owner_1");
    await createProfile(t, "invited_1");
    const deadlineId = await createDeadline(t, {
      ownerId: "owner_1",
      visibility: "public",
      invitees: ["invited_1"],
    });
    const notifId = await createPendingInvite(t, deadlineId, "invited_1");

    await t
      .withIdentity(identity("invited_1"))
      .mutation(api.deadlines.toggleDone, { deadlineId });

    // Notification wäre durch toggleDone bereits auf "accepted" gesetzt — falls
    // eine UI sie trotzdem noch einmal "annimmt" (Doppelklick, alter Zustand im
    // Client), darf keine zweite Kopie entstehen.
    await t
      .withIdentity(identity("invited_1"))
      .mutation(api.notifications.accept, { notificationId: notifId });

    expect(await ownCopiesOf(t, "invited_1")).toHaveLength(1);
  });

  test("notifications.accept gefolgt von acceptDeadline erzeugt keine zweite Kopie", async () => {
    const t = convexTest(schema);
    await createProfile(t, "owner_1");
    await createProfile(t, "invited_1");
    const deadlineId = await createDeadline(t, {
      ownerId: "owner_1",
      visibility: "public",
      invitees: ["invited_1"],
    });
    const notifId = await createPendingInvite(t, deadlineId, "invited_1");

    await t
      .withIdentity(identity("invited_1"))
      .mutation(api.notifications.accept, { notificationId: notifId });

    // invited_1 wurde bereits über die Notification entfernt — ein späterer
    // Aufruf über den Planner-Button schlägt fehl statt zu duplizieren.
    await expect(
      t.withIdentity(identity("invited_1")).mutation(api.deadlines.acceptDeadline, { deadlineId }),
    ).rejects.toThrow(/Nicht eingeladen/);

    expect(await ownCopiesOf(t, "invited_1")).toHaveLength(1);
  });

  test("gleicher Titel/Datum aber andere category gilt nicht als Duplikat", async () => {
    const t = convexTest(schema);
    await createProfile(t, "owner_1");
    await createProfile(t, "invited_1");
    const abgabeId = await createDeadline(t, {
      ownerId: "owner_1",
      visibility: "public",
      invitees: ["invited_1"],
      category: "abgabe",
    });
    const pruefungId = await createDeadline(t, {
      ownerId: "owner_1",
      visibility: "public",
      invitees: ["invited_1"],
      category: "pruefung",
    });

    await t
      .withIdentity(identity("invited_1"))
      .mutation(api.deadlines.acceptDeadline, { deadlineId: abgabeId });
    await t
      .withIdentity(identity("invited_1"))
      .mutation(api.deadlines.acceptDeadline, { deadlineId: pruefungId });

    expect(await ownCopiesOf(t, "invited_1")).toHaveLength(2);
  });
});
