import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

async function enrichPost(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  post: Doc<"posts">,
  userId: string
) {
  const like = await ctx.db
    .query("postLikes")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_post_user", (q: any) =>
      q.eq("postId", post._id).eq("userId", userId)
    )
    .unique();

  const allLikes = await ctx.db
    .query("postLikes")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_post", (q: any) => q.eq("postId", post._id))
    .collect();

  const comments = await ctx.db
    .query("postComments")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_post", (q: any) => q.eq("postId", post._id))
    .collect();

  const enrichedComments = await Promise.all(
    comments.map(async (comment: Doc<"postComments">) => {
      const commentLike = await ctx.db
        .query("commentLikes")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .withIndex("by_comment_user", (q: any) =>
          q.eq("commentId", comment._id).eq("userId", userId)
        )
        .unique();

      const allCommentLikes = await ctx.db
        .query("commentLikes")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .withIndex("by_comment", (q: any) => q.eq("commentId", comment._id))
        .collect();

      return {
        ...comment,
        liked: !!commentLike,
        likeCount: allCommentLikes.length,
      };
    })
  );

  return {
    ...post,
    liked: !!like,
    likeCount: allLikes.length,
    replies: comments.length,
    comments: enrichedComments,
  };
}

async function isAdmin(ctx: any, userId: string): Promise<boolean> {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .unique();
  return profile?.role === "admin";
}

// ─── Queries ───

export const listByForum = query({
  args: { forumId: v.id("forums") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_forum", (q) => q.eq("forumId", args.forumId))
      .order("desc")
      .collect();

    return await Promise.all(
      posts.map((post) => enrichPost(ctx, post, identity.subject))
    );
  },
});

export const getById = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const post = await ctx.db.get(args.postId);
    if (!post) return null;
    return await enrichPost(ctx, post, identity.subject);
  },
});

export const getComments = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db
      .query("postComments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .order("asc")
      .collect();
  },
});

export const checkLiked = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const like = await ctx.db
      .query("postLikes")
      .withIndex("by_post_user", (q) =>
        q.eq("postId", args.postId).eq("userId", identity.subject)
      )
      .unique();
    return !!like;
  },
});

export const getLikeCount = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const likes = await ctx.db
      .query("postLikes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    return likes.length;
  },
});

// ─── Mutations ───

export const create = mutation({
  args: {
    forumId: v.id("forums"),
    title: v.string(),
    content: v.string(),
    tag: v.union(
      v.literal("frage"),
      v.literal("lerngruppe"),
      v.literal("material"),
      v.literal("diskussion")
    ),
    visibility: v.optional(
      v.union(v.literal("public"), v.literal("private"))
    ),
    sketch: v.optional(v.string()),
    linkedScriptIds: v.optional(v.array(v.id("scripts"))),
    linkedDeadlineIds: v.optional(v.array(v.id("deadlines"))),
    source: v.optional(v.string()),
    taskId: v.optional(v.string()),
    deadlineId: v.optional(v.id("deadlines")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const forum = await ctx.db.get(args.forumId);
    if (!forum) throw new Error("Forum not found");

    if (forum.visibility === "private") {
      const member = await ctx.db
        .query("forumMembers")
        .withIndex("by_forum_user", (q) =>
          q.eq("forumId", args.forumId).eq("userId", identity.subject)
        )
        .unique();
      if (!member) {
        const admin = await isAdmin(ctx, identity.subject);
        if (!admin) throw new Error("Not a member of this forum");
      }
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    const authorName =
      profile?.displayName || identity.name || identity.email || "Unbekannt";

    const now = Date.now();
    const postId = await ctx.db.insert("posts", {
      forumId: args.forumId,
      authorId: identity.subject,
      authorName,
      title: args.title.trim(),
      content: args.content.trim(),
      tag: args.tag,
      visibility: args.visibility,
      sketch: args.sketch,
      linkedScriptIds: args.linkedScriptIds,
      linkedDeadlineIds: args.linkedDeadlineIds,
      source: args.source,
      taskId: args.taskId,
      deadlineId: args.deadlineId,
      createdAt: now,
      updatedAt: now,
    });

    return postId;
  },
});

export const update = mutation({
  args: {
    postId: v.id("posts"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    tag: v.optional(
      v.union(
        v.literal("frage"),
        v.literal("lerngruppe"),
        v.literal("material"),
        v.literal("diskussion")
      )
    ),
    visibility: v.optional(
      v.union(v.literal("public"), v.literal("private"))
    ),
    sketch: v.optional(v.string()),
    linkedScriptIds: v.optional(v.array(v.id("scripts"))),
    linkedDeadlineIds: v.optional(v.array(v.id("deadlines"))),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const admin = await isAdmin(ctx, identity.subject);
    if (post.authorId !== identity.subject && !admin)
      throw new Error("Not authorized");

    const isModeration = post.authorId !== identity.subject && admin;

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) patch.title = args.title.trim();
    if (args.content !== undefined) patch.content = args.content.trim();
    if (args.tag !== undefined) patch.tag = args.tag;
    if (args.visibility !== undefined) patch.visibility = args.visibility;
    if (args.sketch !== undefined) patch.sketch = args.sketch;
    if (args.linkedScriptIds !== undefined)
      patch.linkedScriptIds = args.linkedScriptIds;
    if (args.linkedDeadlineIds !== undefined)
      patch.linkedDeadlineIds = args.linkedDeadlineIds;

    await ctx.db.patch(args.postId, patch);

    if (isModeration) {
      await ctx.db.insert("moderationLog", {
        postId: args.postId,
        action: "edit",
        moderatorId: identity.subject,
        moderatorName:
          (await ctx.db
            .query("profiles")
            .withIndex("by_user", (q: any) => q.eq("userId", identity.subject))
            .unique())?.displayName || identity.name || "Admin",
        reason: args.reason,
        postSnapshot: post
          ? {
              title: post.title,
              content: post.content,
              authorId: post.authorId,
              authorName: post.authorName,
            }
          : undefined,
        createdAt: Date.now(),
      });
    }
  },
});

export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const admin = await isAdmin(ctx, identity.subject);
    if (!admin) throw new Error("Not authorized");

    await ctx.db.insert("moderationLog", {
      postId: args.postId,
      action: "delete",
      moderatorId: identity.subject,
      moderatorName:
        (await ctx.db
          .query("profiles")
          .withIndex("by_user", (q: any) => q.eq("userId", identity.subject))
          .unique())?.displayName || identity.name || "Admin",
      reason: args.reason,
      postSnapshot: {
        title: post.title,
        content: post.content,
        authorId: post.authorId,
        authorName: post.authorName,
      },
      createdAt: Date.now(),
    });

    const comments = await ctx.db
      .query("postComments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const c of comments) {
      const commentLikeRecords = await ctx.db
        .query("commentLikes")
        .withIndex("by_comment", (q: any) => q.eq("commentId", c._id))
        .collect();
      for (const cl of commentLikeRecords) await ctx.db.delete(cl._id);
      await ctx.db.delete(c._id);
    }

    const likes = await ctx.db
      .query("postLikes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const l of likes) await ctx.db.delete(l._id);

    await ctx.db.delete(args.postId);
  },
});

// ─── Comments ───

export const addComment = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
    parentId: v.optional(v.id("postComments")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    const authorName =
      profile?.displayName || identity.name || identity.email || "Unbekannt";

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    await ctx.db.insert("postComments", {
      postId: args.postId,
      authorId: identity.subject,
      authorName,
      content: args.content.trim(),
      parentId: args.parentId,
      createdAt: Date.now(),
    });
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("postComments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    const admin = await isAdmin(ctx, identity.subject);
    if (comment.authorId !== identity.subject && !admin)
      throw new Error("Not authorized");

    const likes = await ctx.db
      .query("commentLikes")
      .withIndex("by_comment", (q) => q.eq("commentId", args.commentId))
      .collect();
    for (const l of likes) await ctx.db.delete(l._id);

    const childReplies = await ctx.db
      .query("postComments")
      .withIndex("by_parent", (q) => q.eq("parentId", args.commentId))
      .collect();
    for (const child of childReplies) {
      const childLikes = await ctx.db
        .query("commentLikes")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .withIndex("by_comment", (q: any) => q.eq("commentId", child._id))
        .collect();
      for (const cl of childLikes) await ctx.db.delete(cl._id);
      await ctx.db.delete(child._id);
    }

    await ctx.db.delete(args.commentId);
  },
});

export const updateComment = mutation({
  args: {
    commentId: v.id("postComments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    const admin = await isAdmin(ctx, identity.subject);
    if (comment.authorId !== identity.subject && !admin)
      throw new Error("Not authorized");

    await ctx.db.patch(args.commentId, {
      content: args.content.trim(),
    });
  },
});

// ─── Likes ───

export const toggleLike = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const existing = await ctx.db
      .query("postLikes")
      .withIndex("by_post_user", (q) =>
        q.eq("postId", args.postId).eq("userId", identity.subject)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { liked: false };
    } else {
      await ctx.db.insert("postLikes", {
        postId: args.postId,
        userId: identity.subject,
      });
      return { liked: true };
    }
  },
});

export const toggleCommentLike = mutation({
  args: { commentId: v.id("postComments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    const existing = await ctx.db
      .query("commentLikes")
      .withIndex("by_comment_user", (q) =>
        q.eq("commentId", args.commentId).eq("userId", identity.subject)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { liked: false };
    } else {
      await ctx.db.insert("commentLikes", {
        commentId: args.commentId,
        userId: identity.subject,
      });
      return { liked: true };
    }
  },
});

// ─── Moderation Log ───

export const listRecent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q: any) => q.eq("userId", identity.subject))
      .unique();
    const userKurs = profile?.kurs;
    const isAdmin = profile?.role === "admin";

    const forums = await ctx.db.query("forums").collect();
    const accessibleIds: string[] = [];

    for (const forum of forums) {
      if (isAdmin) {
        accessibleIds.push(forum._id);
        continue;
      }
      if (forum.visibility === "public") {
        if (forum.kurs && forum.kurs !== userKurs) continue;
        accessibleIds.push(forum._id);
        continue;
      }
      const member = await ctx.db
        .query("forumMembers")
        .withIndex("by_forum_user", (q: any) =>
          q.eq("forumId", forum._id).eq("userId", identity.subject)
        )
        .unique();
      if (member) accessibleIds.push(forum._id);
    }

    const allPosts = await ctx.db
      .query("posts")
      .order("desc")
      .take(50);

    const accessiblePosts = allPosts.filter((p) =>
      accessibleIds.includes(p.forumId)
    );

    const forumMap = new Map(forums.map((f) => [f._id, f]));

    const enriched = await Promise.all(
      accessiblePosts.map(async (p) => {
        const post = await enrichPost(ctx, p, identity.subject);
        const forum = forumMap.get(p.forumId);
        return { ...post, vorlesung: forum?.vorlesung ?? null };
      })
    );

    return enriched.slice(0, 20);
  },
});

export const getModerationLog = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const admin = await isAdmin(ctx, identity.subject);
    if (!admin) throw new Error("Not authorized");

    return await ctx.db
      .query("moderationLog")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .order("desc")
      .collect();
  },
});

// ─── Post Files ───

export const generatePostUploadUrl = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

export const attachPostFile = mutation({
  args: {
    postId: v.id("posts"),
    name: v.string(),
    storageId: v.id("_storage"),
    fileType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.insert("postFiles", {
      postId: args.postId,
      name: args.name,
      storageId: args.storageId,
      fileType: args.fileType,
      fileSize: args.fileSize,
      uploadedBy: identity.subject,
      createdAt: Date.now(),
    });
  },
});

export const getPostFiles = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const files = await ctx.db
      .query("postFiles")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    return await Promise.all(
      files.map(async (f) => ({
        ...f,
        url: await ctx.storage.getUrl(f.storageId),
      })),
    );
  },
});

export const deletePostFile = mutation({
  args: { fileId: v.id("postFiles") },
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
