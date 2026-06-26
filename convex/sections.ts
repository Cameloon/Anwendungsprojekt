import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    const sections = await ctx.db
      .query("sections")
      .withIndex("by_order")
      .collect();

    const userKurs = profile?.kurs
      ? (() => {
          try {
            const m = profile.kurs!.match(/^([A-Z]+)/);
            return m ? m[1] : null;
          } catch {
            return null;
          }
        })()
      : null;

    return sections.filter((s) => {
      if (!s.accessRule) return true;
      if (s.accessRule === "all") return true;
      if (s.accessRule === "tif_wif") {
        return userKurs === "TIF" || userKurs === "WIF" || profile?.role === "admin";
      }
      return true;
    });
  },
});

export const getById = query({
  args: { sectionId: v.id("sections") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.db.get(args.sectionId);
  },
});

export const manage = mutation({
  args: {
    id: v.optional(v.id("sections")),
    name: v.string(),
    description: v.string(),
    accessRule: v.optional(v.string()),
    displayOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const caller = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (caller?.role !== "admin") throw new Error("Not authorized");

    if (args.id) {
      await ctx.db.patch(args.id, {
        name: args.name.trim(),
        description: args.description.trim(),
        accessRule: args.accessRule || undefined,
        displayOrder: args.displayOrder,
      });
      return args.id;
    }

    return await ctx.db.insert("sections", {
      name: args.name.trim(),
      description: args.description.trim(),
      accessRule: args.accessRule || undefined,
      displayOrder: args.displayOrder,
      createdAt: Date.now(),
    });
  },
});

export const deleteSection = mutation({
  args: { sectionId: v.id("sections") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const caller = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (caller?.role !== "admin") throw new Error("Not authorized");

    const forumsInSection = await ctx.db
      .query("forums")
      .withIndex("by_section", (q) => q.eq("sectionId", args.sectionId))
      .collect();

    for (const f of forumsInSection) {
      await ctx.db.patch(f._id, { sectionId: undefined });
    }

    await ctx.db.delete(args.sectionId);
  },
});

export const seedDefaultSections = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db.query("sections").collect();
    const existingNames = new Set(existing.map((s) => s.name));

    const now = Date.now();
    const defaults = [
      { name: "Dein Jahrgang", description: "Jahrgangsspezifische Foren (Allgemein, Vorlesungen, Gruppen)", accessRule: "all", displayOrder: 1 },
      { name: "SZI", description: "Studienzentrum Informatik – für TIF und WIF Studiengänge", accessRule: "tif_wif", displayOrder: 2 },
      { name: "Campus", description: "Austausch für alle Studierenden – unabhängig vom Kurs", accessRule: "all", displayOrder: 3 },
      { name: "Archiv", description: "Archivierte Foren und Gruppen", accessRule: "all", displayOrder: 99 },
    ];

    let created = 0;
    for (const s of defaults) {
      if (!existingNames.has(s.name)) {
        await ctx.db.insert("sections", { ...s, createdAt: now });
        created++;
      }
    }

    return { created, message: created > 0 ? `Created ${created} missing sections` : "All sections already exist" };
  },
});
