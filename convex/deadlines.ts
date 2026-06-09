import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Queries ───

export const listForUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    const userKurs = profile?.hochschule || undefined;

    const all = await ctx.db.query("deadlines").collect();

    return all.filter((d) => {
      if (d.ownerId === identity.subject) return true;
      if (d.visibility === "public") return true;
      if (d.invitees?.includes(identity.subject)) return true;
      if (userKurs && d.allowedKurse?.includes(userKurs)) return true;
      return false;
    });
  },
});

export const getById = query({
  args: { deadlineId: v.id("deadlines") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    return await ctx.db.get(args.deadlineId);
  },
});

export const getAttachments = query({
  args: { deadlineId: v.id("deadlines") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const files = await ctx.db
      .query("deadlineAttachments")
      .withIndex("by_deadline", (q) => q.eq("deadlineId", args.deadlineId))
      .collect();

    return await Promise.all(
      files.map(async (f) => ({
        ...f,
        url: await ctx.storage.getUrl(f.storageId),
      }))
    );
  },
});

export const getMessages = query({
  args: { deadlineId: v.id("deadlines") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    return await ctx.db
      .query("deadlineMessages")
      .withIndex("by_deadline", (q) => q.eq("deadlineId", args.deadlineId))
      .order("asc")
      .collect();
  },
});

// ─── Mutations ───

export const create = mutation({
  args: {
    title: v.string(),
    date: v.string(),
    category: v.union(
      v.literal("abgabe"),
      v.literal("pruefung"),
      v.literal("sonstiges")
    ),
    note: v.optional(v.string()),
    visibility: v.union(v.literal("public"), v.literal("private")),
    invitees: v.optional(v.array(v.string())),
    allowedKurse: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const now = Date.now();

    const deadlineId = await ctx.db.insert("deadlines", {
      title: args.title.trim(),
      date: args.date,
      category: args.category,
      done: false,
      note: args.note?.trim(),
      visibility: args.visibility,
      invitees: args.invitees?.filter(Boolean),
      allowedKurse: args.allowedKurse?.filter(Boolean),
      ownerId: identity.subject,
      createdAt: now,
      updatedAt: now,
    });

    return deadlineId;
  },
});

export const update = mutation({
  args: {
    deadlineId: v.id("deadlines"),
    title: v.optional(v.string()),
    date: v.optional(v.string()),
    category: v.optional(
      v.union(v.literal("abgabe"), v.literal("pruefung"), v.literal("sonstiges"))
    ),
    note: v.optional(v.string()),
    visibility: v.optional(
      v.union(v.literal("public"), v.literal("private"))
    ),
    invitees: v.optional(v.array(v.string())),
    allowedKurse: v.optional(v.array(v.string())),
    done: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const deadline = await ctx.db.get(args.deadlineId);
    if (!deadline) throw new Error("Deadline not found");
    if (deadline.ownerId !== identity.subject) throw new Error("Not authorized");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) patch.title = args.title.trim();
    if (args.date !== undefined) patch.date = args.date;
    if (args.category !== undefined) patch.category = args.category;
    if (args.note !== undefined) patch.note = args.note?.trim();
    if (args.visibility !== undefined) patch.visibility = args.visibility;
    if (args.invitees !== undefined) patch.invitees = args.invitees?.filter(Boolean);
    if (args.allowedKurse !== undefined) patch.allowedKurse = args.allowedKurse?.filter(Boolean);
    if (args.done !== undefined) patch.done = args.done;

    await ctx.db.patch(args.deadlineId, patch);
  },
});

export const toggleDone = mutation({
  args: { deadlineId: v.id("deadlines") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const deadline = await ctx.db.get(args.deadlineId);
    if (!deadline) throw new Error("Deadline not found");
    if (deadline.ownerId !== identity.subject) throw new Error("Not authorized");

    await ctx.db.patch(args.deadlineId, {
      done: !deadline.done,
      updatedAt: Date.now(),
    });
  },
});

export const deleteDeadline = mutation({
  args: { deadlineId: v.id("deadlines") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const deadline = await ctx.db.get(args.deadlineId);
    if (!deadline) throw new Error("Deadline not found");
    if (deadline.ownerId !== identity.subject) throw new Error("Not authorized");

    const attachments = await ctx.db
      .query("deadlineAttachments")
      .withIndex("by_deadline", (q) => q.eq("deadlineId", args.deadlineId))
      .collect();
    for (const a of attachments) {
      await ctx.storage.delete(a.storageId);
      await ctx.db.delete(a._id);
    }

    const messages = await ctx.db
      .query("deadlineMessages")
      .withIndex("by_deadline", (q) => q.eq("deadlineId", args.deadlineId))
      .collect();
    for (const m of messages) await ctx.db.delete(m._id);

    await ctx.db.delete(args.deadlineId);
  },
});

// ─── Attachments ───

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    return await ctx.storage.generateUploadUrl();
  },
});

export const attachFile = mutation({
  args: {
    deadlineId: v.id("deadlines"),
    name: v.string(),
    size: v.number(),
    type: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    await ctx.db.insert("deadlineAttachments", {
      deadlineId: args.deadlineId,
      name: args.name,
      size: args.size,
      type: args.type,
      storageId: args.storageId,
      uploadedBy: identity.subject,
      createdAt: Date.now(),
    });
  },
});

export const deleteAttachment = mutation({
  args: { attachmentId: v.id("deadlineAttachments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment) throw new Error("Attachment not found");
    if (attachment.uploadedBy !== identity.subject) throw new Error("Not authorized");

    await ctx.storage.delete(attachment.storageId);
    await ctx.db.delete(args.attachmentId);
  },
});

// ─── Messages ───

export const addMessage = mutation({
  args: {
    deadlineId: v.id("deadlines"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    const authorName = profile?.displayName || identity.name || identity.email || "Unbekannt";

    const deadline = await ctx.db.get(args.deadlineId);
    if (!deadline) throw new Error("Deadline not found");

    await ctx.db.insert("deadlineMessages", {
      deadlineId: args.deadlineId,
      authorId: identity.subject,
      authorName,
      text: args.text.trim(),
      createdAt: Date.now(),
    });
  },
});

export const deleteMessage = mutation({
  args: { messageId: v.id("deadlineMessages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");
    if (message.authorId !== identity.subject) throw new Error("Not authorized");
    await ctx.db.delete(args.messageId);
  },
});
