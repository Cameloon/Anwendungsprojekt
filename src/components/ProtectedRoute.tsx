import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { IS_DEMO } from "@/lib/demoMode";
import { Loader2, Lock, Clock, XCircle, Ban } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import Navbar from "@/components/Navbar";
import OnboardingDialog from "./OnboardingDialog";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { language } = useLanguage();
  const { user, loading } = useAuth();
  const accessQuery = useQuery(api.profiles.getAccessStatus, IS_DEMO ? "skip" : {});
  const access = IS_DEMO ? "active" : accessQuery;

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
            {language.match({ english: () => "Login required", german: () => "Anmeldung erforderlich" })}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            {language.match({ english: () => "Sign in at the top right to view this area.", german: () => "Melde dich oben rechts an, um diesen Bereich zu sehen." })}
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
            {language.match({ english: () => "Activation pending", german: () => "Freischaltung ausstehend" })}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            {language.match({ english: () => "Your account has not been activated yet. Please be patient, an admin will activate you soon.", german: () => "Dein Konto wurde noch nicht freigegeben. Bitte habe etwas Geduld, ein Admin wird dich bald freischalten." })}
          </p>
        </div>
      </div>
    );
  }

  if (access === "banned") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 flex flex-col items-center justify-center text-center px-6">
          <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mb-5">
            <Ban className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-1">
            {language.match({ english: () => "Account suspended", german: () => "Konto gesperrt" })}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            {language.match({ english: () => "Your account has been suspended by an administrator. If you have questions, please contact an administrator.", german: () => "Dein Konto wurde von einem Administrator gesperrt. Bei Fragen wende dich bitte an einen Administrator." })}
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
            {language.match({ english: () => "Access denied", german: () => "Zugriff verweigert" })}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            {language.match({ english: () => "Your account could not be activated. If you have questions, please contact an administrator.", german: () => "Dein Konto wurde leider nicht freigegeben. Bei Fragen wende dich bitte an einen Administrator." })}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
