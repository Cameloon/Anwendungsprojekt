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

export const upsertMine = mutation({
  args: {
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    studienfach: v.optional(v.string()),
    matrikelnummer: v.optional(v.string()),
    hochschule: v.optional(v.string()),
    jahrgang: v.optional(v.string()),
    email: v.optional(v.string()),
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