import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Circle,
  Flame,
  MessageSquare,
  Plus,
  Presentation,
  Users,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import PageSkeleton from "@/components/PageSkeleton";
import GroupsPanel from "@/components/GroupsPanel";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { loadGroups } from "@/lib/groupStore";
import { loadPosts, subscribe, type SharedPost } from "@/lib/forumStore";
import {
  publicScripts,
  subscribeScripts,
  type Script,
} from "@/lib/scriptsStore";
import { useAuth } from "@/hooks/useAuth";

interface Task {
  id: string;
  title: string;
  due: string;
  fach: string;
  done: boolean;
}

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Hausarbeit Mathematik",
    due: "2026-04-28",
    fach: "Mathematik",
    done: false,
  },
  {
    id: "2",
    title: "Projektabgabe Software Engineering",
    due: "2026-04-30",
    fach: "SE",
    done: false,
  },
  {
    id: "3",
    title: "Kapitel 4 lesen",
    due: "2026-04-29",
    fach: "Statistik",
    done: true,
  },
  {
    id: "4",
    title: "Klausur Informatik vorbereiten",
    due: "2026-05-10",
    fach: "Informatik",
    done: false,
  },
];

const QUOTES = [
  "Der Weg ist das Ziel.",
  "Kleine Schritte, große Wirkung.",
  "Beginne - der Rest folgt.",
  "Heute ist ein guter Tag zum Lernen.",
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 11) return "Guten Morgen";
  if (h < 18) return "Hallo";
  return "Guten Abend";
};

const daysUntil = (iso: string) =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);

const formatRelative = (iso: string) => {
  const d = daysUntil(iso);
  if (d < 0) return `${Math.abs(d)}d überfällig`;
  if (d === 0) return "Heute";
  if (d === 1) return "Morgen";
  if (d <= 7) return `In ${d} Tagen`;
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
  });
};

const dueBadgeClass = (iso: string) => {
  const d = daysUntil(iso);
  if (d < 0) return "bg-destructive/10 text-destructive";
  if (d <= 2) return "bg-destructive/10 text-destructive";
  if (d <= 7) return "bg-accent/10 text-accent";
  return "bg-secondary text-muted-foreground";
};

const DashboardPage = () => {
  const { user } = useAuth();
  const profile = useProfile();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [posts, setPosts] = useState<SharedPost[]>(() => loadPosts());
  const [scripts, setScripts] = useState<Script[]>(() => publicScripts());
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [overviewMode, setOverviewMode] = useState<"overview" | "latest">(
    "overview",
  );
  const name = profile?.display_name ?? "";
  const now = new Date();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => subscribe(() => setPosts(loadPosts())), []);
  useEffect(() => subscribeScripts(() => setScripts(publicScripts())), []);

  const toggleTask = (id: string) =>
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    );

  const { open, doneCount, urgent, sortedOpen } = useMemo(() => {
    const openTasks = tasks.filter((task) => !task.done);
    const done = tasks.filter((task) => task.done).length;
    const urgentCount = openTasks.filter(
      (task) => daysUntil(task.due) <= 2,
    ).length;
    const sorted = [...openTasks].sort(
      (a, b) => new Date(a.due).getTime() - new Date(b.due).getTime(),
    );
    return {
      open: openTasks,
      doneCount: done,
      urgent: urgentCount,
      sortedOpen: sorted,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return sortedOpen;
  }, [sortedOpen]);

  const filteredPosts = useMemo(() => {
    return posts;
  }, [posts]);

  const filteredScripts = useMemo(() => {
    return scripts;
  }, [scripts]);

  const subjectsList = useMemo(() => {
    const values = new Set<string>();
    filteredTasks.forEach((task) => values.add(task.fach));
    filteredPosts.forEach((post) => {
      const key = post.fach || post.vorlesung || post.kurs;
      if (key) values.add(key);
    });
    filteredScripts.forEach((script) => values.add(script.subject));
    return Array.from(values).sort();
  }, [filteredTasks, filteredPosts, filteredScripts]);

  const selectedTasks = useMemo(() => {
    if (!selectedSubject) return [];
    return filteredTasks.filter((task) => task.fach === selectedSubject);
  }, [filteredTasks, selectedSubject]);

  const selectedPosts = useMemo(() => {
    if (!selectedSubject) return [];
    return filteredPosts.filter(
      (post) => (post.fach || post.vorlesung || post.kurs) === selectedSubject,
    );
  }, [filteredPosts, selectedSubject]);

  const selectedScripts = useMemo(() => {
    if (!selectedSubject) return [];
    return filteredScripts.filter(
      (script) => script.subject === selectedSubject,
    );
  }, [filteredScripts, selectedSubject]);

  const latestTasks = useMemo(() => sortedOpen.slice(0, 5), [sortedOpen]);
  const latestPosts = useMemo(() => posts.slice(0, 5), [posts]);
  const latestScripts = useMemo(() => scripts.slice(0, 5), [scripts]);

  const quote = useMemo(() => QUOTES[now.getDate() % QUOTES.length], [now]);

  const overviewBlocks =
    overviewMode === "latest"
      ? [
          {
            title: "Aktuelle Abgaben",
            icon: <CalendarDays className="h-4 w-4" />,
            linkTo: "/planner",
            linkLabel: "Planner",
            items: latestTasks.map((task) => ({
              title: task.title,
              meta: task.fach,
              extra: formatRelative(task.due),
              badgeClass: dueBadgeClass(task.due),
              done: task.done,
              onToggle: () => toggleTask(task.id),
            })),
            emptyText: "Keine offenen Aufgaben.",
          },
          {
            title: "Aktuelle Forenbeiträge",
            icon: <MessageSquare className="h-4 w-4" />,
            linkTo: "/forum",
            linkLabel: "Forum",
            items: latestPosts.map((post) => ({
              title: post.title,
              meta:
                post.fach || post.vorlesung || post.kurs || post.tag || "Forum",
              extra: post.content,
            })),
            emptyText: "Keine Beiträge.",
          },
          {
            title: "Neueste Skripte",
            icon: <BookOpen className="h-4 w-4" />,
            linkTo: "/skripte",
            linkLabel: "Bibliothek",
            items: latestScripts.map((script) => ({
              title: script.title,
              meta: `${script.subject} · ${script.author}`,
              extra: script.description || "",
            })),
            emptyText: "Keine Skripte.",
          },
        ]
      : selectedSubject
        ? [
            {
              title: "Abgaben",
              icon: <CalendarDays className="h-4 w-4" />,
              linkTo: "/planner",
              linkLabel: "Planner",
              items: selectedTasks.map((task) => ({
                title: task.title,
                meta: task.fach,
                extra: task.done
                  ? `Erledigt · ${formatRelative(task.due)}`
                  : `Offen · ${formatRelative(task.due)}`,
                badgeClass: dueBadgeClass(task.due),
                badgeText: formatRelative(task.due),
                done: task.done,
                onToggle: () => toggleTask(task.id),
              })),
              emptyText: "Keine Abgaben.",
            },
            {
              title: "Forenbeiträge",
              icon: <MessageSquare className="h-4 w-4" />,
              linkTo: "/forum",
              linkLabel: "Forum",
              items: selectedPosts.map((post) => ({
                title: post.title,
                meta:
                  post.fach ||
                  post.vorlesung ||
                  post.kurs ||
                  post.tag ||
                  "Forum",
                extra: post.content,
              })),
              emptyText: "Keine Beiträge.",
            },
            {
              title: "Skripte",
              icon: <BookOpen className="h-4 w-4" />,
              linkTo: "/skripte",
              linkLabel: "Bibliothek",
              items: selectedScripts.map((script) => ({
                title: script.title,
                meta: `${script.subject} · ${script.author}`,
                extra: script.description || "",
              })),
              emptyText: "Keine Skripte.",
            },
          ]
        : [
            {
              title: "Aktuelle Abgaben",
              icon: <CalendarDays className="h-4 w-4" />,
              linkTo: "/planner",
              linkLabel: "Planner",
              items: latestTasks.map((task) => ({
                title: task.title,
                meta: task.fach,
                extra: formatRelative(task.due),
                badgeClass: dueBadgeClass(task.due),
                done: task.done,
                onToggle: () => toggleTask(task.id),
              })),
              emptyText: "Keine offenen Aufgaben.",
            },
            {
              title: "Aktuelle Forenbeiträge",
              icon: <MessageSquare className="h-4 w-4" />,
              linkTo: "/forum",
              linkLabel: "Forum",
              items: latestPosts.map((post) => ({
                title: post.title,
                meta:
                  post.fach ||
                  post.vorlesung ||
                  post.kurs ||
                  post.tag ||
                  "Forum",
                extra: post.content,
              })),
              emptyText: "Keine Beiträge.",
            },
            {
              title: "Neueste Skripte",
              icon: <BookOpen className="h-4 w-4" />,
              linkTo: "/skripte",
              linkLabel: "Bibliothek",
              items: latestScripts.map((script) => ({
                title: script.title,
                meta: `${script.subject} · ${script.author}`,
                extra: script.description || "",
              })),
              emptyText: "Keine Skripte.",
            },
          ];

  if (loading) return <PageSkeleton />;

  const activeSubject = selectedSubject ?? "Alle Module";
  const activeSubjectDescription = selectedSubject
    ? `Inhalte für ${selectedSubject}`
    : "Gesamtansicht aller verfügbaren Module";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="w-full px-4 pt-32 md:pt-28 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="grid gap-5 lg:grid-cols-5"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-accent p-8 text-primary-foreground lg:col-span-3">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -left-10 -bottom-14 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
              <p className="relative text-xs uppercase tracking-[0.3em] opacity-80">
                {now.toLocaleDateString("de-DE", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <h1 className="relative mt-2 font-heading text-3xl font-bold leading-tight sm:text-4xl">
                {greeting()}
                {name ? `, ${name.split(" ")[0]}` : ""}
              </h1>
              <p className="relative mt-4 max-w-2xl text-base opacity-90">
                {quote}
              </p>
              <div className="relative mt-6 flex flex-wrap gap-2">
                <Link to="/planner">
                  <Button size="lg" variant="secondary" className="gap-2">
                    <Plus className="h-4 w-4" /> Neue Aufgabe
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setGroupsOpen(true)}
                  className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <Users className="h-4 w-4" /> Gruppen
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:col-span-2">
              <HeroStat
                label="Offen"
                value={open.length}
                icon={<Circle className="h-5 w-5" />}
                hint="Aufgaben"
              />
              <HeroStat
                label="Dringend"
                value={urgent}
                icon={<Zap className="h-5 w-5" />}
                hint="<= 2 Tage"
                tone="warn"
              />
              <HeroStat
                label="Erledigt"
                value={doneCount}
                icon={<CheckCircle2 className="h-5 w-5" />}
                hint="Gesamt"
                tone="ok"
              />
              <HeroStat
                label="Woche"
                value={Math.max(1, doneCount)}
                icon={<Flame className="h-5 w-5" />}
                hint="Streak"
                tone="hot"
              />
            </div>
          </motion.section>

          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {subjectsList.length === 0 ? (
                <div className="rounded-3xl border border-border/60 bg-card p-8 text-sm text-muted-foreground sm:col-span-2 xl:col-span-4">
                  Keine Inhalte für die gewählte Filtereinstellung.
                </div>
              ) : (
                subjectsList.map((subject) => {
                  const subjectTasks = filteredTasks.filter(
                    (task) => task.fach === subject,
                  );
                  const subjectPosts = filteredPosts.filter(
                    (post) =>
                      (post.fach || post.vorlesung || post.kurs) === subject,
                  );
                  const subjectScripts = filteredScripts.filter(
                    (script) => script.subject === subject,
                  );
                  const total =
                    subjectTasks.length +
                    subjectPosts.length +
                    subjectScripts.length;

                  const active = selectedSubject === subject;

                  return (
                    <button
                      key={subject}
                      type="button"
                      onClick={() =>
                        setSelectedSubject((current) =>
                          current === subject ? null : subject,
                        )
                      }
                      className={`group rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${active ? "border-primary bg-primary/5" : "border-border/60 bg-muted/30"}`}
                      aria-pressed={active}
                    >
                      <div className="mb-4 flex items-center justify-end">
                        <span className="text-xs text-muted-foreground">
                          {total} aktuell
                        </span>
                      </div>
                      <h3 className="text-center font-heading text-xl font-medium leading-tight text-muted-foreground">
                        {subject}
                      </h3>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-muted-foreground">
                        <div className="rounded-2xl bg-background/80 py-2">
                          <p className="font-semibold text-foreground">
                            {subjectTasks.length}
                          </p>
                          <p>Abgaben</p>
                        </div>
                        <div className="rounded-2xl bg-background/80 py-2">
                          <p className="font-semibold text-foreground">
                            {subjectPosts.length}
                          </p>
                          <p>Forum</p>
                        </div>
                        <div className="rounded-2xl bg-background/80 py-2">
                          <p className="font-semibold text-foreground">
                            {subjectScripts.length}
                          </p>
                          <p>Skripte</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-heading text-2xl font-semibold">
                  {activeSubject}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {activeSubjectDescription}
                </p>
              </div>
              <div className="flex flex-col gap-2 self-start">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedSubject(null)}
                  disabled={!selectedSubject}
                >
                  Zur Gesamtansicht
                </Button>
                <Button
                  type="button"
                  variant={overviewMode === "latest" ? "default" : "outline"}
                  onClick={() =>
                    setOverviewMode((current) =>
                      current === "latest" ? "overview" : "latest",
                    )
                  }
                >
                  Aktuelle Uploads
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {overviewBlocks.map((block) => (
                <OverviewBlock
                  key={block.title}
                  title={block.title}
                  icon={block.icon}
                  linkTo={block.linkTo}
                  linkLabel={block.linkLabel}
                  items={block.items}
                  emptyText={block.emptyText}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
      <GroupsPanel open={groupsOpen} onOpenChange={setGroupsOpen} />
    </div>
  );
};

function HeroStat({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ReactNode;
  tone?: "warn" | "ok" | "hot";
}) {
  const toneClasses =
    tone === "warn"
      ? "from-destructive/15 to-destructive/5 text-destructive"
      : tone === "ok"
        ? "from-success/15 to-success/5 text-success"
        : tone === "hot"
          ? "from-accent/20 to-accent/5 text-accent"
          : "from-primary/15 to-primary/5 text-primary";

  return (
    <div
      className={`rounded-2xl border border-border bg-gradient-to-br p-4 ${toneClasses}`}
    >
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium opacity-80">
        {icon}
      </div>
      <p className="font-heading text-3xl font-bold leading-none text-foreground">
        {value}
      </p>
      <p className="mt-1.5 text-xs font-medium text-muted-foreground">
        {label}
      </p>
      {hint && (
        <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function OverviewBlock({
  title,
  icon,
  linkTo,
  linkLabel,
  items,
  emptyText,
}: {
  title: string;
  icon: React.ReactNode;
  linkTo: string;
  linkLabel: string;
  items: Array<{
    title: string;
    meta?: string;
    extra?: string;
    badgeClass?: string;
    badgeText?: string;
    done?: boolean;
    onToggle?: () => void;
  }>;
  emptyText: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold">
          {icon}
          {title}
        </h3>
        <Link to={linkTo} className="text-xs text-primary hover:underline">
          {linkLabel}
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item.title}-${index}`}
              className="rounded-xl border border-border/60 bg-card p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  {item.meta && (
                    <p className="text-xs text-muted-foreground">{item.meta}</p>
                  )}
                  {item.extra && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {item.extra}
                    </p>
                  )}
                </div>
                {item.badgeClass && item.badgeText && (
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[11px] ${item.badgeClass}`}
                  >
                    {item.badgeText}
                  </span>
                )}
                {item.done !== undefined && item.onToggle && (
                  <button
                    onClick={item.onToggle}
                    className="shrink-0 text-muted-foreground hover:text-primary"
                  >
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DashboardPage;
