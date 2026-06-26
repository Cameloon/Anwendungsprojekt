import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { parseJahrgang, calculateCurrentSemester } from "./semesterLectures";

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
    const userKurs = userJahrgang
      ? (() => {
          const m = userJahrgang.match(/^([A-Z]+)/);
          return m ? m[1] : null;
        })()
      : null;

    // Calculate current academic-year base semester
    // Year 1 → semesters 1+2, Year 2 → 3+4, etc.
    let userBaseSemester: number | null = null;
    if (userJahrgang) {
      try {
        const parsed = parseJahrgang(userJahrgang);
        const s = calculateCurrentSemester(parsed.entryYear);
        userBaseSemester = Math.floor((s - 1) / 2) * 2 + 1;
      } catch { /* ignore */ }
    }

    const allForums = await ctx.db.query("forums").collect();
    const allSections = await ctx.db.query("sections").collect();
    const sectionMap = new Map(allSections.map((s) => [s._id, s]));
    const myMemberships = await ctx.db
      .query("forumMembers")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    const memberForumIds = new Set(myMemberships.map((m) => m.forumId));

    const accessible = allForums.filter((f) => {
      // Check section access rules
      if (f.sectionId) {
        const section = sectionMap.get(f.sectionId);
        if (section?.accessRule === "tif_wif" && !isAdmin) {
          if (userKurs !== "TIF" && userKurs !== "WIF") return false;
        }
      }
      if (isAdmin) return true;
      if (memberForumIds.has(f._id)) return true;
      if (f.jahrgang && f.jahrgang !== userJahrgang) return false;
      // Filter lecture forums by academic year (show both semesters of the current year)
      if (f.isLectureForum && f.semesterNumber && userBaseSemester !== null) {
        if (f.semesterNumber !== userBaseSemester && f.semesterNumber !== userBaseSemester + 1) return false;
      }
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

    // Get per-user archive states
    const myArchiveStates = await ctx.db
      .query("forumArchiveStates")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    const archivedForumIds = new Set(myArchiveStates.map((a) => a.forumId));

    return await Promise.all(
      accessible.map(async (f) => {
        const members = await ctx.db
          .query("forumMembers")
          .withIndex("by_forum", (q) => q.eq("forumId", f._id))
          .collect();
        const filtered = members.filter((m) => !adminUserIds.has(m.userId));
        return { ...f, members: filtered, archivedByMe: archivedForumIds.has(f._id) };
      }),
    );
  },
});

export const getById = query({
  args: { forumId: v.id("forums") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const forum = await ctx.db.get(args.forumId);
    if (!forum) return null;

    const archiveState = await ctx.db
      .query("forumArchiveStates")
      .withIndex("by_forum_user", (q) =>
        q.eq("forumId", args.forumId).eq("userId", identity.subject)
      )
      .unique();

    return { ...forum, archivedByMe: !!archiveState };
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
    sectionId: v.optional(v.id("sections")),
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
      sectionId: args.sectionId,
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

    // Ensure the "Dein Jahrgang" section exists
    const allgemeinSection = await ctx.db
      .query("sections")
      .filter((q) => q.eq(q.field("name"), "Dein Jahrgang"))
      .first();
    let allgemeinSectionId = allgemeinSection?._id;
    if (!allgemeinSectionId) {
      const now = Date.now();
      allgemeinSectionId = await ctx.db.insert("sections", {
        name: "Dein Jahrgang",
        description: "Jahrgangsspezifische Foren (Allgemein, Vorlesungen, Gruppen)",
        accessRule: "all",
        displayOrder: 1,
        createdAt: now,
      });
    }

    const existing = await ctx.db
      .query("forums")
      .filter((q) => q.eq(q.field("name"), "Allgemein"))
      .filter((q) => q.eq(q.field("jahrgang"), jg))
      .first();

    if (existing) {
      if (existing.ownerId) {
        await ctx.db.patch(existing._id, { ownerId: undefined });
      }
      if (!existing.sectionId) {
        await ctx.db.patch(existing._id, { sectionId: allgemeinSectionId });
      }
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
      sectionId: allgemeinSectionId,
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

// ─── Archive ───

export const archive = mutation({
  args: { forumId: v.id("forums") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("forumArchiveStates")
      .withIndex("by_forum_user", (q) =>
        q.eq("forumId", args.forumId).eq("userId", identity.subject)
      )
      .unique();

    if (existing) return;

    await ctx.db.insert("forumArchiveStates", {
      forumId: args.forumId,
      userId: identity.subject,
      archivedAt: Date.now(),
    });
  },
});

export const unarchive = mutation({
  args: { forumId: v.id("forums") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("forumArchiveStates")
      .withIndex("by_forum_user", (q) =>
        q.eq("forumId", args.forumId).eq("userId", identity.subject)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const archiveOldLectureForums = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    const userJahrgang = profile?.jahrgang;
    if (!userJahrgang) return { archived: 0 };

    const allForums = await ctx.db.query("forums").collect();
    const lectureForums = allForums.filter(
      (f) => f.isLectureForum && f.jahrgang
    );

    // Get forums already archived by this user
    const myArchiveStates = await ctx.db
      .query("forumArchiveStates")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    const alreadyArchivedForumIds = new Set(myArchiveStates.map((a) => a.forumId));

    let archived = 0;
    for (const forum of lectureForums) {
      try {
        if (alreadyArchivedForumIds.has(forum._id)) continue;

        const m = forum.jahrgang!.match(/^([A-Z]+)(\d{2})/);
        if (!m) continue;
        const entryYear = 2000 + parseInt(m[2], 10);
        const now = new Date();
        const totalMonths =
          (now.getFullYear() - entryYear) * 12 + (now.getMonth() + 1 - 10);
        const currentSemester =
          totalMonths < 0 ? 1 : Math.floor(totalMonths / 6) + 1;

        if (forum.semesterNumber != null && forum.semesterNumber + 2 < currentSemester) {
          await ctx.db.insert("forumArchiveStates", {
            forumId: forum._id,
            userId: identity.subject,
            archivedAt: Date.now(),
          });
          archived++;
        }
      } catch {
        continue;
      }
    }

    return { archived };
  },
});

export const ensureDefaultSZIAndConnectForums = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const sections = await ctx.db.query("sections").collect();
    const sziSection = sections.find((s) => s.name === "SZI");
    const connectSection = sections.find((s) => s.name === "Campus");

    const now = Date.now();

    const ensureForum = async (name: string, description: string, sectionId: Id<"sections"> | undefined) => {
      if (!sectionId) return;
      const existing = await ctx.db
        .query("forums")
        .filter((q) => q.eq(q.field("name"), name))
        .filter((q) => q.eq(q.field("sectionId"), sectionId))
        .first();
      if (existing) return existing._id;
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      return     await ctx.db.insert("forums", {
        name,
        description,
        visibility: "public",
        inviteCode: code,
          sectionId,
          createdAt: now,
      });
    };

    await ensureForum("Allgemein", "Allgemeiner Austausch rund ums Studium am Studienzentrum", sziSection?._id);
    await ensureForum("Connect", "Austausch und Vernetzung für alle Studierenden", connectSection?._id);
  },
});

export const deleteForum = mutation({
  args: { forumId: v.id("forums") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (profile?.role !== "admin") throw new Error("Not authorized");

    const forum = await ctx.db.get(args.forumId);
    if (!forum) throw new Error("Forum not found");

    // Delete all forum members
    const members = await ctx.db
      .query("forumMembers")
      .withIndex("by_forum", (q) => q.eq("forumId", args.forumId))
      .collect();
    for (const m of members) await ctx.db.delete(m._id);

    // Delete all posts and their comments/likes
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_forum", (q) => q.eq("forumId", args.forumId))
      .collect();
    for (const post of posts) {
      const likes = await ctx.db
        .query("postLikes")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect();
      for (const l of likes) await ctx.db.delete(l._id);

      const comments = await ctx.db
        .query("postComments")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect();
      for (const c of comments) {
        const commentLikes = await ctx.db
          .query("commentLikes")
          .withIndex("by_comment", (q) => q.eq("commentId", c._id))
          .collect();
        for (const cl of commentLikes) await ctx.db.delete(cl._id);
        await ctx.db.delete(c._id);
      }

      await ctx.db.delete(post._id);
    }

    // Delete forum files
    const forumFiles = await ctx.db
      .query("forumFiles")
      .withIndex("by_forum", (q) => q.eq("forumId", args.forumId))
      .collect();
    for (const f of forumFiles) await ctx.db.delete(f._id);

    await ctx.db.delete(args.forumId);
  },
});

// ─── Migration ───

export const removeArchivedField = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (profile?.role !== "admin") throw new Error("Not authorized");

    const forums = await ctx.db.query("forums").collect();
    let cleaned = 0;
    for (const forum of forums) {
      const patch: Record<string, undefined> = {};
      if ("archived" in forum) {
        patch.archived = undefined;
      }
      if ("archivedAt" in forum) {
        patch.archivedAt = undefined;
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(forum._id, patch);
        cleaned++;
      }
    }
    return { cleaned };
  },
});
