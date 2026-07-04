import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldOff } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/hooks/useLanguage";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { language } = useLanguage();
  const { user, isAdmin, loading } = useAuth();

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
            {language.match({ english: () => "Access denied", german: () => "Zugriff verweigert" })}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            {language.match({ english: () => "This area is only accessible to administrators.", german: () => "Dieser Bereich ist nur für Administratoren zugänglich." })}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
