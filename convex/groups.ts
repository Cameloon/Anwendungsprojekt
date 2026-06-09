import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listForUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const groupIds = memberships.map((m) => m.groupId);

    const groups = await Promise.all(
      groupIds.map(async (id) => {
        const group = await ctx.db.get(id);
        if (!group) return null;
        const members = await ctx.db
          .query("groupMembers")
          .withIndex("by_group", (q) => q.eq("groupId", id))
          .collect();
        return { ...group, members };
      })
    );

    return groups.filter((g): g is NonNullable<typeof g> => g !== null);
  },
});

export const getById = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const group = await ctx.db.get(args.groupId);
    if (!group) return null;

    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    return { ...group, members };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    const displayName =
      profile?.displayName || identity.name || identity.email || "Unbekannt";

    const now = Date.now();
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();

    const groupId = await ctx.db.insert("groups", {
      name: args.name.trim(),
      description: args.description.trim(),
      inviteCode: code,
      ownerId: identity.subject,
      createdAt: now,
    });

    await ctx.db.insert("groupMembers", {
      groupId,
      userId: identity.subject,
      displayName,
      joinedAt: now,
    });

    return { groupId, inviteCode: code };
  },
});

export const joinByCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    const displayName =
      profile?.displayName || identity.name || identity.email || "Unbekannt";

    const group = await ctx.db
      .query("groups")
      .withIndex("by_inviteCode", (q) =>
        q.eq("inviteCode", args.code.toUpperCase())
      )
      .unique();
    if (!group) return null;

    const existing = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", group._id).eq("userId", identity.subject)
      )
      .unique();
    if (!existing) {
      await ctx.db.insert("groupMembers", {
        groupId: group._id,
        userId: identity.subject,
        displayName,
        joinedAt: Date.now(),
      });
    }

    return { groupId: group._id, name: group.name };
  },
});

export const deleteGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");
    if (group.ownerId !== identity.subject)
      throw new Error("Not authorized");

    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
    for (const m of members) {
      await ctx.db.delete(m._id);
    }

    await ctx.db.delete(args.groupId);
  },
});
