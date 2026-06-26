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

interface Props {
  open: boolean;
}

const OnboardingDialog = ({ open }: Props) => {
  const { user } = useAuth();
  const completeProfile = useMutation(api.profiles.complete);

  const [displayName, setDisplayName] = useState("");
  const [studienfach, setStudienfach] = useState("");
  const [matrikelnummer, setMatrikelnummer] = useState("");
  const [hochschule, setHochschule] = useState("");
  const [kurs, setKurs] = useState("");
  const [saving, setSaving] = useState(false);

  const displayNameError = !displayName.trim() ? "Erforderlich." : displayName.trim().length < 2 ? "Mindestens 2 Zeichen." : "";
  const studienfachError = !studienfach ? "Erforderlich." : "";
  const matrikelnummerError = !matrikelnummer ? "Erforderlich." : !/^\d{5,10}$/.test(matrikelnummer) ? "5–10 Ziffern." : "";
  const hochschuleError = !hochschule ? "Bitte einen DHBW-Standort wählen." : "";
  const kursError = !kurs ? "Erforderlich." : "";

  const save = async () => {
    if (!user) return;
    const nextErrors: Record<string, string> = {};
    if (!displayName.trim()) nextErrors.displayName = "Erforderlich.";
    else if (displayName.trim().length < 2) nextErrors.displayName = "Mindestens 2 Zeichen.";
    if (!studienfach) nextErrors.studienfach = "Erforderlich.";
    if (!hochschule) nextErrors.hochschule = "Bitte einen DHBW-Standort wählen.";
    if (!kurs) nextErrors.kurs = "Erforderlich.";
    if (!matrikelnummer) nextErrors.matrikelnummer = "Erforderlich.";
    else if (!/^\d{5,10}$/.test(matrikelnummer)) nextErrors.matrikelnummer = "5–10 Ziffern.";
    if (Object.keys(nextErrors).length > 0) {
      toast({ title: "Eingaben prüfen", description: "Bitte markierte Felder korrigieren.", variant: "destructive" });
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
      toast({ title: "Profil vollständig", description: "Dein Profil wurde eingerichtet." });
    } catch (err: any) {
      toast({ title: "Fehler", description: err?.message ?? "Speichern fehlgeschlagen", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle>Willkommen! Bitte vervollständige dein Profil</DialogTitle>
          <DialogDescription>
            Diese Angaben werden benötigt, um alle Funktionen nutzen zu können.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="dn">Anzeigename *</Label>
            <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            {displayNameError && <p className="text-xs text-destructive">{displayNameError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mn">Matrikelnummer *</Label>
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
            <Label>DHBW-Standort *</Label>
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
            {hochschuleError && <p className="text-xs text-destructive">{hochschuleError}</p>}
          </div>
          <div className="space-y-2">
            <Label>Studiengang *</Label>
            <Combobox
              value={studienfach}
              onChange={setStudienfach}
              options={STUDIENFAECHER}
              placeholder="Studiengang wählen"
            />
            {studienfachError && <p className="text-xs text-destructive">{studienfachError}</p>}
          </div>
          <div className="space-y-2">
            <Label>Kurs *</Label>
            <Combobox
              value={kurs}
              onChange={setKurs}
              options={KURSE}
              placeholder="Kurs wählen"
            />
            {kursError && <p className="text-xs text-destructive">{kursError}</p>}
          </div>
          <Button onClick={save} disabled={saving} className="w-full gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Profil speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
