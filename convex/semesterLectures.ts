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

// ─── Internal helper (used by profiles.ts and by the exported mutation) ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ensureLectureForumsForProfile(ctx: any, jahrgang: string, userId: string, displayName: string) {
  const jg = jahrgang.toUpperCase().trim();
  let parsed: { kurs: string; entryYear: number };
  try {
    parsed = parseJahrgang(jg);
  } catch {
    return;
  }

  const semester = calculateCurrentSemester(parsed.entryYear);

  const lectures = await ctx.db
    .query("semesterLectures")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_kurs_semester", (q: any) =>
      q.eq("kurs", parsed.kurs).eq("semesterNumber", semester),
    )
    .collect();

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
      if (existing.ownerId) {
        await ctx.db.patch(existing._id, { ownerId: undefined });
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
        description: `${lecture.lectureName} – Semester ${semester} (${jg})`,
        visibility: "public",
        jahrgang: jg,
        vorlesung: lecture.lectureName,
        inviteCode: code,
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
