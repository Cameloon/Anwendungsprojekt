import { createContext, useContext, useState, ReactNode } from "react";
import Enum, { languageSetting, languageSetter } from "@/lib/Enum";

interface LanguageCtx {
  language: languageSetting;
  setLanguage: languageSetter;
}

const LanguageContext = createContext<LanguageCtx | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<languageSetting>(
    () => Enum.variant("german", {})
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
