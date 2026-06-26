import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { IS_DEMO, demoStore, DemoProfile } from "@/lib/demoMode";

export interface AppProfile {
  display_name: string | null;
  studienfach: string | null;
  matrikelnummer: string | null;
  hochschule: string | null;
  kurs: string | null;
  avatar_url: string | null;
  created_at: string | null;
  role: "admin" | "user" | null;
}

const useDemoProfile = (): AppProfile | null => {
  const [p, setP] = useState<DemoProfile | null>(() => demoStore.getProfile());
  useEffect(() => demoStore.subscribe(() => setP(demoStore.getProfile())), []);
  if (!p) return null;
  return {
    display_name: p.displayName ?? null,
    studienfach: p.studienfach ?? null,
    matrikelnummer: p.matrikelnummer ?? null,
    hochschule: p.hochschule ?? null,
    kurs: p.kurs ?? null,
    avatar_url: p.avatarUrl ?? null,
    created_at: p.createdAt ? new Date(p.createdAt).toISOString() : null,
    role: p.role ?? null,
  };
};

const useConvexProfile = (): AppProfile | null => {
  const data = useQuery(api.profiles.getMine, {});
  if (!data) return null;
  return {
    display_name: data.displayName ?? null,
    studienfach: data.studienfach ?? null,
    matrikelnummer: data.matrikelnummer ?? null,
    hochschule: data.hochschule ?? null,
    kurs: data.kurs ?? null,
    avatar_url: data.avatarUrl ?? null,
    created_at: data.createdAt ? new Date(data.createdAt).toISOString() : null,
    role: data.role ?? null,
  };
};

export const useProfile = (): AppProfile | null =>
  IS_DEMO ? useDemoProfile() : useConvexProfile();
