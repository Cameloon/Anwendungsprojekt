import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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
  Shield,
  ShieldCheck,
  Users,
  FileWarning,
  Settings2,
  FolderUp,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface ReportItem {
  title: string;
  forum: string;
  reason: string;
  author: string;
  urgency: "hoch" | "mittel" | "niedrig";
}

interface LectureItem {
  title: string;
  semester: string;
  course: string;
  campus: string;
  status: "aktiv" | "importiert" | "archiviert";
}

const reportedPosts: ReportItem[] = [
  {
    title: "Unklare Klausurfrage",
    forum: "Mathematik II",
    reason: "Möglicher Spam / Tonfall",
    author: "@leon",
    urgency: "hoch",
  },
  {
    title: "Material-Upload doppelt",
    forum: "SE Projekt",
    reason: "Doppelter Inhalt gemeldet",
    author: "@julia",
    urgency: "mittel",
  },
  {
    title: "Abwertender Kommentar",
    forum: "BWL-Forum",
    reason: "Verstoß gegen Netiquette",
    author: "@noah",
    urgency: "hoch",
  },
];

const lectures: LectureItem[] = [
  {
    title: "Software Engineering",
    semester: "WiSe 2025/26",
    course: "TIF25B",
    campus: "DHBW Lörrach",
    status: "aktiv",
  },
  {
    title: "Mathematik für Informatiker",
    semester: "WiSe 2025/26",
    course: "TIF25B",
    campus: "DHBW Lörrach",
    status: "importiert",
  },
  {
    title: "Betriebswirtschaftslehre",
    semester: "SoSe 2026",
    course: "BWL24C",
    campus: "DHBW Stuttgart",
    status: "archiviert",
  },
];

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
  const updateRole = useMutation(api.admin.updateRole);
  const [updating, setUpdating] = useState<string | null>(null);

  const handleApprove = async (userId: string) => {
    setUpdating(userId);
    try {
      await updateRole({ userId, role: "user" });
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

  const openProfiles = profiles?.filter(
    (p) => !p.role || p.role === "user",
  ) ?? [];
  const pendingApproval = openProfiles.filter((p) => !p.displayName);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="w-full px-4 pt-32 md:pt-28 pb-24 sm:px-6 lg:px-8">
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
                  value={String(pendingApproval.length)}
                  hint="Nutzer warten"
                />
                <MetricCard label="Meldungen" value="3" hint="Forum-Queue" />
                <MetricCard
                  label="Vorlesungen"
                  value="18"
                  hint="aktive Einträge"
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
                  {openProfiles.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Alle Nutzer wurden bereits freigegeben.
                    </p>
                  )}
                  {openProfiles.map((p) => (
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
                              className={
                                p.displayName
                                  ? "bg-success/10 text-success"
                                  : "bg-destructive/10 text-destructive"
                              }
                            >
                              {p.displayName ? "freigegeben" : "offen"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {[
                              p.studienfach,
                              p.hochschule,
                              p.email,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Keine Details"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!p.displayName}
                            onClick={() => handleApprove(p.userId)}
                          >
                            {updating === p.userId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Prüfen"
                            )}
                          </Button>
                          {!p.displayName && (
                            <Button
                              size="sm"
                              disabled={updating === p.userId}
                              onClick={() => handleApprove(p.userId)}
                            >
                              {updating === p.userId ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Freigeben"
                              )}
                            </Button>
                          )}
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
                {reportedPosts.map((report) => (
                  <div
                    key={report.title}
                    className="rounded-2xl border border-border/60 bg-background/80 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{report.title}</p>
                          <Badge
                            variant="secondary"
                            className={statusTone(report.urgency)}
                          >
                            {report.urgency}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {report.forum} · gemeldet von {report.author}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {report.reason}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0">
                        Moderieren
                      </Button>
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
              description="Vorlesungen werden als kurs- und standortbezogene Auswahl für Formulare bereitgestellt."
            >
              <div className="space-y-3">
                {lectures.map((lecture) => (
                  <div
                    key={`${lecture.title}-${lecture.course}`}
                    className="rounded-2xl border border-border/60 bg-background/80 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{lecture.title}</p>
                          <Badge
                            variant="secondary"
                            className={statusTone(lecture.status)}
                          >
                            {lecture.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {lecture.semester} · {lecture.course} ·{" "}
                          {lecture.campus}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Import
                        </Button>
                        <Button size="sm" variant="ghost">
                          Bearbeiten
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
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
