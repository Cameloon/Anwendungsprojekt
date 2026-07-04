import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const SplashScreen = () => {
  const { language } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
    >
      <div className="flex flex-col items-center gap-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative"
        >
          <div className="absolute inset-0 blur-2xl bg-primary/30 rounded-full" />
          <GraduationCap className="h-20 w-20 text-primary relative" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center"
        >
          <h1 className="font-heading text-3xl font-bold text-foreground">StudentPlanner</h1>
          <p className="text-sm text-muted-foreground mt-1">{language.match({ english: () => "Loading your study space...", german: () => "Lade deinen Lernraum..." })}</p>
        </motion.div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 160 }}
          transition={{ delay: 0.4, duration: 1.2, ease: "easeInOut" }}
          className="h-1 bg-primary rounded-full overflow-hidden"
        />
      </div>
    </motion.div>
  );
};

export default SplashScreen;
