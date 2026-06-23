import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submit = mutation({
  args: {
    type: v.union(v.literal("bug"), v.literal("feature")),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Nicht authentifiziert");

    await ctx.db.insert("userReports", {
      userId: identity.tokenIdentifier,
      type: args.type,
      message: args.message,
      status: "open",
      createdAt: Date.now(),
    });
  },
});

export const getAdminReports = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const caller = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (caller?.role !== "admin") throw new Error("Not authorized");

    return await ctx.db.query("userReports").order("desc").take(500);
  },
});

export const markDone = mutation({
  args: { id: v.id("userReports") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const caller = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (caller?.role !== "admin") throw new Error("Not authorized");

    await ctx.db.patch(args.id, { status: "done" });
  },
});
