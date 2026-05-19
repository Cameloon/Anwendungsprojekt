export const DHBW_STANDORTE = [
  "DHBW Stuttgart",
  "DHBW Mannheim",
  "DHBW Karlsruhe",
  "DHBW Heidenheim",
  "DHBW Heilbronn",
  "DHBW Lörrach",
  "DHBW Mosbach",
  "DHBW Ravensburg",
  "DHBW Villingen-Schwenningen",
  "DHBW Center for Advanced Studies (CAS)",
] as const;

export type DhbwStandort = (typeof DHBW_STANDORTE)[number];
