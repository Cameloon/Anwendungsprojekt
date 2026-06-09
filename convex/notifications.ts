import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ─── Queries ───

export const listForUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", identity.subject))
      .order("desc")
      .collect();
  },
});

export const pendingCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const all = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", identity.subject))
      .collect();
    return all.filter((n) => n.status === "pending").length;
  },
});

export const getById = query({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    return await ctx.db.get(args.notificationId);
  },
});

// ─── Mutations ───

export const create = mutation({
  args: {
    type: v.union(v.literal("forum_invite"), v.literal("deadline_invite")),
    recipientId: v.string(),
    recipientName: v.string(),
    fromId: v.string(),
    fromName: v.string(),
    title: v.string(),
    message: v.optional(v.string()),
    forumId: v.optional(v.id("forums")),
    deadlineId: v.optional(v.id("deadlines")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const notificationId = await ctx.db.insert("notifications", {
      type: args.type,
      recipientId: args.recipientId,
      recipientName: args.recipientName,
      fromId: args.fromId,
      fromName: args.fromName,
      title: args.title,
      message: args.message,
      forumId: args.forumId,
      deadlineId: args.deadlineId,
      status: "pending",
      createdAt: Date.now(),
    });
    return notificationId;
  },
});

export const inviteToForum = mutation({
  args: {
    forumId: v.id("forums"),
    forumName: v.string(),
    recipientIds: v.array(v.string()),
    recipientNames: v.array(v.string()),
    fromName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const results: string[] = [];

    for (let i = 0; i < args.recipientIds.length; i++) {
      const id = await ctx.db.insert("notifications", {
        type: "forum_invite",
        recipientId: args.recipientIds[i],
        recipientName: args.recipientNames[i] || args.recipientIds[i],
        fromId: identity.subject,
        fromName: args.fromName,
        title: args.forumName,
        forumId: args.forumId,
        message: `${args.fromName} hat dich ins Forum „${args.forumName}“ eingeladen.`,
        status: "pending",
        createdAt: Date.now(),
      });
      results.push(id);
    }

    return results;
  },
});

export const inviteToDeadline = mutation({
  args: {
    deadlineId: v.id("deadlines"),
    deadlineTitle: v.string(),
    recipientIds: v.array(v.string()),
    recipientNames: v.array(v.string()),
    fromName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const results: string[] = [];

    for (let i = 0; i < args.recipientIds.length; i++) {
      const id = await ctx.db.insert("notifications", {
        type: "deadline_invite",
        recipientId: args.recipientIds[i],
        recipientName: args.recipientNames[i] || args.recipientIds[i],
        fromId: identity.subject,
        fromName: args.fromName,
        title: args.deadlineTitle,
        deadlineId: args.deadlineId,
        message: `${args.fromName} hat dich zum Termin „${args.deadlineTitle}“ eingeladen.`,
        status: "pending",
        createdAt: Date.now(),
      });
      results.push(id);
    }

    return results;
  },
});

export const accept = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");
    if (notification.recipientId !== identity.subject) throw new Error("Not authorized");

    if (notification.type === "forum_invite" && notification.forumId) {
      const forumId: Id<"forums"> = notification.forumId;
      const existing = await ctx.db
        .query("forumMembers")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .withIndex("by_forum_user", (q: any) =>
          q.eq("forumId", forumId).eq("userId", identity.subject)
        )
        .unique();

      if (!existing) {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", identity.subject))
          .unique();
        const displayName = profile?.displayName || identity.name || identity.email || "Unbekannt";

        await ctx.db.insert("forumMembers", {
          forumId: notification.forumId,
          userId: identity.subject,
          displayName,
          joinedAt: Date.now(),
        });
      }
    }

    if (notification.type === "deadline_invite" && notification.deadlineId) {
      const deadline = await ctx.db.get(notification.deadlineId);
      if (deadline) {
        // Check if already accepted — has own copy
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const existing = await ctx.db
          .query("deadlines")
          .filter((q: any) => q.eq(q.field("ownerId"), identity.subject))
          .filter((q: any) => q.eq(q.field("title"), deadline.title))
          .filter((q: any) => q.eq(q.field("date"), deadline.date))
          .first();
        /* eslint-enable @typescript-eslint/no-explicit-any */
        if (!existing) {
          // Remove user from original invitees
          const updatedInvitees = (deadline.invitees ?? []).filter(
            (id) => id !== identity.subject,
          );
          await ctx.db.patch(notification.deadlineId, {
            invitees: updatedInvitees,
          });

          await ctx.db.insert("deadlines", {
            title: deadline.title,
            date: deadline.date,
            category: deadline.category,
            done: false,
            note: deadline.note,
            vorlesung: deadline.vorlesung,
            visibility: deadline.visibility,
            ownerId: identity.subject,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      }
    }

    await ctx.db.patch(args.notificationId, { status: "accepted" });
  },
});

export const decline = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");
    if (notification.recipientId !== identity.subject) throw new Error("Not authorized");

    await ctx.db.patch(args.notificationId, { status: "declined" });
  },
});

export const remove = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");
    if (notification.recipientId !== identity.subject) throw new Error("Not authorized");

    await ctx.db.delete(args.notificationId);
  },
});
