import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logModeration } from "./moderationLog";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const caller = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (caller?.role !== "admin") throw new Error("Not authorized");
    return await ctx.db.query("profiles").collect();
  },
});

export const updateRole = mutation({
  args: {
    userId: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const caller = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (caller?.role !== "admin") throw new Error("Not authorized");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (!profile) throw new Error("Profile not found");
    await ctx.db.patch(profile._id, { role: args.role, updatedAt: Date.now() });
    await logModeration(ctx, caller.userId, caller.displayName || "Admin", {
      action: "update_role",
      targetUserId: profile.userId,
      targetName: profile.displayName || profile.email || profile.userId,
      details: `Rolle geändert auf "${args.role}"`,
    });
  },
});

export const approveUser = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const caller = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (caller?.role !== "admin") throw new Error("Not authorized");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (!profile) throw new Error("Profile not found");
    await ctx.db.patch(profile._id, { status: "active", role: "user", updatedAt: Date.now() });
    await logModeration(ctx, caller.userId, caller.displayName || "Admin", {
      action: "approve_user",
      targetUserId: profile.userId,
      targetName: profile.displayName || profile.email || profile.userId,
      targetEmail: profile.email,
    });
  },
});

export const rejectUser = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const caller = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (caller?.role !== "admin") throw new Error("Not authorized");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (!profile) throw new Error("Profile not found");
    await ctx.db.patch(profile._id, { status: "rejected", updatedAt: Date.now() });
    await logModeration(ctx, caller.userId, caller.displayName || "Admin", {
      action: "reject_user",
      targetUserId: profile.userId,
      targetName: profile.displayName || profile.email || profile.userId,
    });
  },
});

export const banUser = mutation({
  args: { userId: v.string(), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const caller = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (caller?.role !== "admin") throw new Error("Not authorized");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (!profile) throw new Error("Profile not found");
    if (profile.role === "admin") throw new Error("Admins können nicht gebannt werden");

    await ctx.db.patch(profile._id, { status: "banned", updatedAt: Date.now() });

    await ctx.db.insert("notifications", {
      type: "account_banned",
      recipientId: profile.userId,
      recipientName: profile.displayName || profile.userId,
      fromId: identity.subject,
      fromName: caller.displayName || "Admin",
      title: "Konto gesperrt",
      message: args.reason
        ? `Dein Konto wurde von einem Administrator gesperrt: ${args.reason}`
        : "Dein Konto wurde von einem Administrator gesperrt.",
      status: "pending",
      createdAt: Date.now(),
    });

    await logModeration(ctx, caller.userId, caller.displayName || "Admin", {
      action: "ban_user",
      targetUserId: profile.userId,
      targetName: profile.displayName || profile.email || profile.userId,
      reason: args.reason,
    });
  },
});

export const unbanUser = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const caller = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (caller?.role !== "admin") throw new Error("Not authorized");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (!profile) throw new Error("Profile not found");
    await ctx.db.patch(profile._id, { status: "active", updatedAt: Date.now() });
    await logModeration(ctx, caller.userId, caller.displayName || "Admin", {
      action: "unban_user",
      targetUserId: profile.userId,
      targetName: profile.displayName || profile.email || profile.userId,
    });
  },
});

export const updateMyRole = mutation({
  args: {
    role: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!profile) throw new Error("Profile not found");
    await ctx.db.patch(profile._id, { role: args.role, updatedAt: Date.now() });
  },
});

export const deleteUser = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const caller = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (caller?.role !== "admin") throw new Error("Not authorized");
    if (args.userId === identity.subject) throw new Error("Eigener Account kann nicht gelöscht werden");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (!profile) throw new Error("Profile not found");
    if (profile.role === "admin") throw new Error("Admins können nicht gelöscht werden");

    await ctx.db.delete(profile._id);
    await logModeration(ctx, caller.userId, caller.displayName || "Admin", {
      action: "delete_user",
      targetUserId: profile.userId,
      targetName: profile.displayName || profile.email || profile.userId,
      targetEmail: profile.email,
    });
  },
});
