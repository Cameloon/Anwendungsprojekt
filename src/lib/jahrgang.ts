const COURSES = [
  "INF", "TIF", "WIF", "BWL", "MAB", "ETE", "MEC", "DSA", "AI", "SEC", "WI",
] as const;

const YEARS = ["22", "23", "24", "25", "26", "27"] as const;
const CLASSES = ["A", "B", "C"] as const;

export const JAHRGAENGE: string[] = COURSES.flatMap((c) =>
  YEARS.flatMap((y) => CLASSES.map((cl) => `${c}${y}${cl}`)),
);

export type Jahrgang = (typeof JAHRGAENGE)[number];
