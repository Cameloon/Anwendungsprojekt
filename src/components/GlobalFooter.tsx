import { useLanguage } from "@/hooks/useLanguage";
import LegalLinks from "@/components/LegalLinks";

const GlobalFooter = () => {
  const { language } = useLanguage();
  return (
    <footer className="border-t border-border bg-background/95 px-6 py-5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex max-w-6xl flex-col items-center gap-3 text-center text-sm text-muted-foreground md:flex-row md:justify-between md:text-left">
        <div>{language.match({ english: () => `© ${new Date().getFullYear()} StudentPlanner · Built with ❤️ for students`, german: () => `© ${new Date().getFullYear()} StudentPlanner · Mit ❤️ für Studierende gebaut` })}</div>
        <LegalLinks className="justify-center md:justify-end" />
      </div>
    </footer>
  );
};

export default GlobalFooter;