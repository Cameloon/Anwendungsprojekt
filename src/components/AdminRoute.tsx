import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { IS_DEMO } from "@/lib/demoMode";
import { Loader2, ShieldOff } from "lucide-react";
import Navbar from "@/components/Navbar";
import OnboardingDialog from "./OnboardingDialog";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();
  const isComplete = IS_DEMO ? true : useQuery(api.profiles.isComplete, {});

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 flex flex-col items-center justify-center text-center px-6">
          <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mb-5">
            <ShieldOff className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-1">
            Zugriff verweigert
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Dieser Bereich ist nur für Administratoren zugänglich.
          </p>
        </div>
      </div>
    );
  }

  if (isComplete === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <OnboardingDialog open={!isComplete} />
      {children}
    </>
  );
};

export default AdminRoute;
