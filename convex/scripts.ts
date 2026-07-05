import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getType } from "./schema";

// ─── Constants ───

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const FILE_MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_SCRIPTS_PER_USER = 50;

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function canAccess(ctx: any, script: any, viewerId: string): Promise<boolean> {
  if (script.visibility === "public") return true;
  if (script.authorId === viewerId) return true;
  if (script.visibility === "private") return false;

  if (script.visibility === "jahrgang") {
    const viewerProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q: any) => q.eq("userId", viewerId))
      .unique();
    return !!viewerProfile?.kurs && viewerProfile.kurs === script.authorKurs;
  }

  if (script.visibility === "group") {
    if (!script.forumId) return false;
    return await isForumMember(ctx, script.forumId, viewerId);
  }

  return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function isForumMember(ctx: any, forumId: any, userId: string): Promise<boolean> {
  const member = await ctx.db
    .query("forumMembers")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_forum_user", (q: any) =>
      q.eq("forumId", forumId).eq("userId", userId)
    )
    .unique();
  return !!member;
}

// "Kurs"-Sichtbarkeit ohne gesetzten Kurs würde das Skript für niemanden
// außer dem Autor selbst sichtbar machen, ohne dass der Nutzer das merkt.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function requireKurs(profile: any) {
  if (!profile?.kurs) {
    throw new Error("Für die Sichtbarkeit „Kurs“ muss dein Profil einen Kurs hinterlegt haben.");
  }
}

// ─── Queries ───

export const listVisible = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const viewerId = identity.subject;
    const all = await ctx.db.query("scripts").order("desc").collect();

    const visible: typeof all = [];
    for (const s of all) {
      if (await canAccess(ctx, s, viewerId)) visible.push(s);
    }

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

    const all = await ctx.db.query("scripts").order("desc").collect();
    const publicScripts = all.filter((s) => s.visibility === "public");

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

    if (!(await canAccess(ctx, script, identity.subject))) return null;

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

    const viewerId = identity.subject;
    const all = await ctx.db.query("scripts").collect();

    const filtered = [];
    for (const s of all) {
      if (!(await canAccess(ctx, s, viewerId))) continue;
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

    const viewerId = identity.subject;
    const all = await ctx.db.query("scripts").collect();
    const subjects = new Set<string>();

    for (const s of all) {
      if (!(await canAccess(ctx, s, viewerId))) continue;
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

// Räumt eine bereits hochgeladene, aber nie einem Skript zugeordnete Datei
// wieder auf — z.B. wenn die anschließende `create`-Mutation fehlschlägt
// (Kontingent erreicht, Netzwerkfehler), damit keine verwaisten Storage-Blobs
// zurückbleiben.
export const discardUpload = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    await ctx.storage.delete(args.storageId);
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
    type: v.union(v.literal("PDF"), v.literal("DOCX"), v.literal("PPTX"), v.literal("Notiz")),
    visibility: v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("jahrgang"),
      v.literal("group"),
    ),
    storageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    forumId: v.optional(v.id("forums")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Server-side file validation
    if (args.fileType !== undefined && !ALLOWED_MIME_TYPES.has(args.fileType)) {
      throw new Error(`Unzulässiger Dateityp: ${args.fileType}`);
    }
    if (args.fileSize !== undefined && args.fileSize > FILE_MAX_BYTES) {
      throw new Error("Datei darf maximal 25 MB groß sein.");
    }

    // Group visibility requires a forumId, and the caller must actually be a member
    if (args.visibility === "group") {
      if (!args.forumId) {
        throw new Error("Für Gruppen-Sichtbarkeit muss ein Forum ausgewählt werden.");
      }
      if (!(await isForumMember(ctx, args.forumId, identity.subject))) {
        throw new Error("Du bist kein Mitglied dieses Forums.");
      }
    }

    // Per-user quota
    const existing = await ctx.db
      .query("scripts")
      .withIndex("by_author", (q) => q.eq("authorId", identity.subject))
      .collect();
    if (existing.length >= MAX_SCRIPTS_PER_USER) {
      throw new Error(`Maximale Anzahl von ${MAX_SCRIPTS_PER_USER} Skripten pro Nutzer erreicht.`);
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    if (args.visibility === "jahrgang") requireKurs(profile);

    const authorName = profile?.displayName || identity.name || identity.email || "Unbekannt";
    const authorKurs = profile?.kurs ?? undefined;

    const now = Date.now();
    return await ctx.db.insert("scripts", {
      title: args.title.trim(),
      subject: args.subject,
      description: args.description.trim(),
      authorId: identity.subject,
      authorName,
      authorKurs,
      pages: args.pages,
      type: args.type,
      visibility: args.visibility,
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      forumId: args.forumId,
      createdAt: now,
      updatedAt: now,
    });
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
      v.union(v.literal("PDF"), v.literal("DOCX"), v.literal("PPTX"), v.literal("Notiz"))
    ),
    visibility: v.optional(
      v.union(
        v.literal("public"),
        v.literal("private"),
        v.literal("jahrgang"),
        v.literal("group"),
      )
    ),
    forumId: v.optional(v.id("forums")),
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
    if (args.visibility !== undefined) {
      if (args.visibility === "group") {
        const effectiveForumId = args.forumId ?? script.forumId;
        if (!effectiveForumId) {
          throw new Error("Für Gruppen-Sichtbarkeit muss ein Forum ausgewählt werden.");
        }
        if (!(await isForumMember(ctx, effectiveForumId, identity.subject))) {
          throw new Error("Du bist kein Mitglied dieses Forums.");
        }
      }
      if (args.visibility === "jahrgang") {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", identity.subject))
          .unique();
        requireKurs(profile);
        // Kurs des Autors zum Zeitpunkt der Freigabe übernehmen — sonst bliebe
        // authorKurs von der Erstellung (evtl. leer) stehen und niemand könnte
        // das Skript trotz bestandener Prüfung sehen.
        patch.authorKurs = profile.kurs;
      }
      patch.visibility = args.visibility;
    }
    if (args.forumId !== undefined) patch.forumId = args.forumId;

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
