import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submit = mutation({
  args: {
    postId: v.string(),
    postTitle: v.string(),
    forumName: v.string(),
    reason: v.string(),
    reportedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Nicht authentifiziert");

    await ctx.db.insert("postReports", {
      postId: args.postId,
      postTitle: args.postTitle,
      forumName: args.forumName,
      reason: args.reason,
      reportedBy: args.reportedBy,
      reporterUserId: identity.tokenIdentifier,
      status: "offen",
      createdAt: Date.now(),
    });
  },
});

export const getAdminReports = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Nicht authentifiziert");
    const caller = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (caller?.role !== "admin") throw new Error("Nicht autorisiert");

    const reports = await ctx.db.query("postReports").order("desc").take(200);
    return await Promise.all(
      reports.map(async (report) => {
        const postId = ctx.db.normalizeId("posts", report.postId);
        const post = postId ? await ctx.db.get(postId) : null;
        return {
          ...report,
          authorId: post?.authorId,
          authorName: post?.authorName,
        };
      })
    );
  },
});

export const markDone = mutation({
  args: { id: v.id("postReports") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Nicht authentifiziert");
    const caller = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (caller?.role !== "admin") throw new Error("Nicht autorisiert");

    await ctx.db.patch(args.id, { status: "erledigt" });
  },
});
