import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { IS_DEMO } from "@/lib/demoMode";
import { Loader2, Lock, Clock, XCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import OnboardingDialog from "./OnboardingDialog";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const access = IS_DEMO ? "active" : useQuery(api.profiles.getAccessStatus, {});

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 flex flex-col items-center justify-center text-center px-6">
          <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mb-5">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-1">
            Anmeldung erforderlich
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Melde dich oben rechts an, um diesen Bereich zu sehen.
          </p>
        </div>
      </div>
    );
  }

  if (!access || access === "no-identity" || access === "no-profile") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (access === "incomplete") {
    return (
      <>
        <OnboardingDialog open />
        {children}
      </>
    );
  }

  if (access === "pending") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 flex flex-col items-center justify-center text-center px-6">
          <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mb-5">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-1">
            Freischaltung ausstehend
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Dein Konto wurde noch nicht freigegeben. Bitte habe etwas Geduld, ein Admin wird dich bald freischalten.
          </p>
        </div>
      </div>
    );
  }

  if (access === "rejected") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 flex flex-col items-center justify-center text-center px-6">
          <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mb-5">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-1">
            Zugriff verweigert
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Dein Konto wurde leider nicht freigegeben. Bei Fragen wende dich bitte an einen Administrator.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
