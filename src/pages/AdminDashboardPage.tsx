import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  AlertTriangle,
  BookMarked,
  CheckCircle2,
  ChevronDown,
  Eye,
  GraduationCap,
  Info,
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
  MessageCircleHeart,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
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
import { useLanguage } from "@/hooks/useLanguage";

const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => i + 1);



const statusTone = (state: string) => {
  if (state === "offen" || state === "hoch")
    return "bg-destructive/10 text-destructive";
  if (state === "freigegeben" || state === "aktiv" || state === "importiert")
    return "bg-success/10 text-success";
  return "bg-secondary text-muted-foreground";
};

const AdminDashboardPage = () => {
  const { language } = useLanguage();
  const profiles = useQuery(api.admin.getAll, {});
  const approveUser = useMutation(api.admin.approveUser);
  const rejectUser = useMutation(api.admin.rejectUser);
  const lectures = useQuery(api.semesterLectures.list, {});
  const saveLecture = useMutation(api.semesterLectures.manage);
  const deleteLecture = useMutation(api.semesterLectures.deleteLecture);
  const seedLectures = useMutation(api.semesterLectures.seedIfEmpty);
  const feedbackStats = useQuery(api.feedback.getAdminStats, {});
  const userReports = useQuery(api.userReports.getAdminReports, {});
  const markReportDone = useMutation(api.userReports.markDone);
  const postReports = useQuery(api.postReports.getAdminReports, {});
  const dismissPostReport = useMutation(api.postReports.markDone);
  const [expandedReportType, setExpandedReportType] = useState<
    "bug" | "feature" | null
  >(null);
  const [markingDone, setMarkingDone] = useState<string | null>(null);
  const [dismissingReport, setDismissingReport] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [newKurs, setNewKurs] = useState("");
  const [newSemester, setNewSemester] = useState("1");
  const [newLectureName, setNewLectureName] = useState("");
  const [lecturesOpen, setLecturesOpen] = useState(true);
  const [lectureSearch, setLectureSearch] = useState("");

  const ruleCards = [
    {
      title: language.match({ english: () => "Approvals", german: () => "Freischaltungen" }),
      text: language.match({ english: () => "Review new users, grant access or delete accounts.", german: () => "Neue Nutzer prüfen, Freigaben aussprechen oder Accounts löschen." }),
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: language.match({ english: () => "Moderation", german: () => "Moderation" }),
      text: language.match({ english: () => "Review reported posts, delete content and log actions.", german: () => "Gemeldete Posts prüfen, Beiträge löschen und Maßnahmen protokollieren." }),
      icon: <ShieldCheck className="h-4 w-4" />,
    },
    {
      title: language.match({ english: () => "Lectures", german: () => "Vorlesungen" }),
      text: language.match({ english: () => "Import, edit and provide lectures as options in forms.", german: () => "Vorlesungen importieren, bearbeiten und als Auswahl in Formularen bereitstellen." }),
      icon: <BookMarked className="h-4 w-4" />,
    },
    {
      title: language.match({ english: () => "Material Rules", german: () => "Materialregeln" }),
      text: language.match({ english: () => "Centrally control formats, max file size and visibility for uploads.", german: () => "Formate, Maximalgröße und Sichtbarkeit für Uploads zentral steuern." }),
      icon: <FolderUp className="h-4 w-4" />,
    },
  ];


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
        title: language.match({ english: () => "Approved", german: () => "Freigegeben" }),
        description: language.match({ english: () => "The user has been approved.", german: () => "Der Nutzer wurde erfolgreich freigegeben." }),
      });
    } catch (err) {
      toast({
        title: language.match({ english: () => "Error", german: () => "Fehler" }),
        description:
          err instanceof Error ? err.message : language.match({ english: () => "Approval failed", german: () => "Freigabe fehlgeschlagen" }),
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
        title: language.match({ english: () => "Rejected", german: () => "Abgelehnt" }),
        description: language.match({ english: () => "The user has been rejected.", german: () => "Der Nutzer wurde abgelehnt." }),
      });
    } catch (err) {
      toast({
        title: language.match({ english: () => "Error", german: () => "Fehler" }),
        description:
          err instanceof Error ? err.message : language.match({ english: () => "Rejection failed", german: () => "Ablehnung fehlgeschlagen" }),
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const pendingProfiles = profiles?.filter((p) => p.status === "pending") ?? [];

  const ratingMeta = [
    {
      value: 1,
      emoji: "😞",
      label: language.match({ english: () => "Bad", german: () => "Schlecht" }),
      color: "hsl(var(--destructive))",
    },
    {
      value: 2,
      emoji: "😐",
      label: language.match({ english: () => "Okay", german: () => "Okay" }),
      color: "hsl(var(--muted-foreground))",
    },
    { value: 3, emoji: "🙂", label: language.match({ english: () => "Good", german: () => "Gut" }), color: "hsl(var(--info))" },
    { value: 4, emoji: "😍", label: language.match({ english: () => "Great", german: () => "Super" }), color: "hsl(var(--success))" },
  ];

  const ratingChartData = feedbackStats
    ? ratingMeta.map((m) => ({
        ...m,
        count: feedbackStats.byRating[m.value] ?? 0,
        pct:
          feedbackStats.total > 0
            ? Math.round(
                ((feedbackStats.byRating[m.value] ?? 0) / feedbackStats.total) *
                  100,
              )
            : 0,
      }))
    : [];

  const reportTypeMeta: Record<string, { label: string }> = {
    bug: { label: language.match({ english: () => "Bugs", german: () => "Fehler" }) },
    feature: { label: language.match({ english: () => "Feature Requests", german: () => "Optimierungsvorschläge" }) },
  };

  const avgRating =
    feedbackStats && feedbackStats.total > 0
      ? (
          Object.entries(feedbackStats.byRating).reduce(
            (sum, [r, c]) => sum + Number(r) * c,
            0,
          ) / feedbackStats.total
        ).toFixed(1)
      : null;

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
                  {language.match({ english: () => "Admin Dashboard", german: () => "Admin-Dashboard" })}
                </div>
                <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">
                  {language.match({ english: () => "Moderation, approvals and lecture management in one place", german: () => "Moderation, Freischaltungen und Vorlesungsverwaltung an einem Ort" })}
                </h1>
                <p className="mt-4 max-w-2xl text-sm text-white/85 sm:text-base">
                  {language.match({
                    english: () => "approve users, review reported posts, administer lectures and control upload rules.",
                    german: () => "Nutzer freischalten, gemeldete Beiträge prüfen, Vorlesungen administrieren und Upload-Regeln steuern." })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[34rem] lg:flex-1">
                <MetricCard
                  label={language.match({ english: () => "Pending Approvals", german: () => "Offene Freigaben" })}
                  value={String(pendingProfiles.length)}
                  hint={language.match({ english: () => "Users waiting", german: () => "Nutzer warten" })}
                />
                <MetricCard
                  label={language.match({ english: () => "Reports", german: () => "Meldungen" })}
                  value={String(
                    postReports?.filter((r) => r.status === "offen").length ?? "—",
                  )}
                  hint={language.match({ english: () => "Forum queue", german: () => "Forum-Queue" })}
                />
                <MetricCard
                  label={language.match({ english: () => "Lectures", german: () => "Vorlesungen" })}
                  value={String(lectures?.length ?? "—")}
                  hint={language.match({ english: () => "stored entries", german: () => "hinterlegte Einträge" })}
                />
                <MetricCard
                  label={language.match({ english: () => "Upload Rules", german: () => "Upload-Regeln" })}
                  value="4"
                  hint={language.match({ english: () => "configurable", german: () => "konfigurierbar" })}
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
              title={language.match({ english: () => "User Approvals", german: () => "Nutzerfreischaltungen" })}
              icon={<Users className="h-4 w-4" />}
              description={language.match({ english: () => "Admins review new registrations, approve users or delete accounts.", german: () => "Admins prüfen neue Registrierungen, geben Nutzer frei oder löschen Accounts." })}
            >
              {profiles === undefined ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingProfiles.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {language.match({ english: () => "All users have been approved.", german: () => "Alle Nutzer wurden bereits freigegeben." })}
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
                              {p.displayName || p.email || language.match({ english: () => "Unknown", german: () => "Unbekannt" })}
                            </p>
                            <Badge
                              variant="secondary"
                              className="bg-amber-500/10 text-amber-600"
                            >
                              {language.match({ english: () => "pending", german: () => "ausstehend" })}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {[p.matrikelnummer, p.studienfach, p.hochschule]
                              .filter(Boolean)
                              .join(" · ") || language.match({ english: () => "No details", german: () => "Keine Details" })}
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
                              language.match({ english: () => "Reject", german: () => "Ablehnen" })
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
                              language.match({ english: () => "Approve", german: () => "Freigeben" })
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
              title={language.match({ english: () => "Moderation Log", german: () => "Moderationsprotokoll" })}
              icon={<FileWarning className="h-4 w-4" />}
              description={language.match({ english: () => "Reported forum posts and moderation actions must be documented traceably.", german: () => "Gemeldete Forum-Beiträge und Moderationsaktionen sollen nachvollziehbar dokumentiert werden." })}
            >
              <div className="space-y-3">
                {postReports === undefined ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                  </div>
                ) : postReports.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    {language.match({ english: () => "No open reports.", german: () => "Keine offenen Meldungen." })}
                  </p>
                ) : (
                  postReports.map((report) => (
                    <div
                      key={report._id}
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
                            {report.forumName} · {language.match({ english: () => "reported by", german: () => "gemeldet von" })} {report.reportedBy}
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
                            disabled={dismissingReport === report._id}
                            onClick={async () => {
                              setDismissingReport(report._id);
                              try {
                                await dismissPostReport({ id: report._id });
                              } finally {
                                setDismissingReport(null);
                              }
                            }}
                          >
                            {dismissingReport === report._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              language.match({ english: () => "Done", german: () => "Erledigt" })
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Panel
              title={language.match({ english: () => "Lecture Management", german: () => "Vorlesungsverwaltung" })}
              icon={<GraduationCap className="h-4 w-4" />}
              description={language.match({ english: () => "Create lectures per course and semester. Users are automatically enrolled in the matching lecture forums during onboarding.", german: () => "Lege Vorlesungen pro Kurs und Semester an. Nutzer werden beim Onboarding automatisch in die passenden Vorlesungs-Foren eingeschrieben." })}
            >
              <div className="mb-4 grid gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {language.match({ english: () => "Course", german: () => "Kurs" })}
                  </label>
                  <Select value={newKurs} onValueChange={setNewKurs}>
                    <SelectTrigger>
                      <SelectValue placeholder={language.match({ english: () => "Select course", german: () => "Kurs wählen" })} />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "INF",
                        "TIF",
                        "WIF",
                        "BWL",
                        "MAB",
                        "ETE",
                        "MEC",
                        "DSA",
                        "AI",
                        "SEC",
                        "WI",
                      ].map((k) => (
                        <SelectItem key={k} value={k}>
                          {k}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {language.match({ english: () => "Semester", german: () => "Semester" })}
                  </label>
                  <Select value={newSemester} onValueChange={setNewSemester}>
                    <SelectTrigger>
                      <SelectValue placeholder={language.match({ english: () => "Semester", german: () => "Semester" })} />
                    </SelectTrigger>
                    <SelectContent>
                      {SEMESTER_OPTIONS.map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          {s}.
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {language.match({ english: () => "Lecture Name", german: () => "Vorlesungsname" })}
                  </label>
                  <Input
                    value={newLectureName}
                    onChange={(e) => setNewLectureName(e.target.value)}
                    placeholder={language.match({ english: () => "e.g. Mathematics 1", german: () => "z.B. Mathematik 1" })}
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
                    toast({
                      title: language.match({ english: () => "Saved", german: () => "Gespeichert" }),
                      description: language.match({ english: () => "Lecture has been created.", german: () => "Vorlesung wurde angelegt." }),
                    });
                  } catch (err) {
                    toast({
                      title: language.match({ english: () => "Error", german: () => "Fehler" }),
                      description:
                        err instanceof Error
                          ? err.message
                          : language.match({ english: () => "Save failed", german: () => "Speichern fehlgeschlagen" }),
                      variant: "destructive",
                    });
                  }
                }}
              >
                <Plus className="h-4 w-4" /> {language.match({ english: () => "Add", german: () => "Hinzufügen" })}
              </Button>

              <button
                onClick={() => setLecturesOpen(!lecturesOpen)}
                className="mb-3 flex w-full items-center justify-between text-left"
              >
                <span className="text-sm font-medium text-muted-foreground">
                  {lectures ? `${lectures.length} ${language.match({ english: () => "Lectures", german: () => "Vorlesungen" })}` : language.match({ english: () => "Lectures", german: () => "Vorlesungen" })}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    lecturesOpen ? "" : "-rotate-90"
                  }`}
                />
              </button>

              {lecturesOpen && (
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      placeholder={language.match({ english: () => "Search lecture…", german: () => "Vorlesung suchen…" })}
                      value={lectureSearch}
                      onChange={(e) => setLectureSearch(e.target.value)}
                      className="pl-3"
                    />
                  </div>

                  <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
                    {lectures === undefined ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : lectures.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        {language.match({ english: () => "No lectures stored yet.", german: () => "Noch keine Vorlesungen hinterlegt." })}
                      </p>
                    ) : (
                      (() => {
                        const q = lectureSearch.toLowerCase();
                        const filtered = q
                          ? lectures.filter(
                              (l) =>
                                l.lectureName.toLowerCase().includes(q) ||
                                l.kurs.toLowerCase().includes(q) ||
                                String(l.semesterNumber).includes(q)
                            )
                          : lectures;
                        return filtered.length === 0 ? (
                          <p className="py-4 text-center text-sm text-muted-foreground">
                            {language.match({ english: () => "No lectures found.", german: () => "Keine Vorlesungen gefunden." })}
                          </p>
                        ) : (
                          filtered.map((lecture) => (
                            <div
                              key={lecture._id}
                              className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/80 px-4 py-3"
                            >
                              <div>
                                <p className="font-medium">
                                  {lecture.lectureName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {lecture.kurs} · {lecture.semesterNumber}.
                                  {language.match({ english: () => "Semester", german: () => "Semester" })}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={async () => {
                                  try {
                                    await deleteLecture({ id: lecture._id });
                                    toast({
                                      title: language.match({ english: () => "Deleted", german: () => "Gelöscht" }),
                                      description: language.match({ english: () => `${lecture.lectureName} has been removed.`, german: () => `${lecture.lectureName} wurde entfernt.` }),
                                    });
                                  } catch (err) {
                                    toast({
                                      title: language.match({ english: () => "Error", german: () => "Fehler" }),
                                      description:
                                        err instanceof Error
                                          ? err.message
                                          : language.match({ english: () => "Delete failed", german: () => "Löschen fehlgeschlagen" }),
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        );
                      })()
                    )}
                  </div>
                </div>
              )}
            </Panel>

            <div className="flex flex-col gap-6">
              <Panel
                title={language.match({ english: () => "Material & Upload Rules", german: () => "Material- und Upload-Regeln" })}
                icon={<Settings2 className="h-4 w-4" />}
                description={language.match({ english: () => "Formats, size limits and visibility can be centrally defined for tasks and posts.", german: () => "Formate, Größenlimits und Sichtbarkeit können zentral für Aufgaben und Beiträge definiert werden." })}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <SettingTile
                    label={language.match({ english: () => "Allowed Formats", german: () => "Erlaubte Formate" })}
                    value="PDF, DOCX, PPTX, PNG, JPG"
                  />
                  <SettingTile
                    label={language.match({ english: () => "Max Upload Size", german: () => "Max. Upload-Größe" })}
                    value={language.match({ english: () => "10 MB Standard", german: () => "10 MB Standard" })}
                  />
                  <SettingTile
                    label={language.match({ english: () => "Visibility", german: () => "Sichtbarkeit" })}
                    value="private · course · group · public"
                  />
                  <SettingTile
                    label={language.match({ english: () => "Quotas", german: () => "Quoten" })}
                    value={language.match({ english: () => "configurable per user / course", german: () => "pro Nutzer / Kurs konfigurierbar" })}
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium">{language.match({ english: () => "Logging Requirement", german: () => "Protokollpflicht" })}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {language.match({ english: () => "Moderation actions, upload approvals and deletions should be documented with timestamps.", german: () => "Moderationsaktionen, Upload-Freigaben und Löschungen sollten mit Zeitstempel dokumentiert werden." })}
                      </p>
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel
                title={language.match({ english: () => "User Satisfaction", german: () => "Nutzerzufriedenheit" })}
                icon={<MessageCircleHeart className="h-4 w-4" />}
                description={language.match({ english: () => "Anonymous user ratings — based on all submitted feedback — Customer Satisfaction Score (CSAT).", german: () => "Anonyme Bewertungen der Nutzer — Basis sind alle abgegebenen Rückmeldungen — Customer Satisfaction Score (CSAT)." })}
              >
                {feedbackStats === undefined ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-border/60 bg-background/80 p-4 text-center">
                        <p className="text-2xl font-semibold">
                          {feedbackStats.total}
                        </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            {language.match({ english: () => "Feedback", german: () => "Rückmeldungen" })}
                          </p>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="rounded-2xl border border-border/60 bg-background/80 p-4 text-center cursor-default">
                              <p className="text-2xl font-semibold">
                                {feedbackStats.totalUsers > 0
                                  ? Math.round(
                                      (feedbackStats.total /
                                        feedbackStats.totalUsers) *
                                        100,
                                    )
                                  : 0}
                                %
                              </p>
                              <p className="mt-1 flex items-center justify-center gap-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                {language.match({ english: () => "Response Rate", german: () => "Rücklaufquote" })}
                                <Info className="h-3 w-3 shrink-0" />
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="max-w-[200px] text-center text-xs"
                          >
                            {language.match({ english: () => `Share of users who have submitted a rating (${feedbackStats.total} of ${feedbackStats.totalUsers})`, german: () => `Anteil der Nutzer, die bisher eine Bewertung abgegeben haben (${feedbackStats.total} von ${feedbackStats.totalUsers})` })}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="rounded-2xl border border-border/60 bg-background/80 p-4 text-center cursor-default">
                              <p className="text-2xl font-semibold">
                                {avgRating ?? "—"}
                              </p>
                              <p className="mt-1 flex items-center justify-center gap-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                {language.match({ english: () => "Ø Rating", german: () => "Ø Bewertung" })}
                                <Info className="h-3 w-3 shrink-0" />
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="max-w-[200px] text-center text-xs"
                          >
                            {language.match({ english: () => "Weighted average of all ratings on a scale from 1 (😞 Bad) to 4 (😍 Great)", german: () => "Gewichteter Durchschnitt aller Bewertungen auf einer Skala von 1 (😞 Schlecht) bis 4 (😍 Super)" })}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {feedbackStats.total === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        {language.match({ english: () => "No feedback received yet.", german: () => "Noch keine Rückmeldungen eingegangen." })}
                      </p>
                    ) : (
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {language.match({ english: () => "Rating Distribution", german: () => "Bewertungsverteilung" })}
                        </p>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart
                            data={ratingChartData}
                            barSize={40}
                            margin={{ top: 4, right: 0, bottom: 0, left: -20 }}
                          >
                            <XAxis
                              dataKey="label"
                              tick={{
                                fontSize: 12,
                                fill: "hsl(var(--muted-foreground))",
                              }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v, i) =>
                                `${ratingChartData[i]?.emoji ?? ""} ${v}`
                              }
                            />
                            <YAxis
                              tickFormatter={(v) => `${v}%`}
                              tick={{
                                fontSize: 11,
                                fill: "hsl(var(--muted-foreground))",
                              }}
                              axisLine={false}
                              tickLine={false}
                              domain={[0, 100]}
                            />
                            <ChartTooltip
                              cursor={{ fill: "hsl(var(--muted)/0.15)" }}
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0]
                                  .payload as (typeof ratingChartData)[0];
                                return (
                                  <div className="rounded-xl border border-border/60 bg-card px-3 py-2 text-sm shadow-md">
                                    <p className="font-medium">
                                      {d.emoji} {d.label}
                                    </p>
                                    <p className="text-muted-foreground">
                                      {d.count} {language.match({ english: () => "votes", german: () => "Stimmen" })} · {d.pct}%
                                    </p>
                                  </div>
                                );
                              }}
                            />
                            <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                              {ratingChartData.map((entry) => (
                                <Cell
                                  key={entry.value}
                                  fill={entry.color}
                                  fillOpacity={0.85}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>

                        <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {language.match({ english: () => "Reports", german: () => "Meldungen" })}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {(["bug", "feature"] as const).map((type) => {
                            const count =
                              feedbackStats.reports.byType[type] ?? 0;
                            const isExpanded = expandedReportType === type;
                            return (
                              <button
                                key={type}
                                onClick={() =>
                                  setExpandedReportType(
                                    isExpanded ? null : type,
                                  )
                                }
                                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                                  isExpanded
                                    ? "border-primary/40 bg-primary/5"
                                    : "border-border/60 bg-background/80 hover:border-border"
                                }`}
                              >
                                <div>
                                  <p className="text-lg font-semibold">
                                    {count}
                                  </p>
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {reportTypeMeta[type]?.label ?? type}
                                  </p>
                                </div>
                                <motion.span
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="text-muted-foreground"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </motion.span>
                              </button>
                            );
                          })}
                        </div>

                        <AnimatePresence>
                          {expandedReportType && (
                            <motion.div
                              key={expandedReportType}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 space-y-2">
                                {userReports === undefined ? (
                                  <div className="flex justify-center py-4">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                  </div>
                                ) : (
                                  (() => {
                                    const forType = userReports.filter(
                                      (r) => r.type === expandedReportType,
                                    );
                                    const open = forType.filter(
                                      (r) => !r.status || r.status === "open",
                                    );
                                    const done = forType
                                      .filter((r) => r.status === "done")
                                      .slice(0, 10);

                                    const formatDate = (ts: number) =>
                                      new Date(ts).toLocaleDateString("de-DE", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      });

                                    return (
                                      <>
                                        {open.length === 0 && (
                                          <p className="py-3 text-center text-sm text-muted-foreground">
                                            {language.match({ english: () => "No open reports.", german: () => "Keine offenen Meldungen." })}
                                          </p>
                                        )}
                                        {open.map((report) => (
                                          <div
                                            key={report._id}
                                            className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-background/80 p-4"
                                          >
                                            <div className="min-w-0">
                                              <p className="text-sm text-foreground">
                                                {report.message}
                                              </p>
                                              <p className="mt-1 text-[11px] text-muted-foreground">
                                                {formatDate(report.createdAt)}
                                              </p>
                                            </div>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="shrink-0"
                                              disabled={
                                                markingDone === report._id
                                              }
                                              onClick={async () => {
                                                setMarkingDone(report._id);
                                                try {
                                                  await markReportDone({
                                                    id: report._id,
                                                  });
                                                } finally {
                                                  setMarkingDone(null);
                                                }
                                              }}
                                            >
                                              {markingDone === report._id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                              ) : (
                                                  language.match({ english: () => "Done", german: () => "Erledigt" })
                                                )}
                                              </Button>
                                          </div>
                                        ))}

                                        {done.length > 0 && (
                                          <>
                                            <div className="flex items-center gap-3 py-1">
                                              <div className="h-px flex-1 bg-border/60" />
                                              <span className="text-[11px] text-muted-foreground">
                                                {language.match({ english: () => "Done", german: () => "Erledigt" })}
                                              </span>
                                              <div className="h-px flex-1 bg-border/60" />
                                            </div>
                                            {done.map((report) => (
                                              <div
                                                key={report._id}
                                                className="rounded-2xl border border-border/40 bg-background/40 p-4 opacity-50"
                                              >
                                                <p className="text-sm text-muted-foreground line-through">
                                                  {report.message}
                                                </p>
                                                <p className="mt-1 text-[11px] text-muted-foreground">
                                                  {formatDate(report.createdAt)}
                                                </p>
                                              </div>
                                            ))}
                                          </>
                                        )}
                                      </>
                                    );
                                  })()
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                )}
              </Panel>
            </div>
          </section>

          <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-heading text-2xl font-semibold">
                  {language.match({ english: () => "Further Admin Actions", german: () => "Weiterführende Admin-Aktionen" })}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {language.match({ english: () => "Direct jumps to the relevant areas.", german: () => "Direkte Sprünge in die fachlich relevanten Bereiche." })}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/forum">
                  <Button variant="outline" className="gap-2">
                    <Eye className="h-4 w-4" /> {language.match({ english: () => "Review Forum", german: () => "Forum prüfen" })}
                  </Button>
                </Link>
                <Link to="/planner">
                  <Button variant="outline" className="gap-2">
                    <LayoutGrid className="h-4 w-4" /> {language.match({ english: () => "Review Tasks", german: () => "Aufgaben prüfen" })}
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button className="gap-2">
                    <CheckCircle2 className="h-4 w-4" /> {language.match({ english: () => "Go to User View", german: () => "Zur Nutzeransicht" })}
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
  className,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        "rounded-3xl border border-border/60 bg-card p-6 shadow-sm " +
        (className ?? "")
      }
    >
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
