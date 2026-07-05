import { useEffect, useState } from "react";
import { Save, KeyRound, User as UserIcon, Loader2 } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Combobox from "@/components/ui/combobox";
import { DHBW_STANDORTE } from "@/lib/dhbw";
import { STUDIENFAECHER } from "@/lib/studienfach";
import { KURSE } from "@/lib/kurs";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";
import { IS_DEMO, demoStore } from "@/lib/demoMode";

import Enum, { languageSetter } from "@/lib/Enum";
import { useLanguage } from "@/hooks/useLanguage";
import { languageSetting } from "@/lib/Enum";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;

}

// useUser() requires a mounted ClerkProvider, which only exists when
// !IS_DEMO (see src/main.tsx). Isolating the call in its own component that
// is conditionally rendered (instead of conditionally calling the hook)
// keeps the hook call unconditional within the component that owns it.
const ClerkUserBridge = ({ onUser }: { onUser: (user: ReturnType<typeof useUser>["user"]) => void }) => {
  const { user } = useUser();
  useEffect(() => {
    onUser(user);
  }, [user, onUser]);
  return null;
};

const AccountSettingsDialog = ({ open, onOpenChange}: Props) => {

  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const profile = useProfile();
  // Convex hooks are safe to call unconditionally (ConvexProvider is mounted
  // in demo mode too); it's simply unused there.
  const upsertProfile = useMutation(api.profiles.upsertMine);
  const updateMyRole = useMutation(api.admin.updateMyRole);
  const [clerkUser, setClerkUser] = useState<ReturnType<typeof useUser>["user"]>(null);

  const [displayName, setDisplayName] = useState("");
  const [studienfach, setStudienfach] = useState("");
  const [matrikelnummer, setMatrikelnummer] = useState("");
  const [hochschule, setHochschule] = useState("");
  const [kurs, setKurs] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [savingProfile, setSavingProfile] = useState(false);
  // derive profile field errors from current inputs so messages clear on correction

  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  // password error rendered from inputs below

  useEffect(() => {
    if (!open) return;
    setDisplayName(profile?.display_name ?? "");
    setStudienfach(profile?.studienfach ?? "");
    setMatrikelnummer(profile?.matrikelnummer ?? "");
    setHochschule(profile?.hochschule ?? "");
    setKurs(profile?.kurs ?? "");
    setRole(profile?.role ?? "user");
  }, [open, profile]);

  const displayNameError = !displayName.trim() ? language.match({ english: () => "Required.", german: () => "Erforderlich." }) : displayName.trim().length < 2 ? language.match({ english: () => "At least 2 characters.", german: () => "Mindestens 2 Zeichen." }) : "";
  const studienfachError = !studienfach ? language.match({ english: () => "Required.", german: () => "Erforderlich." }) : "";
  const matrikelnummerError = !matrikelnummer ? language.match({ english: () => "Required.", german: () => "Erforderlich." }) : !/^\d{5,10}$/.test(matrikelnummer) ? language.match({ english: () => "5–10 digits.", german: () => "5–10 Ziffern." }) : "";
  const hochschuleError = !hochschule ? language.match({ english: () => "Please select a DHBW location.", german: () => "Bitte einen DHBW-Standort wählen." }) : "";
  const kursError = !kurs ? language.match({ english: () => "Required.", german: () => "Erforderlich." }) : "";
  const passwordError = newPw.length > 0 && newPw.length < 6 ? language.match({ english: () => "At least 6 characters.", german: () => "Mindestens 6 Zeichen." }) : newPw && confirmPw && newPw !== confirmPw ? language.match({ english: () => "Passwords do not match.", german: () => "Die Passwörter stimmen nicht überein." }) : "";

  const saveProfile = async () => {
    if (!user) return;
    const nextErrors: Record<string, string> = {};
    if (!displayName.trim()) nextErrors.displayName = language.match({ english: () => "Required.", german: () => "Erforderlich." });
    else if (displayName.trim().length < 2) nextErrors.displayName = language.match({ english: () => "At least 2 characters.", german: () => "Mindestens 2 Zeichen." });
    if (!studienfach) nextErrors.studienfach = language.match({ english: () => "Required.", german: () => "Erforderlich." });
    if (!hochschule) nextErrors.hochschule = language.match({ english: () => "Please select a DHBW location.", german: () => "Bitte einen DHBW-Standort wählen." });
    if (!kurs) nextErrors.kurs = language.match({ english: () => "Required.", german: () => "Erforderlich." });
    if (!matrikelnummer) nextErrors.matrikelnummer = language.match({ english: () => "Required.", german: () => "Erforderlich." });
    else if (!/^\d{5,10}$/.test(matrikelnummer)) nextErrors.matrikelnummer = language.match({ english: () => "5–10 digits.", german: () => "5–10 Ziffern." });
    if (Object.keys(nextErrors).length > 0) {
      toast({ title: language.match({ english: () => "Check input", german: () => "Eingaben prüfen" }), description: language.match({ english: () => "Please correct the highlighted fields.", german: () => "Bitte markierte Felder korrigieren." }), variant: "destructive" });
      return;
    }
    setSavingProfile(true);
    try {
      if (IS_DEMO) {
        demoStore.updateProfile({
          display_name: displayName || null,
          studienfach: studienfach || null,
          matrikelnummer: matrikelnummer || null,
          hochschule: hochschule || null,
          kurs: kurs || null,
        });
      } else {
        await upsertProfile!({
          displayName: displayName || undefined,
          studienfach: studienfach || undefined,
          matrikelnummer: matrikelnummer || undefined,
          hochschule: hochschule || undefined,
          kurs: kurs || undefined,
          email: user.email ?? undefined,
        });
      }
      toast({ title: language.match({ english: () => "Saved", german: () => "Gespeichert" }), description: language.match({ english: () => "Your profile has been updated.", german: () => "Dein Profil wurde aktualisiert." }) });
    } catch (err: any) {
      toast({ title: language.match({ english: () => "Error", german: () => "Fehler" }), description: err?.message ?? language.match({ english: () => "Save failed", german: () => "Speichern fehlgeschlagen" }), variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (IS_DEMO) {
      toast({ title: language.match({ english: () => "Demo mode", german: () => "Demo-Modus" }), description: language.match({ english: () => "Password change is not available in demo mode.", german: () => "Passwortänderung ist im Demo-Modus deaktiviert." }) });
      return;
    }
    if (!clerkUser) return;
    if (newPw.length < 6) {
      toast({ title: language.match({ english: () => "Password too short", german: () => "Passwort zu kurz" }), description: language.match({ english: () => "At least 6 characters.", german: () => "Mindestens 6 Zeichen." }), variant: "destructive" });
      return;
    }
    if (newPw !== confirmPw) {
      toast({ title: language.match({ english: () => "Passwords do not match", german: () => "Passwörter ungleich" }), description: language.match({ english: () => "Please check.", german: () => "Bitte überprüfen." }), variant: "destructive" });
      return;
    }
    setSavingPw(true);
    try {
      await clerkUser.updatePassword({ newPassword: newPw });
      toast({ title: language.match({ english: () => "Password changed", german: () => "Passwort geändert" }), description: language.match({ english: () => "Your password has been updated.", german: () => "Dein Passwort wurde aktualisiert." }) });
      setNewPw("");
      setConfirmPw("");
    } catch (err: any) {
      toast({
        title: language.match({ english: () => "Error", german: () => "Fehler" }),
        description: err?.errors?.[0]?.message ?? err?.message ?? language.match({ english: () => "Could not change password", german: () => "Konnte Passwort nicht ändern" }),
        variant: "destructive",
      });
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <>
      {!IS_DEMO && <ClerkUserBridge onUser={setClerkUser} />}
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{language.match({ english: () => "Account settings", german: () => "Account-Einstellungen" })}</DialogTitle>
          <DialogDescription>{language.match({ english: () => "Manage your profile and password.", german: () => "Verwalte dein Profil und dein Passwort." })}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-2">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="profile" className="gap-2">
              <UserIcon className="h-4 w-4" /> {language.match({ english: () => "Profile", german: () => "Profil" })}
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <KeyRound className="h-4 w-4" /> {language.match({ english: () => "Login", german: () => "Login" })}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{language.match({ english: () => "Email", german: () => "E-Mail" })}</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dn">{language.match({ english: () => "Display name *", german: () => "Anzeigename *" })}</Label>
              <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              {displayNameError && <p className="text-xs text-destructive">{displayNameError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mn">{language.match({ english: () => "Matriculation number *", german: () => "Matrikelnummer *" })}</Label>
              <Input
                id="mn"
                inputMode="numeric"
                maxLength={10}
                value={matrikelnummer}
                onChange={(e) => setMatrikelnummer(e.target.value.replace(/\D/g, ""))}
              />
              {matrikelnummerError && <p className="text-xs text-destructive">{matrikelnummerError}</p>}
            </div>

            <div className="space-y-2">
              <Label>{language.match({ english: () => "Language", german: () => "Sprache" })}</Label>

              <Select value={
                language.match({
                  english: () => {return "english"},
                  german: () => {return "german"},
                })
              } onValueChange={(v) => {
                const lang = v as "english" | "german";
                setLanguage(Enum.variant(lang, {}));
                if (IS_DEMO) {
                  demoStore.updateProfile({ language_setting: lang });
                } else {
                  upsertProfile!({ languageSetting: lang });
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={language.match({ english: () => "Select location", german: () => "Standort wählen" })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key={"Deutsch"} value={"german"} >{language.match({ english: () => "German", german: () => "Deutsch" })}</SelectItem>
                  <SelectItem key={"English (US)"} value={"english"} >English (US)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {language.match({
                  
                  english: () => "This option exists temporarily for demo purposes, to make the admin view visible. In a production environment this option would not exist",
                  
                  german: () => "Diese Option existiert vorübergehend zu Demo-Zwecken, um die Admin-Ansicht sichtbar zu machen. In einer Produktionsumgebung würde diese Option nicht existieren" 

                })}
              </p>
              <Label>{language.match({ english: () => "Role", german: () => "Rolle" })}</Label>
              <Select value={role} onValueChange={(v) => {
                setRole(v as "admin" | "user");
                if (IS_DEMO) {
                  demoStore.updateProfile({ role: v as "admin" | "user" });
                } else {
                  updateMyRole!({ role: v as "admin" | "user" });
                }
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{language.match({ english: () => "User", german: () => "Benutzer" })}</SelectItem>
                  <SelectItem value="admin">{language.match({ english: () => "Admin", german: () => "Administrator" })}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{language.match({ english: () => "DHBW location *", german: () => "DHBW-Standort *" })}</Label>
              <Select value={hochschule} onValueChange={setHochschule}>
                <SelectTrigger>
                  <SelectValue placeholder={language.match({ english: () => "Select location", german: () => "Standort wählen" })} />
                </SelectTrigger>
                <SelectContent>
                  {DHBW_STANDORTE.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hochschuleError && <p className="text-xs text-destructive">{hochschuleError}</p>}
            </div>
            <div className="space-y-2">
              <Label>{language.match({ english: () => "Course of study *", german: () => "Studiengang *" })}</Label>
              <Combobox
                value={studienfach}
                onChange={setStudienfach}
                options={STUDIENFAECHER}
                placeholder={language.match({ english: () => "Select course of study", german: () => "Studiengang wählen" })}
              />
              {studienfachError && <p className="text-xs text-destructive">{studienfachError}</p>}
            </div>
            <div className="space-y-2">
              <Label>{language.match({ english: () => "Course *", german: () => "Kurs *" })}</Label>
              <Combobox
                value={kurs}
                onChange={setKurs}
                options={KURSE}
                placeholder={language.match({ english: () => "Select course", german: () => "Kurs wählen" })}
              />
              {kursError && <p className="text-xs text-destructive">{kursError}</p>}
            </div>
            <Button onClick={saveProfile} disabled={savingProfile} className="w-full gap-2">
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {language.match({ english: () => "Save profile", german: () => "Profil speichern" })}
            </Button>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-4">
            {IS_DEMO ? (
              <p className="text-sm text-muted-foreground">
                {language.match({ english: () => "Password change is not available in demo mode.", german: () => "Passwortänderung ist im Demo-Modus nicht verfügbar." })}
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>{language.match({ english: () => "New password", german: () => "Neues Passwort" })}</Label>
                  <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{language.match({ english: () => "Confirm new password", german: () => "Neues Passwort bestätigen" })}</Label>
                  <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                  {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
                </div>
                <Button onClick={changePassword} disabled={savingPw} className="w-full gap-2">
                  {savingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  {language.match({ english: () => "Change password", german: () => "Passwort ändern" })}
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
      </Dialog>
    </>
  );
};

export default AccountSettingsDialog;
