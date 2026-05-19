import { ReactNode, useEffect, useMemo, useState } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { IS_DEMO, demoStore } from "@/lib/demoMode";

export interface AppUser {
  id: string;
  email: string | null;
  created_at?: string;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => <>{children}</>;

// --- Demo mode hook (no Clerk dependency) ---
const useDemoAuth = (): AuthContextValue => {
  const [user, setUser] = useState<AppUser | null>(() => demoStore.getUser());
  useEffect(() => demoStore.subscribe(() => setUser(demoStore.getUser())), []);
  return useMemo(
    () => ({
      user,
      loading: false,
      signOut: async () => demoStore.signOut(),
    }),
    [user]
  );
};

// --- Real Clerk hook ---
const useClerkBackedAuth = (): AuthContextValue => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
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
      loading: !isLoaded,
      signOut: async () => {
        await signOut();
      },
    };
  }, [isLoaded, isSignedIn, user, signOut]);
};

export const useAuth = (): AuthContextValue => {
  // Hook order is stable per build because IS_DEMO is evaluated at module load.
  return IS_DEMO ? useDemoAuth() : useClerkBackedAuth();
};
