import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Queries ───

export const getAllAccessible = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    const userJahrgang = profile?.jahrgang || undefined;
    const isAdmin = profile?.role === "admin";

    const allForums = await ctx.db.query("forums").collect();
    const myMemberships = await ctx.db
      .query("forumMembers")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    const memberForumIds = new Set(myMemberships.map((m) => m.forumId));

    const accessible = allForums.filter((f) => {
      if (isAdmin) return true;
      if (memberForumIds.has(f._id)) return true;
      if (f.jahrgang && f.jahrgang !== userJahrgang) return false;
      if (f.visibility === "public") return true;
      return false;
    });

    // Collect admin userIds to filter them out of member displays
    const adminProfiles = await ctx.db
      .query("profiles")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((q: any) => q.eq(q.field("role"), "admin"))
      .collect();
    const adminUserIds = new Set(adminProfiles.map((p: { userId: string }) => p.userId));

    return await Promise.all(
      accessible.map(async (f) => {
        const members = await ctx.db
          .query("forumMembers")
          .withIndex("by_forum", (q) => q.eq("forumId", f._id))
          .collect();
        const filtered = members.filter((m) => !adminUserIds.has(m.userId));
        return { ...f, members: filtered };
      }),
    );
  },
});

export const getById = query({
  args: { forumId: v.id("forums") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.db.get(args.forumId);
  },
});

export const getByInviteCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.db
      .query("forums")
      .withIndex("by_inviteCode", (q) =>
        q.eq("inviteCode", args.code.toUpperCase())
      )
      .unique();
  },
});

export const isMember = query({
  args: { forumId: v.id("forums") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const member = await ctx.db
      .query("forumMembers")
      .withIndex("by_forum_user", (q) =>
        q.eq("forumId", args.forumId).eq("userId", identity.subject)
      )
      .unique();
    return !!member;
  },
});

export const getMembers = query({
  args: { forumId: v.id("forums") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const members = await ctx.db
      .query("forumMembers")
      .withIndex("by_forum", (q) => q.eq("forumId", args.forumId))
      .collect();

    const adminProfiles = await ctx.db
      .query("profiles")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((q: any) => q.eq(q.field("role"), "admin"))
      .collect();
    const adminUserIds = new Set(adminProfiles.map((p: { userId: string }) => p.userId));

    return members.filter((m) => !adminUserIds.has(m.userId));
  },
});

export const getMemberCount = query({
  args: { forumId: v.id("forums") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const members = await ctx.db
      .query("forumMembers")
      .withIndex("by_forum", (q) => q.eq("forumId", args.forumId))
      .collect();
    return members.length;
  },
});

// ─── Mutations ───

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    visibility: v.union(v.literal("public"), v.literal("private")),
    kurs: v.optional(v.string()),
    vorlesung: v.optional(v.string()),
    professor: v.optional(v.string()),
    standort: v.optional(v.string()),
    allowedKurse: v.optional(v.array(v.string())),
    jahrgang: v.optional(v.string()),
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

    const forumId = await ctx.db.insert("forums", {
      name: args.name.trim(),
      description: args.description.trim(),
      visibility: args.visibility,
      kurs: args.kurs?.trim() || undefined,
      vorlesung: args.vorlesung?.trim() || undefined,
      professor: args.professor?.trim() || undefined,
      standort: args.standort?.trim() || undefined,
      inviteCode: code,
      allowedKurse: args.allowedKurse?.filter(Boolean),
      jahrgang: args.jahrgang?.trim().toUpperCase() || undefined,
      ownerId: identity.subject,
      deadlineId: args.deadlineId,
      createdAt: now,
    });

    await ctx.db.insert("forumMembers", {
      forumId,
      userId: identity.subject,
      displayName,
      joinedAt: now,
    });

    return { forumId, inviteCode: code };
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

    const forum = await ctx.db
      .query("forums")
      .withIndex("by_inviteCode", (q) =>
        q.eq("inviteCode", args.code.toUpperCase())
      )
      .unique();
    if (!forum) throw new Error("Forum not found");

    const existing = await ctx.db
      .query("forumMembers")
      .withIndex("by_forum_user", (q) =>
        q.eq("forumId", forum._id).eq("userId", identity.subject)
      )
      .unique();
    if (existing) return { forumId: forum._id };

    await ctx.db.insert("forumMembers", {
      forumId: forum._id,
      userId: identity.subject,
      displayName,
      joinedAt: Date.now(),
    });

    return { forumId: forum._id };
  },
});

export const join = mutation({
  args: { forumId: v.id("forums") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    const displayName =
      profile?.displayName || identity.name || identity.email || "Unbekannt";

    const forum = await ctx.db.get(args.forumId);
    if (!forum) throw new Error("Forum not found");

    const existing = await ctx.db
      .query("forumMembers")
      .withIndex("by_forum_user", (q) =>
        q.eq("forumId", args.forumId).eq("userId", identity.subject)
      )
      .unique();
    if (existing) return;

    await ctx.db.insert("forumMembers", {
      forumId: args.forumId,
      userId: identity.subject,
      displayName,
      joinedAt: Date.now(),
    });
  },
});

export const ensureAllgemeinForum = mutation({
  args: { jahrgang: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    const displayName = profile?.displayName || identity.name || identity.email || "Unbekannt";
    const jg = args.jahrgang.toUpperCase();

    const existing = await ctx.db
      .query("forums")
      .filter((q) => q.eq(q.field("name"), "Allgemein"))
      .filter((q) => q.eq(q.field("jahrgang"), jg))
      .first();

    if (existing) {
      const isMember = await ctx.db
        .query("forumMembers")
        .withIndex("by_forum_user", (q) =>
          q.eq("forumId", existing._id).eq("userId", identity.subject)
        )
        .unique();
      if (!isMember) {
        await ctx.db.insert("forumMembers", {
          forumId: existing._id,
          userId: identity.subject,
          displayName,
          joinedAt: Date.now(),
        });
      }
      return existing._id;
    }

    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const forumId = await ctx.db.insert("forums", {
      name: "Allgemein",
      description: `Allgemeiner Austausch für Jahrgang ${jg}`,
      visibility: "public",
      inviteCode: code,
      jahrgang: jg,
      createdAt: Date.now(),
    });

    await ctx.db.insert("forumMembers", {
      forumId,
      userId: identity.subject,
      displayName,
      joinedAt: Date.now(),
    });

    return forumId;
  },
});

export const leave = mutation({
  args: { forumId: v.id("forums") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const member = await ctx.db
      .query("forumMembers")
      .withIndex("by_forum_user", (q) =>
        q.eq("forumId", args.forumId).eq("userId", identity.subject)
      )
      .unique();
    if (member) {
      await ctx.db.delete(member._id);
    }
  },
});

// ─── Files ───

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

export const attachFile = mutation({
  args: {
    forumId: v.id("forums"),
    name: v.string(),
    description: v.optional(v.string()),
    storageId: v.id("_storage"),
    fileType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.insert("forumFiles", {
      forumId: args.forumId,
      name: args.name,
      description: args.description,
      storageId: args.storageId,
      fileType: args.fileType,
      fileSize: args.fileSize,
      uploadedBy: identity.subject,
      createdAt: Date.now(),
    });
  },
});

export const getFiles = query({
  args: { forumId: v.id("forums") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const files = await ctx.db
      .query("forumFiles")
      .withIndex("by_forum", (q) => q.eq("forumId", args.forumId))
      .collect();

    return await Promise.all(
      files.map(async (f) => ({
        ...f,
        url: await ctx.storage.getUrl(f.storageId),
      }))
    );
  },
});

export const deleteFile = mutation({
  args: { fileId: v.id("forumFiles") },
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
