import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

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

/**
 * Backfill missing sectionId on old lecture forums and "Allgemein" forums.
 *
 * Run: npx convex run migrations:backfillSectionIds
 */
export const backfillSectionIds = internalMutation({
  handler: async (ctx) => {
    const sections = await ctx.db.query("sections").collect();
    const deinJahrgang = sections.find((s) => s.name === "Dein Jahrgang");
    const szi = sections.find((s) => s.name === "SZI");
    const campus = sections.find((s) => s.name === "Campus");
    if (!deinJahrgang) return { error: "Section 'Dein Jahrgang' not found" };

    const allForums = await ctx.db.query("forums").collect();
    let patched = 0;

    for (const f of allForums) {
      if (f.sectionId) continue;

      // Match lecture forums by name pattern "LectureName (KURS)" — catches both
      // flagged (isLectureForum) and unflagged (older) lecture forums
      const isLectureByName = f.kurs && /\([A-Z]+\d{2}[A-Z]\)$/.test(f.name);

      if (isLectureByName || f.isLectureForum) {
        await ctx.db.patch(f._id, { sectionId: deinJahrgang._id, isLectureForum: true });
        patched++;
      } else if (f.name === "Allgemein" && f.kurs) {
        await ctx.db.patch(f._id, { sectionId: deinJahrgang._id });
        patched++;
      }
    }

    return { patched };
  },
});

/**
 * Merge forums from old/extra sections into the canonical sidebar sections.
 * Run: npx convex run migrations:mergeExtraSections
 */
export const mergeExtraSections = internalMutation({
  handler: async (ctx) => {
    const sections = await ctx.db.query("sections").collect();
    const deinJahrgang = sections.find((s) => s.name === "Dein Jahrgang");
    const campus = sections.find((s) => s.name === "Campus");
    if (!deinJahrgang || !campus) return { error: "Required sections not found" };

    // Map old section names → target section _id
    const sectionNameToTarget = new Map<string, Id<"sections">>([
      ["Allgemein", deinJahrgang._id],
      ["Archiv", deinJahrgang._id],
      ["Connect", campus._id],
    ]);

    const allForums = await ctx.db.query("forums").collect();
    let moved = 0;

    for (const f of allForums) {
      if (!f.sectionId) continue;
      const section = sections.find((s) => s._id === f.sectionId);
      if (!section) continue; // orphaned, already caught by backfillSectionIds
      const targetId = sectionNameToTarget.get(section.name);
      if (targetId && f.sectionId !== targetId) {
        await ctx.db.patch(f._id, { sectionId: targetId });
        moved++;
      }
    }

    return { moved };
  },
});

/**
 * Clean up stale archive states that were created for forums NOT in the
 * user's own kurs (before archiveOldLectureForums was fixed to filter by kurs).
 * Run: npx convex run migrations:cleanupStaleArchives
 */
export const cleanupStaleArchives = internalMutation({
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    const forums = await ctx.db.query("forums").collect();
    let deleted = 0;

    for (const profile of profiles) {
      if (!profile.kurs) continue;
      const states = await ctx.db
        .query("forumArchiveStates")
        .withIndex("by_user", (q: any) => q.eq("userId", profile.userId))
        .collect();

      for (const state of states) {
        const forum = forums.find((f) => f._id === state.forumId);
        if (!forum || !forum.kurs) {
          // Forum deleted or has no kurs — safe to remove archive state
          await ctx.db.delete(state._id);
          deleted++;
        } else if (forum.kurs !== profile.kurs) {
          // Forum belongs to a different kurs — not relevant to this user
          await ctx.db.delete(state._id);
          deleted++;
        }
      }
    }

    return { deleted };
  },
});

/**
 * Deduplicate "Connect" forums in the Campus section.
 * Run: npx convex run migrations:deduplicateConnectForums
 */
export const deduplicateConnectForums = internalMutation({
  handler: async (ctx) => {
    const allForums = await ctx.db.query("forums").collect();
    const connectForums = allForums.filter((f) => f.name === "Connect");
    if (connectForums.length < 2) return { deleted: 0, kept: connectForums.length };

    // Keep the one with more members, delete the rest
    const withCounts = await Promise.all(
      connectForums.map(async (f) => {
        const members = await ctx.db
          .query("forumMembers")
          .withIndex("by_forum", (q: any) => q.eq("forumId", f._id))
          .collect();
        return { forum: f, members };
      }),
    );
    withCounts.sort((a, b) => b.members.length - a.members.length);
    const [keep, ...remove] = withCounts;

    for (const r of remove) {
      for (const m of r.members) {
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
      await ctx.db.delete(r.forum._id);
    }

    return { deleted: remove.length, kept: 1 };
  },
});

/**
 * Debug: list forums in a section by name.
 * Run: npx convex run migrations:debugSectionForums
 */
export const debugSectionForums = internalMutation({
  handler: async (ctx) => {
    const sections = await ctx.db.query("sections").collect();
    const campus = sections.find((s) => s.name === "Campus");
    const allForums = await ctx.db.query("forums").collect();
    const campusForums = allForums.filter((f) => f.sectionId === campus?._id);
    return campusForums.map((f) => ({ name: f.name, description: f.description, kurs: f.kurs }));
  },
});

/**
 * One-time: add sample feedback ratings + bug/feature reports for real users
 * in Kurs TIF25B (DHBW Lörrach, Studienfach Informatik) — for demo/testing
 * purposes. Only touches matching profiles; skips users who already submitted
 * real feedback so nothing genuine gets overwritten. Not idempotent for
 * reports — meant to be run exactly once.
 *
 * Run: npx convex run migrations:addSampleFeedbackTif25bLoerrach
 */
export const addSampleFeedbackTif25bLoerrach = internalMutation({
  handler: async (ctx) => {
    const profiles = (
      await ctx.db
        .query("profiles")
        .withIndex("by_kurs", (q) => q.eq("kurs", "TIF25B"))
        .collect()
    ).filter(
      (p) => p.hochschule === "DHBW Lörrach" && p.studienfach === "Informatik",
    );

    if (profiles.length === 0) {
      return {
        error:
          "Keine Profile in Kurs TIF25B / DHBW Lörrach / Informatik gefunden",
      };
    }

    const now = Date.now();

    const sampleFeedback: { rating: number; message?: string }[] = [
      { rating: 4, message: "Die neue Terminübersicht für Deadlines ist super übersichtlich!" },
      { rating: 4, message: "Endlich finde ich alle Skripte meines Kurses an einem Ort." },
      { rating: 3, message: "Insgesamt gut, aber die Suche in den Foren könnte schneller sein." },
      { rating: 4 },
      { rating: 2, message: "Die App stürzt bei mir manchmal beim Hochladen von Dateien ab." },
      { rating: 3, message: "Benachrichtigungen kommen teilweise mit Verzögerung an." },
      { rating: 4, message: "Sehr gutes Design, macht Spaß die App zu nutzen." },
      { rating: 1, message: "Login über Clerk hat bei mir mehrmals nicht funktioniert." },
      { rating: 3 },
      { rating: 4, message: "Die Lerngruppen-Funktion hat mir sehr geholfen, Mitstudierende zu finden." },
      { rating: 2, message: "Auf dem Handy ist die Navigation etwas fummelig." },
      { rating: 3, message: "Gute Idee, aber es fehlen noch ein paar Kurse in der Auswahl." },
    ];

    const sampleReports: { type: "bug" | "feature"; message: string }[] = [
      {
        type: "bug",
        message:
          "Beim Hochladen eines PDFs in einem Forumsbeitrag bricht der Upload nach ca. 10 Sekunden ab, ohne Fehlermeldung.",
      },
      {
        type: "bug",
        message:
          "Wenn ich eine Deadline bearbeite und den Titel ändere, wird die alte Erinnerung nicht aktualisiert.",
      },
      {
        type: "bug",
        message:
          "Auf dem iPhone (Safari) überlappt die Navbar den Seiteninhalt auf der Gruppen-Seite.",
      },
      {
        type: "bug",
        message:
          "Kommentare in einem Forenpost werden manchmal doppelt angezeigt, nachdem ich die Seite neu geladen habe.",
      },
      {
        type: "feature",
        message:
          "Es wäre super, wenn man Deadlines direkt in den Kalender exportieren könnte (ICS-Datei).",
      },
      {
        type: "feature",
        message:
          "Ein Dark-Mode-Umschalter direkt in der Navbar wäre praktisch, statt nur in den Einstellungen.",
      },
      {
        type: "feature",
        message:
          "Bitte eine Suchfunktion über alle Skripte hinweg, nicht nur innerhalb eines Kurses.",
      },
      {
        type: "feature",
        message:
          "Push-Benachrichtigungen für neue Antworten in abonnierten Themen wären hilfreich.",
      },
      {
        type: "feature",
        message:
          "Man könnte Lerngruppen taggen (z. B. 'Prüfungsvorbereitung', 'Projekt'), um sie leichter zu finden.",
      },
    ];

    let feedbackCreated = 0;
    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      const existing = await ctx.db
        .query("feedback")
        .withIndex("by_user", (q) => q.eq("userId", profile.userId))
        .unique();
      if (existing) continue;
      const sample = sampleFeedback[i % sampleFeedback.length];
      await ctx.db.insert("feedback", {
        userId: profile.userId,
        rating: sample.rating,
        message: sample.message,
        updatedAt: now - i * 3_600_000,
      });
      feedbackCreated++;
    }

    let reportsCreated = 0;
    for (let i = 0; i < sampleReports.length; i++) {
      const profile = profiles[i % profiles.length];
      const sample = sampleReports[i];
      await ctx.db.insert("userReports", {
        userId: profile.userId,
        type: sample.type,
        message: sample.message,
        status: "open",
        createdAt: now - i * 7_200_000,
      });
      reportsCreated++;
    }

    return { profilesFound: profiles.length, feedbackCreated, reportsCreated };
  },
});

/**
 * Debug: show forum+section grouping.
 * Run: npx convex run migrations:debugSectionMapping
 */
export const debugSectionMapping = internalMutation({
  handler: async (ctx) => {
    const sections = await ctx.db.query("sections").collect();
    const allForums = await ctx.db.query("forums").collect();
    const sectionMap = new Map<string, number>();
    for (const f of allForums) {
      if (f.sectionId) {
        sectionMap.set(f.sectionId, (sectionMap.get(f.sectionId) || 0) + 1);
      }
    }
    return {
      sectionCounts: [...sectionMap.entries()].map(([id, count]) => ({
        sectionId: id,
        sectionName: sections.find(s => s._id === id)?.name || "DELETED",
        count,
      })),
      noSectionCount: allForums.filter(f => !f.sectionId).length,
    };
  },
});


