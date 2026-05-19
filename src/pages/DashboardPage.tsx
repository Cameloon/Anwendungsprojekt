import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ArrowRight,
  Plus,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  Circle,
  Flame,
  Target,
  Clock,
  Sparkles,
  Award,
  Zap,
  Presentation,
  Users,
  TrendingUp,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import PageSkeleton from "@/components/PageSkeleton";
import AiTipsCard from "@/components/AiTipsCard";
import ForumFeed from "@/components/ForumFeed";

import GroupsPanel from "@/components/GroupsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { loadGroups } from "@/lib/groupStore";

interface Task {
  id: string;
  title: string;
  due: string;
  fach: string;
  done: boolean;
}

const initialTasks: Task[] = [
  { id: "1", title: "Hausarbeit Mathematik", due: "2026-04-28", fach: "Mathematik", done: false },
  { id: "2", title: "Projektabgabe Software Engineering", due: "2026-04-30", fach: "SE", done: false },
  { id: "3", title: "Kapitel 4 lesen", due: "2026-04-29", fach: "Statistik", done: true },
  { id: "4", title: "Klausur Informatik vorbereiten", due: "2026-05-10", fach: "Informatik", done: false },
];

const QUOTES = [
  "Der Weg ist das Ziel.",
  "Kleine Schritte, große Wirkung.",
  "Beginne — der Rest folgt.",
  "Heute ist ein guter Tag zum Lernen.",
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 11) return "Guten Morgen";
  if (h < 18) return "Hallo";
  return "Guten Abend";
};

const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);

const formatRelative = (iso: string) => {
  const d = daysUntil(iso);
  if (d < 0) return `${Math.abs(d)}d überfällig`;
  if (d === 0) return "Heute";
  if (d === 1) return "Morgen";
  if (d <= 7) return `In ${d} Tagen`;
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
};

const DashboardPage = () => {
  const { user } = useAuth();
  const profile = useProfile();
  const [loading, setLoading] = useState(true);
  const name = profile?.display_name ?? "";
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [focus, setFocus] = useState<string>(() => localStorage.getItem("daily-focus") || "");
  const [now, setNow] = useState(new Date());
  const [pomodoro, setPomodoro] = useState({ running: false, seconds: 25 * 60 });
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [groupCount, setGroupCount] = useState(() => loadGroups().length);
  const [habits, setHabits] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem("habits-" + new Date().toISOString().slice(0, 10));
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!pomodoro.running) return;
    const t = setInterval(() => {
      setPomodoro((p) => {
        if (p.seconds <= 1) return { running: false, seconds: 25 * 60 };
        return { ...p, seconds: p.seconds - 1 };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [pomodoro.running]);

  useEffect(() => {
    localStorage.setItem("daily-focus", focus);
  }, [focus]);

  useEffect(() => {
    localStorage.setItem("habits-" + new Date().toISOString().slice(0, 10), JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    if (!groupsOpen) setGroupCount(loadGroups().length);
  }, [groupsOpen]);

  const toggleHabit = (key: string) => setHabits((h) => ({ ...h, [key]: !h[key] }));
  const toggle = (id: string) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const { open, doneCount, urgent, sortedOpen, progress } = useMemo(() => {
    const open = tasks.filter((t) => !t.done);
    const doneCount = tasks.filter((t) => t.done).length;
    const urgent = open.filter((t) => daysUntil(t.due) <= 2).length;
    const sortedOpen = [...open].sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());
    const progress = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);
    return { open, doneCount, urgent, sortedOpen, progress };
  }, [tasks]);

  const quote = useMemo(() => QUOTES[new Date().getDate() % QUOTES.length], []);

  if (loading) return <PageSkeleton />;

  const mm = String(Math.floor(pomodoro.seconds / 60)).padStart(2, "0");
  const ss = String(pomodoro.seconds % 60).padStart(2, "0");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-6">
        <div className="container mx-auto max-w-7xl">
          {/* HERO — split layout, large gradient panel + key actions */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid lg:grid-cols-5 gap-5 mb-6"
          >
            <div className="lg:col-span-3 relative overflow-hidden rounded-3xl p-8 md:p-10 bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground">
              <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-accent/30 blur-3xl" />
              <div className="relative">
                <p className="text-xs uppercase tracking-widest opacity-80 mb-2">
                  {now.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <h1 className="font-heading text-3xl md:text-5xl font-bold leading-tight mb-3">
                  {greeting()}{name ? `, ${name.split(" ")[0]}` : ""} 👋
                </h1>
                <p className="text-base md:text-lg opacity-90 mb-6 max-w-xl">„{quote}"</p>
                <div className="flex flex-wrap gap-2">
                  <Link to="/planner">
                    <Button size="lg" variant="secondary" className="gap-2">
                      <Plus className="h-4 w-4" /> Neue Aufgabe
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" onClick={() => setGroupsOpen(true)} className="gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white">
                    <Users className="h-4 w-4" /> Gruppen
                  </Button>
                </div>
              </div>
            </div>

            {/* Right column — quick stats stack */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-3">
              <HeroStat label="Offen" value={open.length} icon={<Circle className="h-5 w-5" />} hint="Aufgaben" />
              <HeroStat label="Dringend" value={urgent} icon={<Zap className="h-5 w-5" />} hint="≤ 2 Tage" tone="warn" />
              <HeroStat label="Erledigt" value={doneCount} icon={<CheckCircle2 className="h-5 w-5" />} hint="Diese Woche" tone="ok" />
              <HeroStat label="Streak" value={Math.max(1, doneCount)} icon={<Flame className="h-5 w-5" />} hint="Tage" tone="hot" />
            </div>
          </motion.section>


          {/* Tasks */}
          <div className="grid md:grid-cols-1 gap-5 mb-6">
            <section className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-heading font-semibold text-lg">Anstehende Aufgaben</h2>
                <Link to="/planner" className="text-sm text-primary hover:underline flex items-center gap-1">
                  Alle <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {sortedOpen.length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Alles erledigt – stark!</p>
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {sortedOpen.slice(0, 6).map((t) => {
                    const d = daysUntil(t.due);
                    const urgentBadge = d <= 2;
                    return (
                      <li key={t.id} className="flex items-center gap-3 py-3">
                        <button onClick={() => toggle(t.id)} className="text-muted-foreground hover:text-primary">
                          <Circle className="h-5 w-5" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{t.title}</p>
                          <p className="text-xs text-muted-foreground">{t.fach}</p>
                        </div>
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            urgentBadge ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {formatRelative(t.due)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <div className="mb-6">
            <ForumFeed />
          </div>

          <AiTipsCard />
        </div>
      </main>
      <GroupsPanel open={groupsOpen} onOpenChange={setGroupsOpen} />
    </div>
  );
};

const HeroStat = ({
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
}) => {
  const toneClasses =
    tone === "warn"
      ? "from-destructive/15 to-destructive/5 text-destructive"
      : tone === "ok"
      ? "from-success/15 to-success/5 text-success"
      : tone === "hot"
      ? "from-accent/20 to-accent/5 text-accent"
      : "from-primary/15 to-primary/5 text-primary";
  return (
    <div className={`rounded-2xl p-4 bg-gradient-to-br ${toneClasses} border border-border`}>
      <div className="flex items-center gap-1.5 text-xs font-medium opacity-80 mb-2">
        {icon}
      </div>
      <p className="font-heading text-3xl font-bold leading-none text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1.5 font-medium">{label}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
};

const QuickLink = ({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <Link to={to}>
    <Button variant="outline" className="w-full justify-start gap-2" size="lg">
      {icon}
      {children}
    </Button>
  </Link>
);

export default DashboardPage;
