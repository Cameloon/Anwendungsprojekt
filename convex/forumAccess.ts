// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function isAdmin(ctx: any, userId: string): Promise<boolean> {
  const profile = await ctx.db
    .query("profiles")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .unique();
  return profile?.role === "admin";
}

// Öffentliche Foren sind für jeden eingeloggten Nutzer lesbar; private nur für
// Mitglieder oder Admins (gleiche Regel wie beim Erstellen von Posts). Geteilt
// zwischen posts.ts und forums.ts, damit die Zugriffsregel nur an einer Stelle
// gepflegt werden muss.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function canAccessForum(ctx: any, forum: any, userId: string): Promise<boolean> {
  if (forum.visibility !== "private") return true;
  const member = await ctx.db
    .query("forumMembers")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_forum_user", (q: any) =>
      q.eq("forumId", forum._id).eq("userId", userId)
    )
    .unique();
  if (member) return true;
  return await isAdmin(ctx, userId);
}
