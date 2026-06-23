import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const categoryValidator = v.union(
  v.literal("bug"),
  v.literal("idee"),
  v.literal("lob"),
  v.literal("sonstiges")
);

export const submit = mutation({
  args: {
    rating: v.number(),
    category: categoryValidator,
    message: v.string(),
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
        category: args.category,
        message: args.message,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("feedback", {
        userId,
        rating: args.rating,
        category: args.category,
        message: args.message,
        updatedAt: now,
      });
    }
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
