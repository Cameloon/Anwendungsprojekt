import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const legalLinks = [
  { label: "Impressum", to: "/impressum" },
  { label: "Datenschutzerklärung", to: "/datenschutz" },
  { label: "Nutzungsordnung", to: "/nutzungsordnung" },
];

type LegalLinksProps = {
  className?: string;
};

const LegalLinks = ({ className }: LegalLinksProps) => {
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