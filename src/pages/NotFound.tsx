import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";

const NotFound = () => {
  const location = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">
          {language.match({ english: () => "Oops! Page not found", german: () => "Hoppla! Seite nicht gefunden" })}
        </p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          {language.match({ english: () => "Return to Home", german: () => "Zurück zur Startseite" })}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
