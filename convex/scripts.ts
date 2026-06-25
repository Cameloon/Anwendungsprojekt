import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getType } from "./schema";

// ─── Helpers ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveSubject(ctx: any, subject: any): Promise<string> {
  const type = getType(subject);
  if (type === null) {
    return subject as string;
  }
  const lecture = await ctx.db.get(subject.lectureId);
  return lecture?.lectureName ?? "Unbekannt";
}

// ─── Queries ───

export const listVisible = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const all = await ctx.db.query("scripts").collect();

    const visible = all.filter(
      (s) => s.visibility !== "private" || s.authorId === identity.subject
    );

    return await Promise.all(
      visible.map(async (s) => ({
        ...s,
        url: s.storageId ? await ctx.storage.getUrl(s.storageId) : undefined,
        subject: await resolveSubject(ctx, s.subject),
      }))
    );
  },
});

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const all = await ctx.db.query("scripts").collect();

    const publicScripts = all.filter((s) => s.visibility !== "private");

    return await Promise.all(
      publicScripts.map(async (s) => ({
        ...s,
        url: s.storageId ? await ctx.storage.getUrl(s.storageId) : undefined,
        subject: await resolveSubject(ctx, s.subject),
      }))
    );
  },
});

export const getById = query({
  args: { scriptId: v.id("scripts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const script = await ctx.db.get(args.scriptId);
    if (!script) return null;
    return {
      ...script,
      url: script.storageId ? await ctx.storage.getUrl(script.storageId) : undefined,
      subject: await resolveSubject(ctx, script.subject),
    };
  },
});

export const listBySubject = query({
  args: { subject: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const all = await ctx.db.query("scripts").collect();

    const filtered = [];
    for (const s of all) {
      if (s.visibility === "private" && s.authorId !== identity.subject) continue;
      const resolved = await resolveSubject(ctx, s.subject);
      if (resolved === args.subject) {
        filtered.push(s);
      }
    }

    return await Promise.all(
      filtered.map(async (s) => ({
        ...s,
        url: s.storageId ? await ctx.storage.getUrl(s.storageId) : undefined,
      }))
    );
  },
});

export const getDistinctSubjects = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const all = await ctx.db.query("scripts").collect();
    const subjects = new Set<string>();

    for (const s of all) {
      if (s.visibility === "private" && s.authorId !== identity.subject) continue;
      const resolved = await resolveSubject(ctx, s.subject);
      subjects.add(resolved);
    }

    return Array.from(subjects).sort();
  },
});

// ─── Mutations ───

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    subject: v.union(
      v.string(),
      v.object({ type: v.literal("lecture"), lectureId: v.id("semesterLectures") }),
    ),
    description: v.string(),
    pages: v.number(),
    type: v.union(v.literal("PDF"), v.literal("DOCX"), v.literal("Notiz")),
    visibility: v.union(v.literal("public"), v.literal("private")),
    storageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    const authorName = profile?.displayName || identity.name || identity.email || "Unbekannt";

    const now = Date.now();
    const scriptId = await ctx.db.insert("scripts", {
      title: args.title.trim(),
      subject: args.subject,
      description: args.description.trim(),
      authorId: identity.subject,
      authorName,
      pages: args.pages,
      type: args.type,
      visibility: args.visibility,
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      createdAt: now,
      updatedAt: now,
    });

    return scriptId;
  },
});

export const update = mutation({
  args: {
    scriptId: v.id("scripts"),
    title: v.optional(v.string()),
    subject: v.optional(
      v.union(
        v.string(),
        v.object({ type: v.literal("lecture"), lectureId: v.id("semesterLectures") }),
      ),
    ),
    description: v.optional(v.string()),
    pages: v.optional(v.number()),
    type: v.optional(
      v.union(v.literal("PDF"), v.literal("DOCX"), v.literal("Notiz"))
    ),
    visibility: v.optional(
      v.union(v.literal("public"), v.literal("private"))
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const script = await ctx.db.get(args.scriptId);
    if (!script) throw new Error("Script not found");
    if (script.authorId !== identity.subject) throw new Error("Not authorized");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) patch.title = args.title.trim();
    if (args.subject !== undefined) {
      patch.subject = typeof args.subject === "string" ? args.subject.trim() : args.subject;
    }
    if (args.description !== undefined) patch.description = args.description.trim();
    if (args.pages !== undefined) patch.pages = args.pages;
    if (args.type !== undefined) patch.type = args.type;
    if (args.visibility !== undefined) patch.visibility = args.visibility;

    await ctx.db.patch(args.scriptId, patch);
  },
});

export const deleteScript = mutation({
  args: { scriptId: v.id("scripts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const script = await ctx.db.get(args.scriptId);
    if (!script) throw new Error("Script not found");
    if (script.authorId !== identity.subject) throw new Error("Not authorized");

    if (script.storageId) {
      await ctx.storage.delete(script.storageId);
    }

    await ctx.db.delete(args.scriptId);
  },
});
