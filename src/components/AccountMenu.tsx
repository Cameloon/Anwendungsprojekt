import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Mail, GraduationCap, Calendar, Settings, User as UserIcon, Users } from "lucide-react";
import AccountSettingsDialog from "@/components/AccountSettingsDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/hooks/useLanguage";

const AccountMenu = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const profile = useProfile();
  const { language, setLanguage } = useLanguage();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!user) return null;

  const name = profile?.display_name || user.email?.split("@")[0] || "User";
  const initials = name.slice(0, 2).toUpperCase();
  const joined = user.created_at ? new Date(user.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" }) : "";

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 px-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline text-sm font-medium">{name.split(" ")[0]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3 py-1">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{name}</p>
              <p className="text-xs text-muted-foreground font-normal truncate">{user.email}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5" />
            <span className="truncate">{user.email}</span>
          </div>
          {profile?.studienfach && (
            <div className="flex items-center gap-2">
              <GraduationCap className="h-3.5 w-3.5" />
              <span className="truncate">{profile.studienfach}</span>
            </div>
          )}
          {profile?.jahrgang && (
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              <span className="truncate">Jahrgang {profile.jahrgang}</span>
            </div>
          )}
          {joined && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>Mitglied seit {joined}</span>
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
          <UserIcon className="h-4 w-4 mr-2" />
          Profil ansehen
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="cursor-pointer">
          <Settings className="h-4 w-4 mr-2" />
          Account-Einstellungen
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
          <LogOut className="h-4 w-4 mr-2" />
          Abmelden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} language={language} setLanguage={setLanguage} />
    </>
  );
};

export default AccountMenu;
