import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

interface Props {
  open: boolean;
}

const OnboardingDialog = ({ open }: Props) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const completeProfile = useMutation(api.profiles.complete);

  const [displayName, setDisplayName] = useState("");
  const [studienfach, setStudienfach] = useState("");
  const [matrikelnummer, setMatrikelnummer] = useState("");
  const [hochschule, setHochschule] = useState("");
  const [kurs, setKurs] = useState("");
  const [saving, setSaving] = useState(false);

  const displayNameError = !displayName.trim() ? language.match({ english: () => "Required.", german: () => "Erforderlich." }) : displayName.trim().length < 2 ? language.match({ english: () => "At least 2 characters.", german: () => "Mindestens 2 Zeichen." }) : "";
  const studienfachError = !studienfach ? language.match({ english: () => "Required.", german: () => "Erforderlich." }) : "";
  const matrikelnummerError = !matrikelnummer ? language.match({ english: () => "Required.", german: () => "Erforderlich." }) : !/^\d{5,10}$/.test(matrikelnummer) ? language.match({ english: () => "5–10 digits.", german: () => "5–10 Ziffern." }) : "";
  const hochschuleError = !hochschule ? language.match({ english: () => "Please select a DHBW location.", german: () => "Bitte einen DHBW-Standort wählen." }) : "";
  const kursError = !kurs ? language.match({ english: () => "Required.", german: () => "Erforderlich." }) : "";

  const save = async () => {
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
    setSaving(true);
    try {
      await completeProfile({
        displayName: displayName.trim(),
        studienfach,
        matrikelnummer: matrikelnummer.trim(),
        hochschule: hochschule.trim(),
        kurs,
      });
      toast({ title: language.match({ english: () => "Profile complete", german: () => "Profil vollständig" }), description: language.match({ english: () => "Your profile has been set up.", german: () => "Dein Profil wurde eingerichtet." }) });
    } catch (err: any) {
      toast({ title: language.match({ english: () => "Error", german: () => "Fehler" }), description: err?.message ?? language.match({ english: () => "Save failed", german: () => "Speichern fehlgeschlagen" }), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle>{language.match({ english: () => "Welcome! Please complete your profile", german: () => "Willkommen! Bitte vervollständige dein Profil" })}</DialogTitle>
          <DialogDescription>
            {language.match({ english: () => "This information is required to use all features.", german: () => "Diese Angaben werden benötigt, um alle Funktionen nutzen zu können." })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
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
          <Button onClick={save} disabled={saving} className="w-full gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {language.match({ english: () => "Save profile", german: () => "Profil speichern" })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
