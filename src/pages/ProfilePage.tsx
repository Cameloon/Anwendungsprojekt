import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Mail, Calendar, BookOpen, Hash, MapPin, Settings, FileText, MessageSquare, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AccountSettingsDialog from "@/components/AccountSettingsDialog";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { loadScripts } from "@/lib/scriptsStore";
import { loadPosts } from "@/lib/forumStore";

const ProfilePage = () => {
  const { user } = useAuth();
  const profile = useProfile();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!user) return null;

  const name = profile?.display_name || user.email?.split("@")[0] || "User";
  const initials = name.slice(0, 2).toUpperCase();
  const joined = user.created_at
    ? new Date(user.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })
    : "";

  // Best-effort local stats
  const myScripts = (() => {
    try { return loadScripts().filter((s: any) => s.uploader === name || s.uploader === "Du").length; } catch { return 0; }
  })();
  const myPosts = (() => {
    try { return loadPosts().filter((p: any) => p.author === name || p.author === "Du").length; } catch { return 0; }
  })();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 pt-24 pb-16 max-w-4xl">
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
                  Bearbeiten
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <InfoRow icon={Mail} label="E-Mail" value={user.email ?? "—"} />
                <InfoRow icon={Calendar} label="Mitglied seit" value={joined || "—"} />
                <InfoRow icon={BookOpen} label="Studiengang" value={profile?.studienfach || "—"} />
                <InfoRow icon={MapPin} label="DHBW-Standort" value={profile?.hochschule || "—"} />
                <InfoRow icon={Hash} label="Matrikelnummer" value={profile?.matrikelnummer || "—"} />
                <InfoRow icon={Users} label="Studienjahrgang" value={profile?.jahrgang || "—"} />
              </div>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Forenbeiträge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{myPosts}</div>
                <Link to="/forum" className="text-xs text-primary hover:underline">Zum Forum →</Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Hochgeladene Skripte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{myScripts}</div>
                <Link to="/skripte" className="text-xs text-primary hover:underline">Zur Bibliothek →</Link>
              </CardContent>
            </Card>
          </div>

          {profile?.studienfach && (
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="secondary">{profile.studienfach}</Badge>
              {profile?.hochschule && <Badge variant="outline">{profile.hochschule}</Badge>}
              {profile?.jahrgang && <Badge>{profile.jahrgang}</Badge>}
            </div>
          )}
        </motion.div>
      </main>
      <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40">
    <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium truncate">{value}</p>
    </div>
  </div>
);

export default ProfilePage;