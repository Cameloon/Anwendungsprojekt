import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Calendar, BookOpen, Hash, MapPin, Settings, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import AccountSettingsDialog from "@/components/AccountSettingsDialog";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/hooks/useLanguage";

const ProfilePage = () => {
  const { user } = useAuth();
  const profile = useProfile();
  const { language } = useLanguage();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!user) return null;

  const name = profile?.display_name || user.email?.split("@")[0] || language.match({ english: () => "User", german: () => "User" });
  const initials = name.slice(0, 2).toUpperCase();
  const joined = user.created_at
    ? new Date(user.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })
    : "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 pt-32 md:pt-24 pb-16 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20" />
            <CardContent className="pt-0">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-6">
                <Avatar className="h-24 w-24 ring-4 ring-background">
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold font-heading truncate">{name}</h1>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)} className="gap-2">
                  <Settings className="h-4 w-4" />
                  {language.match({ english: () => "Edit", german: () => "Bearbeiten" })}
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <InfoRow icon={Mail} label={language.match({ english: () => "Email", german: () => "E-Mail" })} value={user.email ?? "—"} />
                <InfoRow icon={Calendar} label={language.match({ english: () => "Member since", german: () => "Mitglied seit" })} value={joined || "—"} />
                <InfoRow icon={BookOpen} label={language.match({ english: () => "Course of Study", german: () => "Studiengang" })} value={profile?.studienfach || "—"} />
                <InfoRow icon={MapPin} label={language.match({ english: () => "DHBW Location", german: () => "DHBW-Standort" })} value={profile?.hochschule || "—"} />
                <InfoRow icon={Hash} label={language.match({ english: () => "Matriculation Number", german: () => "Matrikelnummer" })} value={profile?.matrikelnummer || "—"} />
                <InfoRow icon={Users} label={language.match({ english: () => "Course", german: () => "Kurs" })} value={profile?.kurs || "—"} />
              </div>
            </CardContent>
          </Card>

        </motion.div>
      </main>
      <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40">
    <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium truncate">{value}</p>
    </div>
  </div>
);

export default ProfilePage;
