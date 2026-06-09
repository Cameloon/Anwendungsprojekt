import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ensureLectureForumsForProfile } from "./semesterLectures";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureAllgemeinForum(ctx: any, jahrgang: string, userId: string, displayName: string) {
  const jg = jahrgang.toUpperCase();

  const existing = await ctx.db
    .query("forums")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((q: any) => q.eq(q.field("name"), "Allgemein"))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((q: any) => q.eq(q.field("jahrgang"), jg))
    .first();

  if (existing) {
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

  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const forumId = await ctx.db.insert("forums", {
    name: "Allgemein",
    description: `Allgemeiner Austausch für Jahrgang ${jg}`,
    visibility: "public",
    inviteCode: code,
    jahrgang: jg,
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
      profile.jahrgang
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
      profile.jahrgang
    );
    if (!hasFields) return "incomplete";
    if (profile.status === "active") return "active";
    if (profile.status === "pending") return "pending";
    if (profile.status === "rejected") return "rejected";
    return "incomplete";
  },
});

export const listSameJahrgang = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!myProfile?.jahrgang) return [];

    const all = await ctx.db.query("profiles").collect();
    return all
      .filter(
        (p) =>
          p.jahrgang === myProfile.jahrgang &&
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
    jahrgang: v.optional(v.string()),
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
      jahrgang: args.jahrgang ? args.jahrgang.toUpperCase() : args.jahrgang,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      if (args.jahrgang) {
        const displayName =
          args.displayName ||
          existing.displayName ||
          identity.name ||
          identity.email ||
          "Unbekannt";
        await ensureAllgemeinForum(ctx, args.jahrgang, identity.subject, displayName);
        await ensureLectureForumsForProfile(ctx, args.jahrgang, identity.subject, displayName);
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
      jahrgang: args.jahrgang?.toUpperCase(),
      createdAt: now,
      updatedAt: now,
    });

    if (args.jahrgang) {
      const displayName =
        args.displayName ||
        identity.name ||
        identity.email ||
        "Unbekannt";
      await ensureAllgemeinForum(ctx, args.jahrgang, identity.subject, displayName);
      await ensureLectureForumsForProfile(ctx, args.jahrgang, identity.subject, displayName);
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
    jahrgang: v.string(),
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
      jahrgang: args.jahrgang.trim().toUpperCase(),
      role: "user" as const,
      status: "pending" as const,
      updatedAt: now,
    };

    const displayName = args.displayName.trim();

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      await ensureAllgemeinForum(ctx, args.jahrgang, identity.subject, displayName);
      await ensureLectureForumsForProfile(ctx, args.jahrgang, identity.subject, displayName);
      return existing._id;
    }
    const newId = await ctx.db.insert("profiles", {
      userId: identity.subject,
      email: identity.email ?? undefined,
      ...patch,
      createdAt: now,
    });
    await ensureAllgemeinForum(ctx, args.jahrgang, identity.subject, displayName);
    await ensureLectureForumsForProfile(ctx, args.jahrgang, identity.subject, displayName);
    return newId;
  },
});