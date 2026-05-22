import { useAuth } from "@/hooks/useAuth";
import { Loader2, Lock } from "lucide-react";
import Navbar from "@/components/Navbar";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

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

  return <>{children}</>;
};

export default ProtectedRoute;
