import { ReactNode, useEffect, useMemo, useState } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { IS_DEMO, demoStore } from "@/lib/demoMode";

export interface AppUser {
  id: string;
  email: string | null;
  created_at?: string;
}

interface AuthContextValue {
  user: AppUser | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => <>{children}</>;

// --- Demo mode hook (no Clerk dependency) ---
const useDemoAuth = (): AuthContextValue => {
  const [user, setUser] = useState<AppUser | null>(() => demoStore.getUser());
  const [profile, setProfile] = useState(() => demoStore.getProfile());
  useEffect(
    () =>
      demoStore.subscribe(() => {
        setUser(demoStore.getUser());
        setProfile(demoStore.getProfile());
      }),
    [],
  );
  return useMemo(
    () => ({
      user,
      isAdmin: profile?.role === "admin",
      loading: false,
      signOut: async () => demoStore.signOut(),
    }),
    [user, profile],
  );
};

// --- Real Clerk hook ---
const useClerkBackedAuth = (): AuthContextValue => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const profile = useQuery(api.profiles.getMine, {});
  return useMemo(() => {
    const mapped: AppUser | null =
      isSignedIn && user
        ? {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress ?? null,
            created_at: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
          }
        : null;
    return {
      user: mapped,
      isAdmin: profile?.role === "admin",
      loading: !isLoaded,
      signOut: async () => {
        await signOut();
      },
    };
  }, [isLoaded, isSignedIn, user, signOut, profile]);
};

// IS_DEMO is fixed for the app's entire lifetime, so picking the
// implementation once here (rather than branching on every call) keeps the
// same hook called on every render and avoids a conditional hook call.
export const useAuth: () => AuthContextValue = IS_DEMO ? useDemoAuth : useClerkBackedAuth;
