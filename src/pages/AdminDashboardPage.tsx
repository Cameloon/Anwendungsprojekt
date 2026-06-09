import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { loadReports, dismissReport, subscribeReports, type PostReport } from "@/lib/reportsStore";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  AlertTriangle,
  BookMarked,
  CheckCircle2,
  Eye,
  GraduationCap,
  LayoutGrid,
  Loader2,
  Plus,
  Shield,
  ShieldCheck,
  Trash2,
  Users,
  FileWarning,
  Settings2,
  FolderUp,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => i + 1);

const ruleCards = [
  {
    title: "Freischaltungen",
    text: "Neue Nutzer prüfen, Freigaben aussprechen oder Accounts löschen.",
    icon: <Users className="h-4 w-4" />,
  },
  {
    title: "Moderation",
    text: "Gemeldete Posts prüfen, Beiträge löschen und Maßnahmen protokollieren.",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  {
    title: "Vorlesungen",
    text: "Vorlesungen importieren, bearbeiten und als Auswahl in Formularen bereitstellen.",
    icon: <BookMarked className="h-4 w-4" />,
  },
  {
    title: "Materialregeln",
    text: "Formate, Maximalgröße und Sichtbarkeit für Uploads zentral steuern.",
    icon: <FolderUp className="h-4 w-4" />,
  },
];

const statusTone = (state: string) => {
  if (state === "offen" || state === "hoch")
    return "bg-destructive/10 text-destructive";
  if (state === "freigegeben" || state === "aktiv" || state === "importiert")
    return "bg-success/10 text-success";
  return "bg-secondary text-muted-foreground";
};

const AdminDashboardPage = () => {
  const profiles = useQuery(api.admin.getAll, {});
  const approveUser = useMutation(api.admin.approveUser);
  const rejectUser = useMutation(api.admin.rejectUser);
  const lectures = useQuery(api.semesterLectures.list, {});
  const saveLecture = useMutation(api.semesterLectures.manage);
  const deleteLecture = useMutation(api.semesterLectures.deleteLecture);
  const seedLectures = useMutation(api.semesterLectures.seedIfEmpty);
  const [updating, setUpdating] = useState<string | null>(null);
  const [reports, setReports] = useState<PostReport[]>(() => loadReports());
  const [newKurs, setNewKurs] = useState("");
  const [newSemester, setNewSemester] = useState("1");
  const [newLectureName, setNewLectureName] = useState("");

  useEffect(() => subscribeReports(() => setReports(loadReports())), []);

  // Auto-seed base lecture data once on admin page load
  useEffect(() => {
    seedLectures({}).catch(() => {
      // ignore — only works for admins and only seeds if empty
    });
  }, [seedLectures]);

  const handleApprove = async (userId: string) => {
    setUpdating(userId);
    try {
      await approveUser({ userId });
      toast({
        title: "Freigegeben",
        description: "Der Nutzer wurde erfolgreich freigegeben.",
      });
    } catch (err) {
      toast({
        title: "Fehler",
        description: err instanceof Error ? err.message : "Freigabe fehlgeschlagen",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (userId: string) => {
    setUpdating(userId);
    try {
      await rejectUser({ userId });
      toast({
        title: "Abgelehnt",
        description: "Der Nutzer wurde abgelehnt.",
      });
    } catch (err) {
      toast({
        title: "Fehler",
        description: err instanceof Error ? err.message : "Ablehnung fehlgeschlagen",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const pendingProfiles = profiles?.filter(
    (p) => p.status === "pending",
  ) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="w-full px-4 pt-32 md:pt-24 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary via-primary/90 to-accent p-8 text-primary-foreground shadow-sm"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/85">
                  <Shield className="h-3.5 w-3.5" />
                  Admin-Dashboard
                </div>
                <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">
                  Moderation, Freischaltungen und Vorlesungsverwaltung an einem
                  Ort
                </h1>
                <p className="mt-4 max-w-2xl text-sm text-white/85 sm:text-base">
                  Diese Ansicht bündelt die Aufgaben aus den funktionalen
                  Anforderungen: Nutzer freischalten, gemeldete Beiträge prüfen,
                  Vorlesungen administrieren und Upload-Regeln steuern.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[34rem] lg:flex-1">
                <MetricCard
                  label="Offene Freigaben"
                  value={String(pendingProfiles.length)}
                  hint="Nutzer warten"
                />
                <MetricCard label="Meldungen" value={String(reports.filter((r) => r.status === "offen").length)} hint="Forum-Queue" />
                <MetricCard
                  label="Vorlesungen"
                  value={String(lectures?.length ?? "—")}
                  hint="hinterlegte Einträge"
                />
                <MetricCard
                  label="Upload-Regeln"
                  value="4"
                  hint="konfigurierbar"
                />
              </div>
            </div>
          </motion.section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {ruleCards.map((card) => (
              <div
                key={card.title}
                className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {card.icon}
                </div>
                <h2 className="font-heading text-xl font-semibold">
                  {card.title}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {card.text}
                </p>
              </div>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Panel
              title="Nutzerfreischaltungen"
              icon={<Users className="h-4 w-4" />}
              description="Admins prüfen neue Registrierungen, geben Nutzer frei oder löschen Accounts."
            >
              {profiles === undefined ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingProfiles.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Alle Nutzer wurden bereits freigegeben.
                    </p>
                  )}
                  {pendingProfiles.map((p) => (
                    <div
                      key={p._id}
                      className="rounded-2xl border border-border/60 bg-background/80 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">
                              {p.displayName || p.email || "Unbekannt"}
                            </p>
                            <Badge
                              variant="secondary"
                              className="bg-amber-500/10 text-amber-600"
                            >
                              ausstehend
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {[
                              p.matrikelnummer,
                              p.studienfach,
                              p.hochschule,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Keine Details"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={updating === p.userId}
                            onClick={() => handleReject(p.userId)}
                          >
                            {updating === p.userId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Ablehnen"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            className="bg-success hover:bg-success/90"
                            disabled={updating === p.userId}
                            onClick={() => handleApprove(p.userId)}
                          >
                            {updating === p.userId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Freigeben"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel
              title="Moderationsprotokoll"
              icon={<FileWarning className="h-4 w-4" />}
              description="Gemeldete Forum-Beiträge und Moderationsaktionen sollen nachvollziehbar dokumentiert werden."
            >
              <div className="space-y-3">
                {reports.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Keine offenen Meldungen.
                  </p>
                )}
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-2xl border border-border/60 bg-background/80 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{report.postTitle}</p>
                          <Badge
                            variant="secondary"
                            className={statusTone(report.status)}
                          >
                            {report.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {report.forumName} · gemeldet von {report.reportedBy}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {report.reason}
                        </p>
                      </div>
                      {report.status === "offen" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          onClick={() => dismissReport(report.id)}
                        >
                          Erledigt
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Panel
              title="Vorlesungsverwaltung"
              icon={<GraduationCap className="h-4 w-4" />}
              description="Lege Vorlesungen pro Kurs und Semester an. Nutzer werden beim Onboarding automatisch in die passenden Vorlesungs-Foren eingeschrieben."
            >
              <div className="mb-4 grid gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Kurs</label>
                  <Select value={newKurs} onValueChange={setNewKurs}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kurs wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {["INF", "TIF", "WIF", "BWL", "MAB", "ETE", "MEC", "DSA", "AI", "SEC", "WI"].map((k) => (
                        <SelectItem key={k} value={k}>{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Semester</label>
                  <Select value={newSemester} onValueChange={setNewSemester}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEMESTER_OPTIONS.map((s) => (
                        <SelectItem key={s} value={String(s)}>{s}.</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Vorlesungsname</label>
                  <Input
                    value={newLectureName}
                    onChange={(e) => setNewLectureName(e.target.value)}
                    placeholder="z.B. Mathematik 1"
                  />
                </div>
              </div>
              <Button
                size="sm"
                className="mb-4 gap-1"
                disabled={!newKurs || !newLectureName.trim()}
                onClick={async () => {
                  try {
                    await saveLecture({
                      kurs: newKurs,
                      semesterNumber: parseInt(newSemester, 10),
                      lectureName: newLectureName.trim(),
                    });
                    setNewLectureName("");
                    toast({ title: "Gespeichert", description: "Vorlesung wurde angelegt." });
                  } catch (err) {
                    toast({ title: "Fehler", description: err instanceof Error ? err.message : "Speichern fehlgeschlagen", variant: "destructive" });
                  }
                }}
              >
                <Plus className="h-4 w-4" /> Hinzufügen
              </Button>

              <div className="space-y-2">
                {lectures === undefined ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : lectures.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">Noch keine Vorlesungen hinterlegt.</p>
                ) : (
                  lectures.map((lecture) => (
                    <div
                      key={lecture._id}
                      className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/80 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">{lecture.lectureName}</p>
                        <p className="text-sm text-muted-foreground">
                          {lecture.kurs} · {lecture.semesterNumber}. Semester
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={async () => {
                          try {
                            await deleteLecture({ id: lecture._id });
                            toast({ title: "Gelöscht", description: `${lecture.lectureName} wurde entfernt.` });
                          } catch (err) {
                            toast({ title: "Fehler", description: err instanceof Error ? err.message : "Löschen fehlgeschlagen", variant: "destructive" });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Panel>

            <Panel
              title="Material- und Upload-Regeln"
              icon={<Settings2 className="h-4 w-4" />}
              description="Formate, Größenlimits und Sichtbarkeit können zentral für Aufgaben und Beiträge definiert werden."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <SettingTile
                  label="Erlaubte Formate"
                  value="PDF, DOCX, PPTX, PNG, JPG"
                />
                <SettingTile label="Max. Upload-Größe" value="10 MB Standard" />
                <SettingTile
                  label="Sichtbarkeit"
                  value="private · course · group · public"
                />
                <SettingTile
                  label="Quoten"
                  value="pro Nutzer / Kurs konfigurierbar"
                />
              </div>

              <div className="mt-4 rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium">Protokollpflicht</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Moderationsaktionen, Upload-Freigaben und Löschungen
                      sollten mit Zeitstempel dokumentiert werden.
                    </p>
                  </div>
                </div>
              </div>
            </Panel>
          </section>

          <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-heading text-2xl font-semibold">
                  Weiterführende Admin-Aktionen
                </h2>
                <p className="text-sm text-muted-foreground">
                  Direkte Sprünge in die fachlich relevanten Bereiche.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/forum">
                  <Button variant="outline" className="gap-2">
                    <Eye className="h-4 w-4" /> Forum prüfen
                  </Button>
                </Link>
                <Link to="/planner">
                  <Button variant="outline" className="gap-2">
                    <LayoutGrid className="h-4 w-4" /> Aufgaben prüfen
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button className="gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Zur Nutzeransicht
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-left text-white shadow-sm backdrop-blur-sm">
      <p className="text-2xl font-semibold leading-none">{value}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/70">
        {label}
      </p>
      <p className="mt-1 text-[11px] text-white/70">{hint}</p>
    </div>
  );
}

function Panel({
  title,
  icon,
  description,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <h2 className="font-heading text-2xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function SettingTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-medium text-foreground">{value}</p>
    </div>
  );
}

export default AdminDashboardPage;
