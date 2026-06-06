import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
      return existing._id;
    }
    return await ctx.db.insert("profiles", {
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

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return await ctx.db.insert("profiles", {
      userId: identity.subject,
      email: identity.email ?? undefined,
      ...patch,
      createdAt: now,
    });
  },
});