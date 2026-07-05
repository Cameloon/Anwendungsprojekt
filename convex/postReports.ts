import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { logModeration } from "./moderationLog";

export const submit = mutation({
  args: {
    postId: v.string(),
    postTitle: v.string(),
    forumName: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Nicht authentifiziert");

    const normalizedPostId = ctx.db.normalizeId("posts", args.postId);
    const post = normalizedPostId ? await ctx.db.get(normalizedPostId) : null;
    if (!post) throw new Error("Beitrag nicht gefunden");

    const existing = await ctx.db
      .query("postReports")
      .filter((q) =>
        q.and(
          q.eq(q.field("postId"), args.postId),
          q.eq(q.field("reporterUserId"), identity.tokenIdentifier),
          q.eq(q.field("status"), "offen")
        )
      )
      .first();
    if (existing) throw new Error("Du hast diesen Beitrag bereits gemeldet.");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    const reportedBy = profile?.displayName || identity.name || identity.email || "Unbekannt";

    await ctx.db.insert("postReports", {
      postId: args.postId,
      postTitle: args.postTitle,
      forumName: args.forumName,
      reason: args.reason,
      reportedBy,
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
        const normalizedPostId = ctx.db.normalizeId("posts", report.postId);
        const post = normalizedPostId ? await ctx.db.get(normalizedPostId) : null;
        let commentId = null;
        if (report.reason.includes("Kommentar")) {
          const match = report.reason.match(/\[ID: ([^\]]+)\]/);
          if (match) {
            const normalized = ctx.db.normalizeId("postComments", match[1]);
            commentId = normalized;
          }
        }
        return {
          ...report,
          authorId: post?.authorId,
          authorName: post?.authorName,
          normalizedPostId,
          commentId,
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

    const report = await ctx.db.get(args.id);
    await ctx.db.patch(args.id, { status: "erledigt" });
    await logModeration(ctx, caller.userId, caller.displayName || "Admin", {
      action: "dismiss_report",
      reportId: args.id,
      details: report ? `Meldung "${report.postTitle}" im Forum "${report.forumName}" als erledigt markiert` : undefined,
    });
  },
});

export const reopen = mutation({
  args: { id: v.id("postReports") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Nicht authentifiziert");
    const caller = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (caller?.role !== "admin") throw new Error("Nicht autorisiert");

    const report = await ctx.db.get(args.id);
    await ctx.db.patch(args.id, { status: "offen" });
    await logModeration(ctx, caller.userId, caller.displayName || "Admin", {
      action: "reopen_report",
      reportId: args.id,
      details: report ? `Meldung "${report.postTitle}" im Forum "${report.forumName}" wieder geöffnet` : undefined,
    });
  },
});
