import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Helpers ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getKursUserIds(ctx: any, userId: string): Promise<string[]> {
  const profile = await ctx.db
    .query("profiles")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .unique();
  if (!profile?.kurs) return [];
  const all = await ctx.db.query("profiles").collect();
  return all
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((p: any) => p.kurs === profile.kurs && p.userId !== userId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any) => p.userId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function isAdmin(ctx: any, userId: string): Promise<boolean> {
  const profile = await ctx.db
    .query("profiles")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .unique();
  return profile?.role === "admin";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function canAccessDeadline(ctx: any, deadline: any, userId: string): Promise<boolean> {
  if (deadline.ownerId === userId) return true;
  if (deadline.invitees?.includes(userId)) return true;
  return await isAdmin(ctx, userId);
}

// ─── Queries ───

export const listForUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const all = await ctx.db.query("deadlines").collect();

    // For public deadlines: hide originals the user already accepted (owns a copy)
    const myOwn = all.filter((d) => d.ownerId === identity.subject);
    const acceptedSignatures = new Set(
      myOwn.map((d) => `${d.title}|${d.date}|${d.category}`),
    );

    return all.filter((d) => {
      if (d.ownerId === identity.subject) return true;
      if (d.visibility === "public") {
        if (d.declinedBy?.includes(identity.subject)) return false;
        const sig = `${d.title}|${d.date}|${d.category}`;
        if (acceptedSignatures.has(sig)) return false;
        return true;
      }
      if (d.invitees?.includes(identity.subject)) return true;
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
    const deadline = await ctx.db.get(args.deadlineId);
    if (!deadline) throw new Error("Deadline not found");
    if (!(await canAccessDeadline(ctx, deadline, identity.subject))) {
      throw new Error("Not authorized");
    }
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
    time: v.optional(v.string()),
    remindBefore: v.optional(v.array(v.number())),
    category: v.union(
      v.literal("abgabe"),
      v.literal("pruefung"),
      v.literal("sonstiges")
    ),
    note: v.optional(v.string()),
    vorlesung: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("med"), v.literal("high"))
    ),
    visibility: v.union(v.literal("public"), v.literal("private")),
    invitees: v.optional(v.array(v.string())),
    allowedKurse: v.optional(v.array(v.string())),
    linkedScriptIds: v.optional(v.array(v.id("scripts"))),
    linkedGroupIds: v.optional(v.array(v.id("forums"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const title = args.title.trim();
    if (title.length > 50) throw new Error("Titel darf maximal 50 Zeichen lang sein.");

    const now = Date.now();
    const invitees = args.visibility === "public"
      ? await getKursUserIds(ctx, identity.subject)
      : args.invitees?.filter(Boolean);

    return await ctx.db.insert("deadlines", {
      title,
      date: args.date,
      time: args.time,
      remindBefore: args.remindBefore?.filter(Boolean),
      category: args.category,
      done: false,
      note: args.note?.trim(),
      vorlesung: args.vorlesung?.trim(),
      priority: args.priority ?? "med",
      visibility: args.visibility,
      invitees,
      allowedKurse: args.allowedKurse?.filter(Boolean),
      linkedScriptIds: args.linkedScriptIds,
      linkedGroupIds: args.linkedGroupIds,
      ownerId: identity.subject,
      createdAt: now,
      updatedAt: now,
    }).then(async (deadlineId) => {
      if (args.visibility === "public" && invitees && invitees.length > 0) {
        const profile = await ctx.db
          .query("profiles")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .withIndex("by_user", (q: any) => q.eq("userId", identity.subject))
          .unique();
        const fromName = profile?.displayName || identity.name || "Unbekannt";
        for (const recipientId of invitees) {
          const recipientProfile = await ctx.db
            .query("profiles")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .withIndex("by_user", (q: any) => q.eq("userId", recipientId))
            .unique();
          const recipientName = recipientProfile?.displayName || recipientId;
          await ctx.db.insert("notifications", {
            type: "deadline_invite",
            recipientId,
            recipientName,
            fromId: identity.subject,
            fromName,
            title,
            message: `${fromName} hat dich zum Termin „${title}“ eingeladen (öffentlich).`,
            deadlineId,
            status: "pending",
            createdAt: now,
          });
        }
      }
      return deadlineId;
    });
  },
});

export const update = mutation({
  args: {
    deadlineId: v.id("deadlines"),
    title: v.optional(v.string()),
    date: v.optional(v.string()),
    time: v.optional(v.string()),
    remindBefore: v.optional(v.array(v.number())),
    category: v.optional(
      v.union(v.literal("abgabe"), v.literal("pruefung"), v.literal("sonstiges"))
    ),
    note: v.optional(v.string()),
    vorlesung: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("med"), v.literal("high"))
    ),
    visibility: v.optional(
      v.union(v.literal("public"), v.literal("private"))
    ),
    invitees: v.optional(v.array(v.string())),
    allowedKurse: v.optional(v.array(v.string())),
    linkedScriptIds: v.optional(v.array(v.id("scripts"))),
    linkedGroupIds: v.optional(v.array(v.id("forums"))),
    done: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const deadline = await ctx.db.get(args.deadlineId);
    if (!deadline) throw new Error("Deadline not found");

    if (deadline.visibility === "private" && deadline.ownerId !== identity.subject) {
      const isInvited = deadline.invitees?.includes(identity.subject);
      if (!isInvited)
        throw new Error("Not authorized — nur der Besitzer oder Eingeladene dürfen bearbeiten");
    }

    if (args.title !== undefined && args.title.trim().length > 50) {
      throw new Error("Titel darf maximal 50 Zeichen lang sein.");
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) patch.title = args.title.trim();
    if (args.date !== undefined) patch.date = args.date;
    if (args.time !== undefined) patch.time = args.time;
    if (args.remindBefore !== undefined) patch.remindBefore = args.remindBefore;
    if (args.category !== undefined) patch.category = args.category;
    if (args.note !== undefined) patch.note = args.note?.trim();
    if (args.vorlesung !== undefined) patch.vorlesung = args.vorlesung?.trim();
    if (args.priority !== undefined) patch.priority = args.priority;
    if (args.visibility !== undefined) patch.visibility = args.visibility;
    if (args.invitees !== undefined) patch.invitees = args.invitees?.filter(Boolean);
    if (args.allowedKurse !== undefined) patch.allowedKurse = args.allowedKurse?.filter(Boolean);
    if (args.linkedScriptIds !== undefined) patch.linkedScriptIds = args.linkedScriptIds;
    if (args.linkedGroupIds !== undefined) patch.linkedGroupIds = args.linkedGroupIds;
    if (args.done !== undefined) patch.done = args.done;
    if (args.visibility === "public" && !args.invitees) {
      patch.invitees = await getKursUserIds(ctx, identity.subject);
    }

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

    if (deadline.ownerId === identity.subject) {
      await ctx.db.patch(args.deadlineId, {
        done: !deadline.done,
        updatedAt: Date.now(),
      });
      return;
    }

    const isPublic = deadline.visibility === "public";
    const isInvited = deadline.invitees?.includes(identity.subject);
    if (!isPublic && !isInvited) throw new Error("Not authorized");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await ctx.db
      .query("deadlines")
      .filter((q: any) => q.eq(q.field("ownerId"), identity.subject))
      .filter((q: any) => q.eq(q.field("title"), deadline.title))
      .filter((q: any) => q.eq(q.field("date"), deadline.date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        done: !existing.done,
        updatedAt: Date.now(),
      });
      return;
    }

    const updatedInvitees = (deadline.invitees ?? []).filter(
      (id) => id !== identity.subject,
    );
    const patchFields: Record<string, unknown> = { invitees: updatedInvitees };
    if (deadline.visibility === "public") {
      const declined = [...(deadline.declinedBy ?? []), identity.subject];
      patchFields.declinedBy = declined;
    }
    await ctx.db.patch(args.deadlineId, patchFields);

    const now = Date.now();
    await ctx.db.insert("deadlines", {
      title: deadline.title,
      date: deadline.date,
      category: deadline.category,
      done: !deadline.done,
      note: deadline.note,
      vorlesung: deadline.vorlesung,
      visibility: deadline.visibility,
      invitees: [],
      allowedKurse: deadline.allowedKurse,
      linkedScriptIds: deadline.linkedScriptIds,
      linkedGroupIds: deadline.linkedGroupIds,
      ownerId: identity.subject,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const acceptDeadline = mutation({
  args: { deadlineId: v.id("deadlines") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const deadline = await ctx.db.get(args.deadlineId);
    if (!deadline) throw new Error("Deadline not found");
    if (!deadline.invitees?.includes(identity.subject))
      throw new Error("Nicht eingeladen");

    // Check if already accepted — has own copy
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const existing = await ctx.db
      .query("deadlines")
      .filter((q: any) => q.eq(q.field("ownerId"), identity.subject))
      .filter((q: any) => q.eq(q.field("title"), deadline.title))
      .filter((q: any) => q.eq(q.field("date"), deadline.date))
      .first();
    /* eslint-enable @typescript-eslint/no-explicit-any */
    if (existing) return existing._id;

    // Remove user from original invitees
    const updatedInvitees = (deadline.invitees ?? []).filter(
      (id) => id !== identity.subject,
    );
    const patchFields: Record<string, unknown> = { invitees: updatedInvitees };

    // For public: also add to declinedBy so the original stays hidden after accepting
    if (deadline.visibility === "public") {
      const declined = [...(deadline.declinedBy ?? []), identity.subject];
      (patchFields as Record<string, unknown>).declinedBy = declined;
    }

    await ctx.db.patch(args.deadlineId, patchFields);

    // Mark pending invitation notification as accepted
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pendingNotif = await ctx.db
      .query("notifications")
      .filter((q: any) => q.eq(q.field("type"), "deadline_invite"))
      .filter((q: any) => q.eq(q.field("recipientId"), identity.subject))
      .filter((q: any) => q.eq(q.field("deadlineId"), args.deadlineId))
      .filter((q: any) => q.eq(q.field("status"), "pending"))
      .first();
    if (pendingNotif) {
      await ctx.db.patch(pendingNotif._id, { status: "accepted" });
    }

    const now = Date.now();
    return await ctx.db.insert("deadlines", {
      title: deadline.title,
      date: deadline.date,
      category: deadline.category,
      done: false,
      note: deadline.note,
      vorlesung: deadline.vorlesung,
      visibility: deadline.visibility,
      ownerId: identity.subject,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const declineDeadline = mutation({
  args: { deadlineId: v.id("deadlines") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const deadline = await ctx.db.get(args.deadlineId);
    if (!deadline) throw new Error("Deadline not found");
    if (!deadline.invitees?.includes(identity.subject))
      throw new Error("Nicht eingeladen");

    const updated = deadline.invitees.filter((id) => id !== identity.subject);
    await ctx.db.patch(args.deadlineId, { invitees: updated });

    // Mark pending invitation notification as declined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pendingNotif = await ctx.db
      .query("notifications")
      .filter((q: any) => q.eq(q.field("type"), "deadline_invite"))
      .filter((q: any) => q.eq(q.field("recipientId"), identity.subject))
      .filter((q: any) => q.eq(q.field("deadlineId"), args.deadlineId))
      .filter((q: any) => q.eq(q.field("status"), "pending"))
      .first();
    if (pendingNotif) {
      await ctx.db.patch(pendingNotif._id, { status: "declined" });
    }
  },
});

export const deleteDeadline = mutation({
  args: { deadlineId: v.id("deadlines") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const deadline = await ctx.db.get(args.deadlineId);
    if (!deadline) throw new Error("Deadline not found");

    if (deadline.visibility === "private" && deadline.ownerId !== identity.subject)
      throw new Error("Not authorized — nur der Besitzer darf löschen");

    // For public copies: add user to declinedBy on the ORIGINAL only, not other copies
    if (deadline.visibility === "public" && deadline.ownerId === identity.subject) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const original = await ctx.db
        .query("deadlines")
        .filter((q: any) => q.eq(q.field("title"), deadline.title))
        .filter((q: any) => q.eq(q.field("date"), deadline.date))
        .filter((q: any) => q.eq(q.field("category"), deadline.category))
        .filter((q: any) => q.eq(q.field("visibility"), "public"))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((q: any) => q.neq(q.field("ownerId"), identity.subject))
        .first();
      if (original) {
        const declined = [...(original.declinedBy ?? []), identity.subject];
        await ctx.db.patch(original._id, { declinedBy: declined });
      }
    }

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
