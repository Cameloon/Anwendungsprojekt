import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export async function logModeration(
  ctx: any,
  moderatorId: string,
  moderatorName: string,
  args: {
    action: string;
    targetUserId?: string;
    targetName?: string;
    targetEmail?: string;
    postId?: any;
    reportId?: any;
    postSnapshot?: any;
    reason?: string;
    details?: string;
  }
) {
  await ctx.db.insert("moderationLog", {
    action: args.action,
    moderatorId,
    moderatorName,
    targetUserId: args.targetUserId,
    targetName: args.targetName,
    targetEmail: args.targetEmail,
    postId: args.postId,
    reportId: args.reportId,
    postSnapshot: args.postSnapshot,
    reason: args.reason,
    details: args.details,
    createdAt: Date.now(),
  });
}

async function getModeratorInfo(ctx: any, subject: string) {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q: any) => q.eq("userId", subject))
    .unique();
  return {
    moderatorId: subject,
    moderatorName: profile?.displayName || "Admin",
  };
}

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const caller = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q: any) => q.eq("userId", identity.subject))
      .unique();
    if (caller?.role !== "admin") throw new Error("Not authorized");

    return await ctx.db
      .query("moderationLog")
      .order("desc")
      .take(100);
  },
});

export const insert = mutation({
  args: {
    action: v.string(),
    targetUserId: v.optional(v.string()),
    targetName: v.optional(v.string()),
    targetEmail: v.optional(v.string()),
    postId: v.optional(v.id("posts")),
    reportId: v.optional(v.id("postReports")),
    postSnapshot: v.optional(
      v.object({
        title: v.string(),
        content: v.string(),
        authorId: v.string(),
        authorName: v.string(),
      })
    ),
    reason: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const caller = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q: any) => q.eq("userId", identity.subject))
      .unique();
    if (caller?.role !== "admin") throw new Error("Not authorized");

    const mod = await getModeratorInfo(ctx, identity.subject);
    await logModeration(ctx, mod.moderatorId, mod.moderatorName, args);
  },
});
