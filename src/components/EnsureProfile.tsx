import { useEffect, useRef } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { IS_DEMO } from "@/lib/demoMode";

const EnsureProfile = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { isAuthenticated } = useConvexAuth();
  const profile = IS_DEMO ? null : useQuery(api.profiles.getMine, {});
  const upsertProfile = IS_DEMO ? null : useMutation(api.profiles.upsertMine);
  const created = useRef(false);

  useEffect(() => {
    if (!IS_DEMO && user && isAuthenticated && profile === null && !created.current && upsertProfile) {
      created.current = true;
      upsertProfile({ email: user.email ?? undefined });
    }
  }, [user, isAuthenticated, profile, upsertProfile]);

  return <>{children}</>;
};

export default EnsureProfile;
