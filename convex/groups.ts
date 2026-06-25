import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listForUser = query({
  args: { includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
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
        if (!args.includeArchived && group.archived) return null;
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

export const listArchived = query({
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
        if (!group || !group.archived) return null;
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
    deadlineId: v.optional(v.id("deadlines")),
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
      deadlineId: args.deadlineId,
      archived: false,
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

// ─── Archive ───

export const archive = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");
    if (group.ownerId !== identity.subject)
      throw new Error("Not authorized");

    await ctx.db.patch(args.groupId, {
      archived: true,
      archivedAt: Date.now(),
    });
  },
});

export const unarchive = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");
    if (group.ownerId !== identity.subject)
      throw new Error("Not authorized");

    await ctx.db.patch(args.groupId, {
      archived: false,
      archivedAt: undefined,
    });
  },
});

// ─── Files ───

export const generateGroupUploadUrl = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

export const attachGroupFile = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.string(),
    storageId: v.id("_storage"),
    fileType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.insert("groupFiles", {
      groupId: args.groupId,
      name: args.name,
      storageId: args.storageId,
      fileType: args.fileType,
      fileSize: args.fileSize,
      uploadedBy: identity.subject,
      createdAt: Date.now(),
    });
  },
});

export const getGroupFiles = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const files = await ctx.db
      .query("groupFiles")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    return await Promise.all(
      files.map(async (f) => ({
        ...f,
        url: await ctx.storage.getUrl(f.storageId),
      })),
    );
  },
});

export const deleteGroupFile = mutation({
  args: { fileId: v.id("groupFiles") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const file = await ctx.db.get(args.fileId);
    if (!file) throw new Error("File not found");
    if (file.uploadedBy !== identity.subject)
      throw new Error("Not authorized");

    await ctx.storage.delete(file.storageId);
    await ctx.db.delete(args.fileId);
  },
});
