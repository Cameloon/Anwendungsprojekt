import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Circle,
  MessageSquare,
  Plus,
  Users,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Navbar from "@/components/Navbar";
import GroupsPanel from "@/components/GroupsPanel";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";

const QUOTES = [
  "Der Weg ist das Ziel.",
  "Kleine Schritte, groesse Wirkung.",
  "Beginne - der Rest folgt.",
  "Heute ist ein guter Tag zum Lernen.",
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 11) return "Guten Morgen";
  if (h < 18) return "Hallo";
  return "Guten Abend";
};

const DashboardPage = () => {
  const profile = useProfile();
  const postsData = useQuery(api.posts.listRecent);
  const scriptsData = useQuery(api.scripts.listPublic);
  const deadlinesData = useQuery(api.deadlines.listForUser);
  const lecturesData = useQuery(
    api.semesterLectures.getLecturesForMyJahrgang,
    {},
  );
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const name = profile?.display_name ?? "";
  const now = useMemo(() => new Date(), []);

  const posts = useMemo(() => postsData ?? [], [postsData]);
  const scripts = useMemo(() => scriptsData ?? [], [scriptsData]);
  const deadlines = useMemo(() => deadlinesData ?? [], [deadlinesData]);
  const lectures = useMemo(() => lecturesData ?? [], [lecturesData]);

  const subjectsList = useMemo(
    () => lectures.map((lecture) => lecture.lectureName).sort(),
    [lectures],
  );

  const selectedPosts = useMemo(() => {
    if (!selectedSubject) return [];
    return posts.filter((post) => post.tag === selectedSubject);
  }, [posts, selectedSubject]);

  const selectedScripts = useMemo(() => {
    if (!selectedSubject) return [];
    return scripts.filter((script) => script.subject === selectedSubject);
  }, [scripts, selectedSubject]);

  const selectedDeadlines = useMemo(() => {
    if (!selectedSubject) return [];
    return deadlines
      .filter((deadline) => deadline.vorlesung === selectedSubject)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [deadlines, selectedSubject]);

  const latestPosts = useMemo(() => posts.slice(0, 5), [posts]);
  const latestScripts = useMemo(() => scripts.slice(0, 5), [scripts]);
  const latestDeadlines = useMemo(
    () =>
      [...deadlines]
        .sort((a, b) => {
          if (a.done !== b.done) return Number(a.done) - Number(b.done);
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        })
        .slice(0, 5),
    [deadlines],
  );

  const quote = useMemo(() => QUOTES[now.getDate() % QUOTES.length], [now]);

  const overviewBlocks = selectedSubject
    ? [
        {
          title: "Forenbeitraege",
          icon: <MessageSquare className="h-4 w-4" />,
          linkTo: "/forum",
          linkLabel: "Forum",
          items: selectedPosts.map((post) => ({
            title: post.title,
            meta: post.tag || "Forum",
            extra: post.content,
          })),
          emptyText: "Keine Beitraege.",
        },
        {
          title: "Skripte",
          icon: <BookOpen className="h-4 w-4" />,
          linkTo: "/skripte",
          linkLabel: "Bibliothek",
          items: selectedScripts.map((script) => ({
            title: script.title,
            meta: `${script.subject} · ${script.authorName}`,
            extra: script.description || "",
          })),
          emptyText: "Keine Skripte.",
        },
        {
          title: "Termine",
          icon: <CalendarDays className="h-4 w-4" />,
          linkTo: "/planner",
          linkLabel: "Planer",
          items: selectedDeadlines.map((deadline) => ({
            title: deadline.title,
            meta: new Date(deadline.date).toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }),
            extra: deadline.note || "",
            badgeClass: deadline.done
              ? "bg-success/15 text-success"
              : "bg-primary/10 text-primary",
            badgeText: deadline.done ? "Erledigt" : "Offen",
          })),
          emptyText: "Keine Termine.",
        },
      ]
    : [
        {
          title: "Alle Forenbeitraege",
          icon: <MessageSquare className="h-4 w-4" />,
          linkTo: "/forum",
          linkLabel: "Forum",
          items: latestPosts.map((post) => ({
            title: post.title,
            meta: post.tag || "Forum",
            extra: post.content,
          })),
          emptyText: "Keine Beitraege.",
        },
        {
          title: "Alle Skripte",
          icon: <BookOpen className="h-4 w-4" />,
          linkTo: "/skripte",
          linkLabel: "Bibliothek",
          items: latestScripts.map((script) => ({
            title: script.title,
            meta: `${script.subject} · ${script.authorName}`,
            extra: script.description || "",
          })),
          emptyText: "Keine Skripte.",
        },
        {
          title: "Alle Termine",
          icon: <CalendarDays className="h-4 w-4" />,
          linkTo: "/planner",
          linkLabel: "Planer",
          items: latestDeadlines.map((deadline) => ({
            title: deadline.title,
            meta: `${deadline.vorlesung || "Planer"} · ${new Date(deadline.date).toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}`,
            extra: deadline.note || "",
            badgeClass: deadline.done
              ? "bg-success/15 text-success"
              : "bg-primary/10 text-primary",
            badgeText: deadline.done ? "Erledigt" : "Offen",
          })),
          emptyText: "Keine Termine.",
        },
      ];

  const activeSubject = selectedSubject ?? "Alle Vorlesungen";
  const activeSubjectDescription = selectedSubject
    ? `Inhalte fuer ${selectedSubject}`
    : "Gesamtansicht aller Vorlesungen";

  const totalPosts = posts.length;
  const totalScripts = scripts.length;
  const totalDeadlines = deadlines.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="w-full px-4 pt-32 pb-24 sm:px-6 md:pt-24 lg:px-8">
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
                label="Vorlesungen"
                value={lectures.length}
                icon={<BookOpen className="h-5 w-5" />}
                hint="dieses Semester"
              />
              <HeroStat
                label="Forum"
                value={totalPosts}
                icon={<MessageSquare className="h-5 w-5" />}
                hint="Beitraege"
              />
              <HeroStat
                label="Skripte"
                value={totalScripts}
                icon={<Circle className="h-5 w-5" />}
                hint="verfuegbar"
              />
              <HeroStat
                label="Termine"
                value={totalDeadlines}
                icon={<CalendarDays className="h-5 w-5" />}
                hint="im Planer"
                tone="hot"
              />
            </div>
          </motion.section>

          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {subjectsList.length === 0 ? (
                <div className="rounded-3xl border border-border/60 bg-card p-8 text-sm text-muted-foreground sm:col-span-2 xl:col-span-4">
                  Keine Inhalte fuer die gewaehlte Filtereinstellung.
                </div>
              ) : (
                subjectsList.map((subject) => {
                  const subjectPosts = posts.filter((post) => post.tag === subject);
                  const subjectScripts = scripts.filter(
                    (script) => script.subject === subject,
                  );
                  const subjectDeadlines = deadlines.filter(
                    (deadline) => deadline.vorlesung === subject,
                  );
                  const total =
                    subjectPosts.length +
                    subjectScripts.length +
                    subjectDeadlines.length;

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
                        <div className="rounded-2xl bg-background/80 py-2">
                          <p className="font-semibold text-foreground">
                            {subjectDeadlines.length}
                          </p>
                          <p>Termine</p>
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
                  variant="outline"
                  onClick={() => setSelectedSubject(null)}
                  disabled={!selectedSubject}
                >
                  Gesamtuebersicht
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-3">
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
