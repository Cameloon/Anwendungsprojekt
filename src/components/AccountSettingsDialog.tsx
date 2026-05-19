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
import { DHBW_STANDORTE } from "@/lib/dhbw";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";
import { IS_DEMO, demoStore } from "@/lib/demoMode";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const AccountSettingsDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const profile = useProfile();
  // These are safe to call only when providers are mounted (i.e., !IS_DEMO).
  const upsertProfile = IS_DEMO ? null : useMutation(api.profiles.upsertMine);
  const clerkUser = IS_DEMO ? null : useUser().user;

  const [displayName, setDisplayName] = useState("");
  const [studienfach, setStudienfach] = useState("");
  const [matrikelnummer, setMatrikelnummer] = useState("");
  const [hochschule, setHochschule] = useState("");
  const [jahrgang, setJahrgang] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDisplayName(profile?.display_name ?? "");
    setStudienfach(profile?.studienfach ?? "");
    setMatrikelnummer(profile?.matrikelnummer ?? "");
    setHochschule(profile?.hochschule ?? "");
    setJahrgang(profile?.jahrgang ?? "");
  }, [open, profile]);

  const saveProfile = async () => {
    if (!user) return;
    if (matrikelnummer && !/^\d{5,10}$/.test(matrikelnummer)) {
      toast({ title: "Ungültige Matrikelnummer", description: "5–10 Ziffern.", variant: "destructive" });
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
          jahrgang: jahrgang ? jahrgang.toUpperCase() : null,
        });
      } else {
        await upsertProfile!({
          displayName: displayName || undefined,
          studienfach: studienfach || undefined,
          matrikelnummer: matrikelnummer || undefined,
          hochschule: hochschule || undefined,
          jahrgang: jahrgang ? jahrgang.toUpperCase() : undefined,
          email: user.email ?? undefined,
        });
      }
      toast({ title: "Gespeichert", description: "Dein Profil wurde aktualisiert." });
    } catch (err: any) {
      toast({ title: "Fehler", description: err?.message ?? "Speichern fehlgeschlagen", variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (IS_DEMO) {
      toast({ title: "Demo-Modus", description: "Passwortänderung ist im Demo-Modus deaktiviert." });
      return;
    }
    if (!clerkUser) return;
    if (newPw.length < 6) {
      toast({ title: "Passwort zu kurz", description: "Mindestens 6 Zeichen.", variant: "destructive" });
      return;
    }
    if (newPw !== confirmPw) {
      toast({ title: "Passwörter ungleich", description: "Bitte überprüfen.", variant: "destructive" });
      return;
    }
    setSavingPw(true);
    try {
      await clerkUser.updatePassword({ newPassword: newPw });
      toast({ title: "Passwort geändert", description: "Dein Passwort wurde aktualisiert." });
      setNewPw("");
      setConfirmPw("");
    } catch (err: any) {
      toast({
        title: "Fehler",
        description: err?.errors?.[0]?.message ?? err?.message ?? "Konnte Passwort nicht ändern",
        variant: "destructive",
      });
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Account-Einstellungen</DialogTitle>
          <DialogDescription>Verwalte dein Profil und dein Passwort.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-2">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="profile" className="gap-2">
              <UserIcon className="h-4 w-4" /> Profil
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <KeyRound className="h-4 w-4" /> Login
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>E-Mail</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dn">Anzeigename</Label>
              <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mn">Matrikelnummer</Label>
              <Input
                id="mn"
                inputMode="numeric"
                maxLength={10}
                value={matrikelnummer}
                onChange={(e) => setMatrikelnummer(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-2">
              <Label>DHBW-Standort</Label>
              <Select value={hochschule} onValueChange={setHochschule}>
                <SelectTrigger>
                  <SelectValue placeholder="Standort wählen" />
                </SelectTrigger>
                <SelectContent>
                  {DHBW_STANDORTE.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sf">Studiengang</Label>
              <Input id="sf" value={studienfach} onChange={(e) => setStudienfach(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jg">Studienjahrgang</Label>
              <Input
                id="jg"
                placeholder="z. B. TIF25B"
                value={jahrgang}
                onChange={(e) => setJahrgang(e.target.value.toUpperCase())}
                maxLength={8}
              />
            </div>
            <Button onClick={saveProfile} disabled={savingProfile} className="w-full gap-2">
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Profil speichern
            </Button>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-4">
            {IS_DEMO ? (
              <p className="text-sm text-muted-foreground">
                Passwortänderung ist im Demo-Modus nicht verfügbar.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Neues Passwort</Label>
                  <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Neues Passwort bestätigen</Label>
                  <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                </div>
                <Button onClick={changePassword} disabled={savingPw} className="w-full gap-2">
                  {savingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Passwort ändern
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AccountSettingsDialog;
