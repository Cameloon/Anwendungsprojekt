import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ensureLectureForumsForProfile } from "./semesterLectures";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureAllgemeinForum(ctx: any, kurs: string, userId: string, displayName: string) {
  const jg = kurs.toUpperCase();

  const existing = await ctx.db
    .query("forums")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((q: any) => q.eq(q.field("name"), "Allgemein"))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((q: any) => q.eq(q.field("kurs"), jg))
    .first();

  if (existing) {
    if (!existing.sectionId) {
      const kursSection = await ctx.db
        .query("sections")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((q: any) => q.eq(q.field("name"), "Dein Jahrgang"))
        .first();
      if (kursSection) {
        await ctx.db.patch(existing._id, { sectionId: kursSection._id });
      }
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
    return;
  }

  const kursSection = await ctx.db
    .query("sections")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((q: any) => q.eq(q.field("name"), "Dein Jahrgang"))
    .first();

  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const forumId = await ctx.db.insert("forums", {
    name: "Allgemein",
    description: `Allgemeiner Austausch für Kurs ${jg}`,
    visibility: "public",
    inviteCode: code,
    kurs: jg,
    sectionId: kursSection?._id,
    createdAt: Date.now(),
  });

  await ctx.db.insert("forumMembers", {
    forumId,
    userId,
    displayName,
    joinedAt: Date.now(),
  });
}

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    return profile;
  },
});

export const isComplete = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!profile) return false;
    return !!(
      profile.displayName &&
      profile.studienfach &&
      profile.matrikelnummer &&
      profile.hochschule &&
      profile.kurs
    );
  },
});

export const getAccessStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return "no-identity";
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!profile) return "no-profile";
    if (profile.role === "admin") return "active";
    const hasFields = !!(
      profile.displayName &&
      profile.studienfach &&
      profile.matrikelnummer &&
      profile.hochschule &&
      profile.kurs
    );
    if (profile.status === "banned") return "banned";
    if (!hasFields) return "incomplete";
    if (profile.status === "active") return "active";
    if (profile.status === "pending") return "pending";
    if (profile.status === "rejected") return "rejected";
    return "incomplete";
  },
});

export const listSameKurs = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!myProfile?.kurs) return [];

    const all = await ctx.db.query("profiles").collect();
    return all
      .filter(
        (p) =>
          p.kurs === myProfile.kurs &&
          p.userId !== identity.subject &&
          p.displayName,
      )
      .map((p) => ({
        userId: p.userId,
        displayName: p.displayName as string,
      }));
  },
});

export const upsertMine = mutation({
  args: {
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    studienfach: v.optional(v.string()),
    matrikelnummer: v.optional(v.string()),
    hochschule: v.optional(v.string()),
    kurs: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("user"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    const now = Date.now();
    const patch = {
      ...args,
      kurs: args.kurs ? args.kurs.toUpperCase() : args.kurs,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      if (args.kurs) {
        const displayName =
          args.displayName ||
          existing.displayName ||
          identity.name ||
          identity.email ||
          "Unbekannt";
        await ensureAllgemeinForum(ctx, args.kurs, identity.subject, displayName);
        await ensureLectureForumsForProfile(ctx, args.kurs, identity.subject, displayName);
      }
      return existing._id;
    }

    const newId = await ctx.db.insert("profiles", {
      userId: identity.subject,
      email: args.email ?? identity.email ?? undefined,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      studienfach: args.studienfach,
      matrikelnummer: args.matrikelnummer,
      hochschule: args.hochschule,
      kurs: args.kurs?.toUpperCase(),
      createdAt: now,
      updatedAt: now,
    });

    if (args.kurs) {
      const displayName =
        args.displayName ||
        identity.name ||
        identity.email ||
        "Unbekannt";
      await ensureAllgemeinForum(ctx, args.kurs, identity.subject, displayName);
      await ensureLectureForumsForProfile(ctx, args.kurs, identity.subject, displayName);
    }

    return newId;
  },
});

export const complete = mutation({
  args: {
    displayName: v.string(),
    studienfach: v.string(),
    matrikelnummer: v.string(),
    hochschule: v.string(),
    kurs: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    const now = Date.now();
    const patch = {
      displayName: args.displayName.trim(),
      studienfach: args.studienfach.trim(),
      matrikelnummer: args.matrikelnummer.trim(),
      hochschule: args.hochschule.trim(),
      kurs: args.kurs.trim().toUpperCase(),
      role: "user" as const,
      /* status: "pending" as const, */
      status: "active" as const,
      updatedAt: now,
    };

    const displayName = args.displayName.trim();

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      await ensureAllgemeinForum(ctx, args.kurs, identity.subject, displayName);
      await ensureLectureForumsForProfile(ctx, args.kurs, identity.subject, displayName);
      return existing._id;
    }
    const newId = await ctx.db.insert("profiles", {
      userId: identity.subject,
      email: identity.email ?? undefined,
      ...patch,
      createdAt: now,
    });
    await ensureAllgemeinForum(ctx, args.kurs, identity.subject, displayName);
    await ensureLectureForumsForProfile(ctx, args.kurs, identity.subject, displayName);
    return newId;
  },
});