import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submit = mutation({
  args: {
    rating: v.number(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Nicht authentifiziert");

    const userId = identity.tokenIdentifier;
    const now = Date.now();

    const existing = await ctx.db
      .query("feedback")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        rating: args.rating,
        message: args.message,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("feedback", {
        userId,
        rating: args.rating,
        message: args.message,
        updatedAt: now,
      });
    }
  },
});

export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const caller = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (caller?.role !== "admin") throw new Error("Not authorized");

    const allFeedback = await ctx.db.query("feedback").take(10000);
    const allReports = await ctx.db.query("userReports").take(10000);
    const totalUsers = (await ctx.db.query("profiles").take(10000)).length;

    const byRating: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const entry of allFeedback) {
      if (entry.rating in byRating) byRating[entry.rating]++;
    }

    const byReportType = { bug: 0, feature: 0 };
    for (const r of allReports) {
      if (!r.status || r.status === "open") byReportType[r.type]++;
    }

    return {
      total: allFeedback.length,
      totalUsers,
      byRating,
      reports: {
        total: allReports.length,
        byType: byReportType,
      },
    };
  },
});

export const getMyFeedback = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userId = identity.tokenIdentifier;
    return await ctx.db
      .query("feedback")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});
