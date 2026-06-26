const COURSES = [
  "INF", "TIF", "WIF", "BWL",
] as const;

const YEARS = ["23", "24", "25"] as const;
const CLASSES = ["A", "B", "C"] as const;

export const KURSE: string[] = COURSES.flatMap((c) =>
  YEARS.flatMap((y) => CLASSES.map((cl) => `${c}${y}${cl}`)),
);

export type Kurs = (typeof KURSE)[number];
