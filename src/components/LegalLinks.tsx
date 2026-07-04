import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

type LegalLinksProps = {
  className?: string;
};

const LegalLinks = ({ className }: LegalLinksProps) => {
  const { language } = useLanguage();

  const legalLinks = [
    { label: language.match({ english: () => "Imprint", german: () => "Impressum" }), to: "/impressum" },
    { label: language.match({ english: () => "Privacy Policy", german: () => "Datenschutzerklärung" }), to: "/datenschutz" },
    { label: language.match({ english: () => "Terms of Use", german: () => "Nutzungsordnung" }), to: "/nutzungsordnung" },
  ];

  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}>
      {legalLinks.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
};

export default LegalLinks;