// Gemeinsame Helfer für Convex-Backend-Tests (siehe convex-test).

export function identity(subject: string) {
  return { subject };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createProfile(
  t: any,
  userId: string,
  opts: { role?: "admin" | "user"; kurs?: string } = {},
) {
  await t.run(async (ctx: any) => {
    await ctx.db.insert("profiles", {
      userId,
      role: opts.role ?? "user",
      kurs: opts.kurs,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });
}
