import { internalMutation } from "./_generated/server";

/**
 * Migration: copy jahrgang → kurs (field rename)
 *
 * Run: npx convex run migrations:renameJahrgangToKurs
 *
 * Fields migrated:
 *   profiles.jahrgang      → profiles.kurs
 *   forums.jahrgang        → forums.kurs
 *   scripts.authorJahrgang → scripts.authorKurs
 *   jahrgangLectures.jahrgang → jahrgangLectures.kurs
 */
export const renameJahrgangToKurs = internalMutation({
  handler: async (ctx) => {
    let total = 0;

    const profiles = await ctx.db.query("profiles").collect();
    for (const p of profiles) {
      if ((p as any).jahrgang !== undefined && p.kurs === undefined) {
        await ctx.db.patch(p._id, { kurs: (p as any).jahrgang });
        total++;
      }
    }

    const forums = await ctx.db.query("forums").collect();
    for (const f of forums) {
      if ((f as any).jahrgang !== undefined && f.kurs === undefined) {
        await ctx.db.patch(f._id, { kurs: (f as any).jahrgang });
        total++;
      }
    }

    const scripts = await ctx.db.query("scripts").collect();
    for (const s of scripts) {
      if ((s as any).authorJahrgang !== undefined && s.authorKurs === undefined) {
        await ctx.db.patch(s._id, { authorKurs: (s as any).authorJahrgang });
        total++;
      }
    }

    const lectures = await ctx.db.query("jahrgangLectures").collect();
    for (const l of lectures) {
      if ((l as any).jahrgang !== undefined && l.kurs === undefined) {
        await ctx.db.patch(l._id, { kurs: (l as any).jahrgang });
        total++;
      }
    }

    return { migrated: total };
  },
});

/**
 * Cleanup: deduplicate lecture forums created during the jahrgang→kurs rename.
 *
 * When ensureLectureForumsForProfile started querying by "kurs" instead of
 * "jahrgang", it didn't find the old forums (which only had jahrgang set),
 * so it created new duplicates with kurs set.
 *
 * This deletes the duplicate (empty) lecture forums and patches the old ones
 * so they have the same fields as the duplicate.
 *
 * Run: npx convex run migrations:deduplicateLectureForums
 */
export const deduplicateLectureForums = internalMutation({
  handler: async (ctx) => {
    let deleted = 0;
    let patched = 0;

    // Get all lecture forums
    const allForums = await ctx.db.query("forums").collect();
    const lectureForums = allForums.filter((f) => f.isLectureForum);

    // Group by name (which includes kurs, e.g. "Mathematik 1 (TIF25B)")
    const byName = new Map<string, typeof lectureForums>();
    for (const f of lectureForums) {
      const existing = byName.get(f.name) || [];
      existing.push(f);
      byName.set(f.name, existing);
    }

    for (const [, forums] of byName) {
      if (forums.length < 2) continue;

      // Sort: prefer the one with members, then the older one
      const withMemberCount = await Promise.all(
        forums.map(async (f) => {
          const count = await ctx.db
            .query("forumMembers")
            .withIndex("by_forum", (q: any) => q.eq("forumId", f._id))
            .collect();
          return { forum: f, memberCount: count.length };
        }),
      );
      withMemberCount.sort((a, b) => b.memberCount - a.memberCount);

      // Keep the first (most members or oldest), delete the rest
      const [keep, ...remove] = withMemberCount;

      // Patch the kept forum with any fields the duplicate might have had
      for (const r of remove) {
        if (!keep.forum.kurs && r.forum.kurs) {
          await ctx.db.patch(keep.forum._id, { kurs: r.forum.kurs });
        }
        if (!keep.forum.semesterNumber && r.forum.semesterNumber) {
          await ctx.db.patch(keep.forum._id, { semesterNumber: r.forum.semesterNumber });
        }
        // Move members from duplicate to kept forum
        if (r.memberCount > 0) {
          const members = await ctx.db
            .query("forumMembers")
            .withIndex("by_forum", (q: any) => q.eq("forumId", r.forum._id))
            .collect();
          for (const m of members) {
            const alreadyMember = await ctx.db
              .query("forumMembers")
              .withIndex("by_forum_user", (q: any) =>
                q.eq("forumId", keep.forum._id).eq("userId", m.userId),
              )
              .unique();
            if (!alreadyMember) {
              await ctx.db.insert("forumMembers", {
                forumId: keep.forum._id,
                userId: m.userId,
                displayName: m.displayName,
                joinedAt: m.joinedAt,
              });
            }
          }
        }
        // Delete old forum
        await ctx.db.delete(r.forum._id);
        deleted++;
        patched++;
      }
    }

    return { deleted, patched, remaining: byName.size };
  },
});

/**
 * Find "Allgemein" forums with "Kurs" in the description — should remove
 * the one that was wrongly created after the jahrgang→kurs rename.
 *
 * Run: npx convex run migrations:cleanupAllgemeinForums
 */
export const cleanupAllgemeinForums = internalMutation({
  handler: async (ctx) => {
    const forums = await ctx.db.query("forums").collect();
    const allgemein = forums.filter(f => f.name === "Allgemein" && f.description?.includes("Kurs"));

    let deleted = 0;
    for (const f of allgemein) {
      // Delete forum members for this forum
      const members = await ctx.db
        .query("forumMembers")
        .withIndex("by_forum", (q: any) => q.eq("forumId", f._id))
        .collect();
      for (const m of members) {
        await ctx.db.delete(m._id);
      }
      await ctx.db.delete(f._id);
      deleted++;
    }
    return { deleted, names: allgemein.map(f => f.name), descs: allgemein.map(f => f.description) };
  },
});
