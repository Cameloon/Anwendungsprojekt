import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import Enum, { languageSetting, languageSetter } from "@/lib/Enum";
import { useProfile } from "./useProfile";

interface LanguageCtx {
  language: languageSetting;
  setLanguage: languageSetter;
}

const LanguageContext = createContext<LanguageCtx | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const profile = useProfile();
  const [language, setLanguage] = useState<languageSetting>(
    () => Enum.variant("german", {})
  );

  useEffect(() => {
    if (profile?.language_setting) {
      setLanguage(Enum.variant(profile.language_setting, {}));
    }
  }, [profile?.language_setting]);

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
