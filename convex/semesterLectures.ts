import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Pure helpers ───

export function parseJahrgang(jahrgang: string): { kurs: string; entryYear: number; classLetter: string } {
  const jg = jahrgang.toUpperCase().trim();
  const match = jg.match(/^([A-Z]+)(\d{2})([A-Z])$/);
  if (!match) throw new Error(`Invalid jahrgang format: ${jahrgang}`);
  return {
    kurs: match[1],
    entryYear: 2000 + parseInt(match[2], 10),
    classLetter: match[3],
  };
}

/** Compute which semester the user is in based on their entry year (WS starts October). */
export function calculateCurrentSemester(entryYear: number): number {
  const now = new Date();
  const totalMonths = (now.getFullYear() - entryYear) * 12 + (now.getMonth() + 1 - 10);
  if (totalMonths < 0) return 1;
  return Math.floor(totalMonths / 6) + 1;
}

// ─── Internal helpers (used by profiles.ts and by the exported mutation) ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureSeedData(ctx: any, kurs: string) {
  const existing = await ctx.db
    .query("semesterLectures")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_kurs_semester", (q: any) => q.eq("kurs", kurs))
    .collect();
  if (existing.length > 0) return;
  const now = Date.now();
  for (const item of SEED_DATA) {
    if (item.kurs !== kurs) continue;
    await ctx.db.insert("semesterLectures", { ...item, createdAt: now });
  }
}

/** Explicit mapping: populate jahrgangLectures table for a jahrgang (all semesters). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ensureJahrgangLectures(ctx: any, jahrgang: string) {
  const jg = jahrgang.toUpperCase().trim();
  let parsed: { kurs: string };
  try {
    parsed = parseJahrgang(jg);
  } catch {
    return;
  }

  const existing = await ctx.db
    .query("jahrgangLectures")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_jahrgang", (q: any) => q.eq("jahrgang", jg))
    .collect();
  if (existing.length > 0) return;

  const now = Date.now();
  for (const item of SEED_DATA) {
    if (item.kurs !== parsed.kurs) continue;
    await ctx.db.insert("jahrgangLectures", {
      jahrgang: jg,
      lectureName: item.lectureName,
      semesterNumber: item.semesterNumber,
      createdAt: now,
    });
  }
}

/** Create or patch lecture forums for ONE jahrgang (all semesters). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ensureLectureForumsForProfile(ctx: any, jahrgang: string, userId: string, displayName: string) {
  const jg = jahrgang.toUpperCase().trim();
  let parsed: { kurs: string };
  try {
    parsed = parseJahrgang(jg);
  } catch {
    return;
  }

  await ensureSeedData(ctx, parsed.kurs);
  await ensureJahrgangLectures(ctx, jg);

  const lectures = await ctx.db
    .query("jahrgangLectures")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_jahrgang", (q: any) => q.eq("jahrgang", jg))
    .collect();

  const allgemeinSection = await ctx.db
    .query("sections")
    .filter((q: any) => q.eq(q.field("name"), "Dein Jahrgang"))
    .first();

  let allgemeinSectionId = allgemeinSection?._id;
  if (!allgemeinSectionId) {
    const now = Date.now();
    allgemeinSectionId = await ctx.db.insert("sections", {
      name: "Dein Jahrgang",
      description: "Jahrgangsspezifische Foren (Allgemein, Vorlesungen, Gruppen)",
      accessRule: "all",
      displayOrder: 1,
      createdAt: now,
    });
  }

  for (const lecture of lectures) {
    const lectureName = lecture.lectureName;
    const forumName = `${lectureName} (${jg})`;
    const existing = await ctx.db
      .query("forums")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((q: any) => q.eq(q.field("name"), forumName))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((q: any) => q.eq(q.field("jahrgang"), jg))
      .first();

    if (existing) {
      if (existing.ownerId) {
        await ctx.db.patch(existing._id, { ownerId: undefined });
      }
      const patchFields: Record<string, unknown> = {};
      if (!existing.isLectureForum) {
        patchFields.isLectureForum = true;
        patchFields.semesterNumber = lecture.semesterNumber;
      }
      if (!existing.sectionId) {
        patchFields.sectionId = allgemeinSectionId;
      }
      if (Object.keys(patchFields).length > 0) {
        await ctx.db.patch(existing._id, patchFields);
      }
      const isMember = await ctx.db
        .query("forumMembers")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .withIndex("by_forum_user", (q: any) =>
          q.eq("forumId", existing._id).eq("userId", userId),
        )
        .unique();
      if (!isMember) {
        await ctx.db.insert("forumMembers", {
          forumId: existing._id,
          userId,
          displayName,
          joinedAt: Date.now(),
        });
      }
    } else {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const forumId = await ctx.db.insert("forums", {
        name: forumName,
        description: `${lectureName} – Semester ${lecture.semesterNumber} (${jg})`,
        visibility: "public",
        jahrgang: jg,
        vorlesung: lectureName,
        inviteCode: code,
        isLectureForum: true,
        semesterNumber: lecture.semesterNumber,
        sectionId: allgemeinSectionId,
        createdAt: Date.now(),
      });
      await ctx.db.insert("forumMembers", {
        forumId,
        userId,
        displayName,
        joinedAt: Date.now(),
      });
    }
  }
}

// ─── Queries ───

export const list = query({
  args: { kurs: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    if (args.kurs) {
      return await ctx.db
        .query("semesterLectures")
        .withIndex("by_kurs_semester", (q) => q.eq("kurs", args.kurs!))
        .collect();
    }
    return await ctx.db.query("semesterLectures").collect();
  },
});

export const getLecturesForMyJahrgang = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!profile?.jahrgang) return [];

    let parsed: { kurs: string; entryYear: number };
    try {
      parsed = parseJahrgang(profile.jahrgang);
    } catch {
      return [];
    }

    const semester = calculateCurrentSemester(parsed.entryYear);

    return await ctx.db
      .query("semesterLectures")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_kurs_semester", (q: any) =>
        q.eq("kurs", parsed.kurs).eq("semesterNumber", semester),
      )
      .collect();
  },
});

// ─── Mutations ───

export const manage = mutation({
  args: {
    id: v.optional(v.id("semesterLectures")),
    kurs: v.string(),
    semesterNumber: v.number(),
    lectureName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const caller = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (caller?.role !== "admin") throw new Error("Not authorized");

    const now = Date.now();

    if (args.id) {
      await ctx.db.patch(args.id, {
        kurs: args.kurs.trim(),
        semesterNumber: args.semesterNumber,
        lectureName: args.lectureName.trim(),
        createdAt: now,
      });
      return args.id;
    }

    return await ctx.db.insert("semesterLectures", {
      kurs: args.kurs.trim(),
      semesterNumber: args.semesterNumber,
      lectureName: args.lectureName.trim(),
      createdAt: now,
    });
  },
});

export const deleteLecture = mutation({
  args: { id: v.id("semesterLectures") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const caller = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (caller?.role !== "admin") throw new Error("Not authorized");

    await ctx.db.delete(args.id);
  },
});

export const ensureLectureForums = mutation({
  args: { jahrgang: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    const displayName = profile?.displayName || identity.name || identity.email || "Unbekannt";

    await ensureLectureForumsForProfile(ctx, args.jahrgang, identity.subject, displayName);
  },
});

/** Seed jahrgangLectures + lecture forums for ALL existing jahrgangs. Idempotent — safe to call on every page load. */
export const seedAllJahrgangForums = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profiles = await ctx.db.query("profiles").collect();
    const jahrgaenge = [...new Set(profiles.map((p) => p.jahrgang).filter(Boolean))] as string[];

    let created = 0;
    for (const jg of jahrgaenge) {
      await ensureJahrgangLectures(ctx, jg);
      const lectures = await ctx.db
        .query("jahrgangLectures")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .withIndex("by_jahrgang", (q: any) => q.eq("jahrgang", jg))
        .collect();

      // Ensure "Dein Jahrgang" section exists
      const allgemeinSection = await ctx.db
        .query("sections")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((q: any) => q.eq(q.field("name"), "Dein Jahrgang"))
        .first();
      let sectionId = allgemeinSection?._id;
      if (!sectionId) {
        const now = Date.now();
        sectionId = await ctx.db.insert("sections", {
          name: "Dein Jahrgang",
          description: "Jahrgangsspezifische Foren (Allgemein, Vorlesungen, Gruppen)",
          accessRule: "all",
          displayOrder: 1,
          createdAt: now,
        });
      }

      // Create lecture forums for ALL semesters
      for (const lecture of lectures) {
        const forumName = `${lecture.lectureName} (${jg})`;
        const existing = await ctx.db
          .query("forums")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((q: any) => q.eq(q.field("name"), forumName))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((q: any) => q.eq(q.field("jahrgang"), jg))
          .first();
        if (existing) {
          if (!existing.sectionId && sectionId) {
            await ctx.db.patch(existing._id, { sectionId });
          }
          continue;
        }
        const code = Math.random().toString(36).slice(2, 8).toUpperCase();
        await ctx.db.insert("forums", {
          name: forumName,
          description: `${lecture.lectureName} – Semester ${lecture.semesterNumber} (${jg})`,
          visibility: "public",
          jahrgang: jg,
          vorlesung: lecture.lectureName,
          inviteCode: code,
          isLectureForum: true,
          semesterNumber: lecture.semesterNumber,
          sectionId,
          createdAt: Date.now(),
        });
        created++;
      }

      // Ensure "Allgemein" forum for this jahrgang
      const allgName = "Allgemein";
      const allgExisting = await ctx.db
        .query("forums")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((q: any) => q.eq(q.field("name"), allgName))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((q: any) => q.eq(q.field("jahrgang"), jg))
        .first();
      if (!allgExisting) {
        const code = Math.random().toString(36).slice(2, 8).toUpperCase();
        await ctx.db.insert("forums", {
          name: allgName,
          description: `Allgemeiner Austausch für Jahrgang ${jg}`,
          visibility: "public",
          jahrgang: jg,
          inviteCode: code,
          sectionId,
          createdAt: Date.now(),
        });
        created++;
      } else if (!allgExisting.sectionId && sectionId) {
        await ctx.db.patch(allgExisting._id, { sectionId });
      }
    }

    return { created, jahrgaenge: jahrgaenge.length };
  },
});

const SEED_DATA: { kurs: string; semesterNumber: number; lectureName: string }[] = [
  // INF
  { kurs: "INF", semesterNumber: 1, lectureName: "Mathematik 1" },
  { kurs: "INF", semesterNumber: 1, lectureName: "Programmierung 1" },
  { kurs: "INF", semesterNumber: 1, lectureName: "Theoretische Informatik 1" },
  { kurs: "INF", semesterNumber: 2, lectureName: "Mathematik 2" },
  { kurs: "INF", semesterNumber: 2, lectureName: "Programmierung 2" },
  { kurs: "INF", semesterNumber: 2, lectureName: "Datenbanken" },
  { kurs: "INF", semesterNumber: 3, lectureName: "Software Engineering" },
  { kurs: "INF", semesterNumber: 3, lectureName: "Webprogrammierung" },
  { kurs: "INF", semesterNumber: 3, lectureName: "Betriebssysteme" },
  { kurs: "INF", semesterNumber: 4, lectureName: "Computergrafik" },
  { kurs: "INF", semesterNumber: 4, lectureName: "Rechnernetze" },
  { kurs: "INF", semesterNumber: 4, lectureName: "IT-Sicherheit" },
  { kurs: "INF", semesterNumber: 5, lectureName: "Künstliche Intelligenz" },
  { kurs: "INF", semesterNumber: 5, lectureName: "Datenbanken 2" },
  { kurs: "INF", semesterNumber: 6, lectureName: "Verteilte Systeme" },
  { kurs: "INF", semesterNumber: 6, lectureName: "Cloud Computing" },
  { kurs: "INF", semesterNumber: 7, lectureName: "Wahlpflichtmodul A" },
  { kurs: "INF", semesterNumber: 7, lectureName: "Wahlpflichtmodul B" },
  { kurs: "INF", semesterNumber: 8, lectureName: "Bachelor-Phase" },
  // TIF
  { kurs: "TIF", semesterNumber: 1, lectureName: "Mathematik 1" },
  { kurs: "TIF", semesterNumber: 1, lectureName: "Programmierung 1" },
  { kurs: "TIF", semesterNumber: 1, lectureName: "Grundlagen der Elektrotechnik" },
  { kurs: "TIF", semesterNumber: 2, lectureName: "Mathematik 2" },
  { kurs: "TIF", semesterNumber: 2, lectureName: "Programmierung 2" },
  { kurs: "TIF", semesterNumber: 2, lectureName: "Technische Mechanik" },
  { kurs: "TIF", semesterNumber: 3, lectureName: "Software Engineering" },
  { kurs: "TIF", semesterNumber: 3, lectureName: "Regelungstechnik" },
  { kurs: "TIF", semesterNumber: 4, lectureName: "Rechnerarchitektur" },
  { kurs: "TIF", semesterNumber: 4, lectureName: "Embedded Systems" },
  { kurs: "TIF", semesterNumber: 5, lectureName: "Prozessautomatisierung" },
  { kurs: "TIF", semesterNumber: 5, lectureName: "Robotik" },
  { kurs: "TIF", semesterNumber: 6, lectureName: "IT-Sicherheit" },
  { kurs: "TIF", semesterNumber: 7, lectureName: "Wahlpflichtmodul" },
  { kurs: "TIF", semesterNumber: 8, lectureName: "Bachelor-Phase" },
  // WIF
  { kurs: "WIF", semesterNumber: 1, lectureName: "Mathematik 1" },
  { kurs: "WIF", semesterNumber: 1, lectureName: "Programmierung 1" },
  { kurs: "WIF", semesterNumber: 1, lectureName: "Grundlagen BWL" },
  { kurs: "WIF", semesterNumber: 2, lectureName: "Mathematik 2" },
  { kurs: "WIF", semesterNumber: 2, lectureName: "Datenbanken" },
  { kurs: "WIF", semesterNumber: 2, lectureName: "Rechnungswesen" },
  { kurs: "WIF", semesterNumber: 3, lectureName: "Software Engineering" },
  { kurs: "WIF", semesterNumber: 3, lectureName: "Wirtschaftsinformatik" },
  { kurs: "WIF", semesterNumber: 4, lectureName: "IT-Management" },
  { kurs: "WIF", semesterNumber: 4, lectureName: "Prozessmodellierung" },
  { kurs: "WIF", semesterNumber: 5, lectureName: "Business Intelligence" },
  { kurs: "WIF", semesterNumber: 6, lectureName: "ERP-Systeme" },
  { kurs: "WIF", semesterNumber: 7, lectureName: "Wahlpflichtmodul" },
  { kurs: "WIF", semesterNumber: 8, lectureName: "Bachelor-Phase" },
  // BWL
  { kurs: "BWL", semesterNumber: 1, lectureName: "Grundlagen BWL" },
  { kurs: "BWL", semesterNumber: 1, lectureName: "Mathematik" },
  { kurs: "BWL", semesterNumber: 1, lectureName: "VWL" },
  { kurs: "BWL", semesterNumber: 2, lectureName: "Rechnungswesen" },
  { kurs: "BWL", semesterNumber: 2, lectureName: "Marketing" },
  { kurs: "BWL", semesterNumber: 2, lectureName: "Statistik" },
  { kurs: "BWL", semesterNumber: 3, lectureName: "Finanzierung" },
  { kurs: "BWL", semesterNumber: 3, lectureName: "Personalmanagement" },
  { kurs: "BWL", semesterNumber: 4, lectureName: "Controlling" },
  { kurs: "BWL", semesterNumber: 4, lectureName: "Logistik" },
  { kurs: "BWL", semesterNumber: 5, lectureName: "Internationales Management" },
  { kurs: "BWL", semesterNumber: 6, lectureName: "Unternehmensführung" },
  { kurs: "BWL", semesterNumber: 7, lectureName: "Wahlpflichtmodul" },
  { kurs: "BWL", semesterNumber: 8, lectureName: "Bachelor-Phase" },
];

export const seedIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const caller = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (caller?.role !== "admin") throw new Error("Not authorized");

    const existing = await ctx.db.query("semesterLectures").collect();
    if (existing.length > 0) {
      return { created: 0, message: "Already seeded" };
    }

    const now = Date.now();
    let created = 0;
    for (const item of SEED_DATA) {
      await ctx.db.insert("semesterLectures", {
        kurs: item.kurs,
        semesterNumber: item.semesterNumber,
        lectureName: item.lectureName,
        createdAt: now,
      });
      created++;
    }

    return { created, message: `Seeded ${created} lectures` };
  },
});
