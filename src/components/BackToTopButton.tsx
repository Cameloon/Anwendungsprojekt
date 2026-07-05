import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

const SCROLL_THRESHOLD = 400;

const BackToTopButton = () => {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      className="fixed bottom-16 left-1/2 z-50 h-11 w-11 -translate-x-1/2 rounded-full bg-background shadow-lg"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={language.match({ english: () => "Back to top", german: () => "Zurück nach oben" })}
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
};

export default BackToTopButton;
