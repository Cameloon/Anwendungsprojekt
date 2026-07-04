import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { IS_DEMO } from "@/lib/demoMode";

// useConvexAuth() needs ConvexProviderWithAuth (e.g. ConvexProviderWithClerk),
// which is only mounted when !IS_DEMO (see src/main.tsx; demo mode mounts a
// plain ConvexProvider). Isolating the call in its own conditionally rendered
// component keeps the hook call unconditional within the component that owns it.
const ConvexAuthBridge = ({ onAuth }: { onAuth: (authenticated: boolean) => void }) => {
  const { isAuthenticated } = useConvexAuth();
  useEffect(() => {
    onAuth(isAuthenticated);
  }, [isAuthenticated, onAuth]);
  return null;
};

const EnsureProfile = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  // useQuery/useMutation only need the plain ConvexProvider, which is mounted
  // in demo mode too, so they're safe to call unconditionally.
  const profile = useQuery(api.profiles.getMine, IS_DEMO ? "skip" : {});
  const upsertProfile = useMutation(api.profiles.upsertMine);
  const [convexAuthenticated, setConvexAuthenticated] = useState(false);
  const isAuthenticated = IS_DEMO ? true : convexAuthenticated;
  const created = useRef(false);

  useEffect(() => {
    if (!IS_DEMO && user && isAuthenticated && profile === null && !created.current) {
      created.current = true;
      upsertProfile({ email: user.email ?? undefined, role: "user" });
    }
  }, [user, isAuthenticated, profile, upsertProfile]);

  return (
    <>
      {!IS_DEMO && <ConvexAuthBridge onAuth={setConvexAuthenticated} />}
      {children}
    </>
  );
};

export default EnsureProfile;
