import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    userId: v.string(),
    email: v.optional(v.string()),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    studienfach: v.optional(v.string()),
    matrikelnummer: v.optional(v.string()),
    hochschule: v.optional(v.string()),
    jahrgang: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("user"))),
    status: v.optional(
      v.union(v.literal("pending"), v.literal("active"), v.literal("rejected"))
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]).index("by_jahrgang", ["jahrgang"]),

  forums: defineTable({
    name: v.string(),
    description: v.string(),
    visibility: v.union(v.literal("public"), v.literal("private")),
    kurs: v.optional(v.string()),
    vorlesung: v.optional(v.string()),
    professor: v.optional(v.string()),
    standort: v.optional(v.string()),
    inviteCode: v.string(),
    allowedKurse: v.optional(v.array(v.string())),
    jahrgang: v.optional(v.string()),
    ownerId: v.optional(v.string()),
    deadlineId: v.optional(v.id("deadlines")),
    sectionId: v.optional(v.id("sections")),
    isLectureForum: v.optional(v.boolean()),
    semesterNumber: v.optional(v.number()),
    archived: v.optional(v.boolean()),
    archivedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_inviteCode", ["inviteCode"])
    .index("by_owner", ["ownerId"])
    .index("by_deadline", ["deadlineId"])
    .index("by_section", ["sectionId"]),

  forumArchiveStates: defineTable({
    forumId: v.id("forums"),
    userId: v.string(),
    archivedAt: v.number(),
  })
    .index("by_forum_user", ["forumId", "userId"])
    .index("by_user", ["userId"])
    .index("by_forum", ["forumId"]),

  forumMembers: defineTable({
    forumId: v.id("forums"),
    userId: v.string(),
    displayName: v.string(),
    joinedAt: v.number(),
  })
    .index("by_forum_user", ["forumId", "userId"])
    .index("by_forum", ["forumId"])
    .index("by_user", ["userId"]),

  forumFiles: defineTable({
    forumId: v.id("forums"),
    name: v.string(),
    description: v.optional(v.string()),
    storageId: v.id("_storage"),
    fileType: v.string(),
    fileSize: v.number(),
    uploadedBy: v.string(),
    createdAt: v.number(),
  }).index("by_forum", ["forumId"]),

  posts: defineTable({
    forumId: v.id("forums"),
    authorId: v.string(),
    authorName: v.string(),
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_forum", ["forumId"])
    .index("by_author", ["authorId"])
    .index("by_deadline", ["deadlineId"]),

  postFiles: defineTable({
    postId: v.id("posts"),
    name: v.string(),
    storageId: v.id("_storage"),
    fileType: v.string(),
    fileSize: v.number(),
    uploadedBy: v.string(),
    createdAt: v.number(),
  }).index("by_post", ["postId"]),

  postComments: defineTable({
    postId: v.id("posts"),
    authorId: v.string(),
    authorName: v.string(),
    content: v.string(),
    parentId: v.optional(v.id("postComments")),
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_parent", ["parentId"]),

  commentLikes: defineTable({
    commentId: v.id("postComments"),
    userId: v.string(),
  })
    .index("by_comment_user", ["commentId", "userId"])
    .index("by_comment", ["commentId"])
    .index("by_user", ["userId"]),

  postLikes: defineTable({
    postId: v.id("posts"),
    userId: v.string(),
  })
    .index("by_post_user", ["postId", "userId"])
    .index("by_post", ["postId"])
    .index("by_user", ["userId"]),

  deadlines: defineTable({
    title: v.string(),
    date: v.string(),
    category: v.union(
      v.literal("abgabe"),
      v.literal("pruefung"),
      v.literal("sonstiges")
    ),
    done: v.boolean(),
    note: v.optional(v.string()),
    vorlesung: v.optional(v.string()),
    declinedBy: v.optional(v.array(v.string())),
    visibility: v.union(v.literal("public"), v.literal("private")),
    invitees: v.optional(v.array(v.string())),
    allowedKurse: v.optional(v.array(v.string())),
    linkedScriptIds: v.optional(v.array(v.id("scripts"))),
    linkedGroupIds: v.optional(v.array(v.id("groups"))),
    ownerId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  deadlineAttachments: defineTable({
    deadlineId: v.id("deadlines"),
    name: v.string(),
    size: v.number(),
    type: v.string(),
    storageId: v.id("_storage"),
    uploadedBy: v.string(),
    createdAt: v.number(),
  }).index("by_deadline", ["deadlineId"]),

  deadlineMessages: defineTable({
    deadlineId: v.id("deadlines"),
    authorId: v.string(),
    authorName: v.string(),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_deadline", ["deadlineId"]),

  deadlineSubscribers: defineTable({
    deadlineId: v.id("deadlines"),
    userId: v.string(),
    done: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_deadline_user", ["deadlineId", "userId"])
    .index("by_user", ["userId"]),

  scripts: defineTable({
    title: v.string(),
    subject: v.string(),
    description: v.string(),
    authorId: v.string(),
    authorName: v.string(),
    pages: v.number(),
    type: v.union(
      v.literal("PDF"),
      v.literal("DOCX"),
      v.literal("Notiz")
    ),
    visibility: v.union(v.literal("public"), v.literal("private")),
    storageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    lectureId: v.optional(v.id("semesterLectures")),
  }).index("by_author", ["authorId"]),

  moderationLog: defineTable({
    postId: v.id("posts"),
    action: v.union(v.literal("edit"), v.literal("delete")),
    moderatorId: v.string(),
    moderatorName: v.string(),
    reason: v.optional(v.string()),
    postSnapshot: v.optional(
      v.object({
        title: v.string(),
        content: v.string(),
        authorId: v.string(),
        authorName: v.string(),
      })
    ),
    createdAt: v.number(),
  }).index("by_post", ["postId"]),

  groups: defineTable({
    name: v.string(),
    description: v.string(),
    inviteCode: v.string(),
    ownerId: v.string(),
    deadlineId: v.optional(v.id("deadlines")),
    archived: v.optional(v.boolean()),
    archivedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_inviteCode", ["inviteCode"])
    .index("by_owner", ["ownerId"])
    .index("by_deadline", ["deadlineId"]),

  groupFiles: defineTable({
    groupId: v.id("groups"),
    name: v.string(),
    storageId: v.id("_storage"),
    fileType: v.string(),
    fileSize: v.number(),
    uploadedBy: v.string(),
    createdAt: v.number(),
  }).index("by_group", ["groupId"]),

  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.string(),
    displayName: v.string(),
    joinedAt: v.number(),
  })
    .index("by_group_user", ["groupId", "userId"])
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"]),

  sections: defineTable({
    name: v.string(),
    description: v.string(),
    accessRule: v.optional(v.string()),
    displayOrder: v.number(),
    createdAt: v.number(),
  }).index("by_order", ["displayOrder"]),

  semesterLectures: defineTable({
    kurs: v.string(),
    semesterNumber: v.number(),
    lectureName: v.string(),
    createdAt: v.number(),
  }).index("by_kurs_semester", ["kurs", "semesterNumber"]),

  jahrgangLectures: defineTable({
    jahrgang: v.string(),
    lectureName: v.string(),
    semesterNumber: v.number(),
    createdAt: v.number(),
  }).index("by_jahrgang", ["jahrgang"]),

  feedback: defineTable({
    userId: v.string(),
    rating: v.number(),
    message: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  userReports: defineTable({
    userId: v.string(),
    type: v.union(v.literal("bug"), v.literal("feature")),
    message: v.string(),
    status: v.optional(v.union(v.literal("open"), v.literal("done"))),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  notifications: defineTable({
    type: v.union(
      v.literal("forum_invite"),
      v.literal("deadline_invite")
    ),
    recipientId: v.string(),
    recipientName: v.string(),
    fromId: v.string(),
    fromName: v.string(),
    title: v.string(),
    message: v.optional(v.string()),
    forumId: v.optional(v.id("forums")),
    deadlineId: v.optional(v.id("deadlines")),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined")
    ),
    createdAt: v.number(),
  }).index("by_recipient", ["recipientId"]),
});
