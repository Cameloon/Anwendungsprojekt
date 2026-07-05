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
  language_setting: "english" | "german" | null;
}

const useDemoProfile = (): AppProfile | null => {
  const [p, setP] = useState<DemoProfile | null>(() => demoStore.getProfile());
  useEffect(() => demoStore.subscribe(() => setP(demoStore.getProfile())), []);
  if (!p) return null;
  return {
    display_name: p.display_name ?? null,
    studienfach: p.studienfach ?? null,
    matrikelnummer: p.matrikelnummer ?? null,
    hochschule: p.hochschule ?? null,
    kurs: p.kurs ?? null,
    avatar_url: p.avatar_url ?? null,
    created_at: p.created_at ?? null,
    role: p.role ?? null,
    language_setting: p.language_setting ?? null,
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
    language_setting: data.languageSetting ?? null,
  };
};

// IS_DEMO is fixed for the app's entire lifetime, so picking the
// implementation once here (rather than branching on every call) keeps the
// same hook called on every render and avoids a conditional hook call.
export const useProfile: () => AppProfile | null = IS_DEMO ? useDemoProfile : useConvexProfile;
