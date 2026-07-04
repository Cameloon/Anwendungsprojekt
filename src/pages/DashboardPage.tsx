import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Files,
  MessageSquare,
  Plus,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/hooks/useLanguage";

const DashboardPage = () => {
  const profile = useProfile();
  const { language } = useLanguage();

  const QUOTES = language.match({
    english: () => [
      "Small steps lead to big results.",
      "Today is a great day to learn something new.",
      "One step at a time.",
    ],
    german: () => [
      "Der Weg ist das Ziel",
      "Kleine Schritte, grosse Wirkung",
      "Beginne - der Rest folgt.",
      "Heute ist ein guter Tag zum Lernen.",
    ],
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 11) {
      return language.match({
        english: () => "Good morning",
        german: () => "Guten Morgen",
      });
    }
    if (h < 18) {
      return language.match({ english: () => "Hello", german: () => "Hallo" });
    }
    return language.match({
      english: () => "Good evening",
      german: () => "Guten Abend",
    });
  };

  const postsData = useQuery(api.posts.listRecent);
  const scriptsData = useQuery(api.scripts.listVisible);
  const deadlinesData = useQuery(api.deadlines.listForUser);
  const lecturesData = useQuery(api.semesterLectures.getLecturesForMyKurs, {});
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const name = profile?.display_name ?? "";
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

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
    return posts.filter((post) => post.vorlesung === selectedSubject);
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
  const upcomingDeadlines = useMemo(
    () =>
      deadlines
        .filter((deadline) => !deadline.done)
        .filter(
          (deadline) => new Date(deadline.date).getTime() >= now.getTime(),
        )
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [deadlines, now],
  );
  const nextDeadline = upcomingDeadlines[0] ?? null;
  const openDeadlines = useMemo(
    () => deadlines.filter((deadline) => !deadline.done),
    [deadlines],
  );
  const urgentDeadlinesCount = useMemo(
    () =>
      openDeadlines.filter((deadline) => {
        const time = new Date(deadline.date).getTime();
        return (
          time >= now.getTime() &&
          time - now.getTime() <= 3 * 24 * 60 * 60 * 1000
        );
      }).length,
    [now, openDeadlines],
  );
  const latestPostsCount = latestPosts.length;
  const latestScriptsCount = latestScripts.length;

  const latestPostsHint =
    latestPostsCount > 0
      ? language.match({
          english: () => "Latest forum posts",
          german: () => "Neueste Eintraege im Forum",
        })
      : language.match({
          english: () => "No recent posts",
          german: () => "Keine aktuellen Beitraege",
        });
  const latestScriptsHint =
    latestScriptsCount > 0
      ? language.match({
          english: () => "Latest library uploads",
          german: () => "Neueste Uploads in der Bibliothek",
        })
      : language.match({
          english: () => "No recent scripts",
          german: () => "Keine aktuellen Skripte",
        });
  const quote = useMemo(() => QUOTES[now.getDate() % QUOTES.length], [now, QUOTES]);

  const overviewBlocks = selectedSubject
    ? [
        {
          title: language.match({
            english: () => "Deadlines",
            german: () => "Termine",
          }),
          icon: <CalendarDays className="h-4 w-4" />,
          linkTo: "/planner",
          linkLabel: language.match({
            english: () => "Planner",
            german: () => "Planer",
          }),
          items: selectedDeadlines.map((deadline) => ({
            title: deadline.title,
            meta: new Date(deadline.date).toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }),
            extra: deadline.note || "",
            itemLink: `/planner?deadline=${deadline._id}`,
            badgeClass: deadline.done
              ? "bg-success/15 text-success"
              : "bg-primary/10 text-primary",
            badgeText: deadline.done
              ? language.match({ english: () => "Done", german: () => "Erledigt" })
              : language.match({ english: () => "Open", german: () => "Offen" }),
          })),
          emptyText: language.match({
            english: () => "No deadlines.",
            german: () => "Keine Termine.",
          }),
        },
        {
          title: language.match({
            english: () => "Forum Posts",
            german: () => "Forenbeitraege",
          }),
          icon: <MessageSquare className="h-4 w-4" />,
          linkTo: "/forum",
          linkLabel: language.match({
            english: () => "Forum",
            german: () => "Forum",
          }),
          items: selectedPosts.map((post) => ({
            title: post.title,
            meta: post.tag || "Forum",
            extra: post.content,
            itemLink: `/forum/${post.forumId}/post/${post._id}`,
          })),
          emptyText: language.match({
            english: () => "No posts.",
            german: () => "Keine Beitraege.",
          }),
        },
        {
          title: language.match({
            english: () => "Scripts",
            german: () => "Skripte",
          }),
          icon: <BookOpen className="h-4 w-4" />,
          linkTo: "/skripte",
          linkLabel: language.match({
            english: () => "Library",
            german: () => "Bibliothek",
          }),
          items: selectedScripts.map((script) => ({
            title: script.title,
            meta: `${script.subject} - ${script.authorName}`,
            extra: script.description || "",
            itemLink: `/skripte?script=${script._id}`,
          })),
          emptyText: language.match({
            english: () => "No scripts.",
            german: () => "Keine Skripte.",
          }),
        },
      ]
    : [
        {
          title: language.match({
            english: () => "All Deadlines",
            german: () => "Alle Termine",
          }),
          icon: <CalendarDays className="h-4 w-4" />,
          linkTo: "/planner",
          linkLabel: language.match({
            english: () => "Planner",
            german: () => "Planer",
          }),
          items: latestDeadlines.map((deadline) => ({
            title: deadline.title,
            meta: `${deadline.vorlesung || language.match({ english: () => "Planner", german: () => "Planer" })} - ${new Date(deadline.date).toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}`,
            extra: deadline.note || "",
            itemLink: `/planner?deadline=${deadline._id}`,
            badgeClass: deadline.done
              ? "bg-success/15 text-success"
              : "bg-primary/10 text-primary",
            badgeText: deadline.done
              ? language.match({ english: () => "Done", german: () => "Erledigt" })
              : language.match({ english: () => "Open", german: () => "Offen" }),
          })),
          emptyText: language.match({
            english: () => "No deadlines.",
            german: () => "Keine Termine.",
          }),
        },
        {
          title: language.match({
            english: () => "All Forum Posts",
            german: () => "Alle Forenbeitraege",
          }),
          icon: <MessageSquare className="h-4 w-4" />,
          linkTo: "/forum",
          linkLabel: language.match({
            english: () => "Forum",
            german: () => "Forum",
          }),
          items: latestPosts.map((post) => ({
            title: post.title,
            meta: post.tag || "Forum",
            extra: post.content,
            itemLink: `/forum/${post.forumId}/post/${post._id}`,
          })),
          emptyText: language.match({
            english: () => "No posts.",
            german: () => "Keine Beitraege.",
          }),
        },
        {
          title: language.match({
            english: () => "All Scripts",
            german: () => "Alle Skripte",
          }),
          icon: <BookOpen className="h-4 w-4" />,
          linkTo: "/skripte",
          linkLabel: language.match({
            english: () => "Library",
            german: () => "Bibliothek",
          }),
          items: latestScripts.map((script) => ({
            title: script.title,
            meta: `${script.subject} - ${script.authorName}`,
            extra: script.description || "",
            itemLink: `/skripte?script=${script._id}`,
          })),
          emptyText: language.match({
            english: () => "No scripts.",
            german: () => "Keine Skripte.",
          }),
        },
      ];

  const activeSubject = selectedSubject
    ?? language.match({ english: () => "All Lectures", german: () => "Alle Vorlesungen" });
  const activeSubjectDescription = selectedSubject
    ? language.match({
        english: () => `Content for ${selectedSubject}`,
        german: () => `Inhalte fuer ${selectedSubject}`,
      })
    : language.match({
        english: () => "Overview of all lectures",
        german: () => "Gesamtansicht aller Vorlesungen",
      });

  const nextDeadlineValue = nextDeadline
    ? new Date(nextDeadline.date).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
      })
    : language.match({ english: () => "No deadline", german: () => "Kein Termin" });
  const nextDeadlineHint = nextDeadline
    ? nextDeadline.title
    : language.match({ english: () => "Nothing planned", german: () => "Nichts geplant" });
  const openDeadlinesValue = openDeadlines.length;
  const openDeadlinesHint =
    openDeadlines.length === 0
      ? language.match({ english: () => "All done", german: () => "Alles erledigt" })
      : urgentDeadlinesCount > 0
        ? language.match({
            english: () => `${urgentDeadlinesCount} urgent`,
            german: () => `${urgentDeadlinesCount} dringend`,
          })
        : language.match({ english: () => "On track", german: () => "Gut im Plan" });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="w-full px-4 pb-24 pt-32 sm:px-6 md:pt-24 lg:px-8">
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="grid gap-5 lg:grid-cols-5 lg:items-start"
          >
            <div className="relative self-start overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-accent px-8 pb-12 pt-7 text-primary-foreground lg:col-span-3">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -left-10 -bottom-14 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
              <p className="relative text-xs uppercase tracking-[0.3em] opacity-80">
                {now.toLocaleDateString("de-DE", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <h1 className="relative mt-4 font-heading text-3xl font-bold leading-tight sm:text-4xl">
                {greeting()}
                {name ? `, ${name.split(" ")[0]}` : ""}
              </h1>
              <p className="relative mt-5 max-w-2xl text-base opacity-90">
                {quote}
              </p>
              <div className="relative mt-7 flex flex-wrap gap-2">
                <Link to="/planner">
                  <Button size="lg" variant="secondary" className="gap-2">
                    <Plus className="h-4 w-4" />{" "}
                    {language.match({ english: () => "New Task", german: () => "Neue Aufgabe" })}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div>
                <HeroStat
                label={language.match({ english: () => "Next Deadline", german: () => "Nächster Termin" })}
                value={nextDeadlineValue}
                icon={<CalendarDays className="h-4 w-4 text-[#E35D6A]" />}
                hint={nextDeadlineHint}
                valueClassName="text-[#E35D6A] text-[18px]"
                labelClassName="text-[14px] font-semibold text-foreground"
                to="/planner"
              />
                <HeroStat
                label={language.match({ english: () => "Open Deadlines", german: () => "Offene Termine" })}
                value={openDeadlinesValue}
                icon={<Clock3 className="h-4 w-4" />}
                hint={openDeadlinesHint}
                tone="violet"
                valueClassName="text-[18px]"
                labelClassName="text-[14px] font-semibold text-foreground"
                to="/planner"
              />
                <HeroStat
                label={language.match({ english: () => "Recent Posts", german: () => "Letzte Beitraege" })}
                value={latestPostsCount}
                icon={<MessageSquare className="h-4 w-4" />}
                hint={latestPostsHint}
                tone="blue"
                valueClassName="text-[18px]"
                labelClassName="text-[14px] font-semibold text-foreground"
                to="/forum"
              />
                <HeroStat
                label={language.match({ english: () => "Recent Scripts", german: () => "Letzte Skripte" })}
                value={latestScriptsCount}
                icon={<Files className="h-4 w-4" />}
                hint={latestScriptsHint}
                tone="hot"
                valueClassName="text-[18px]"
                labelClassName="text-[14px] font-semibold text-foreground"
                to="/skripte"
              />
              </div>
            </div>
          </motion.section>

          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {subjectsList.length === 0 ? (
                <div className="rounded-3xl border border-border/60 bg-card p-8 text-sm text-muted-foreground sm:col-span-2 xl:col-span-4">
                  {language.match({
                    english: () => "No content for the selected filter.",
                    german: () => "Keine Inhalte fuer die gewaehlte Filtereinstellung.",
                  })}
                </div>
              ) : (
                subjectsList.map((subject) => {
                  const subjectPosts = posts.filter(
                    (post) => post.vorlesung === subject,
                  );
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
                          {total}{" "}
                          {language.match({ english: () => "current", german: () => "aktuell" })}
                        </span>
                      </div>
                      <h3 className="text-center font-heading text-xl font-medium leading-tight text-muted-foreground">
                        {subject}
                      </h3>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-muted-foreground">
                        <div className="rounded-2xl bg-background/80 py-2">
                          <p className="font-semibold text-foreground">
                            {subjectDeadlines.length}
                          </p>
                          <p>{language.match({ english: () => "Deadlines", german: () => "Termine" })}</p>
                        </div>
                        <div className="rounded-2xl bg-background/80 py-2">
                          <p className="font-semibold text-foreground">
                            {subjectPosts.length}
                          </p>
                          <p>{language.match({ english: () => "Forum", german: () => "Forum" })}</p>
                        </div>
                        <div className="rounded-2xl bg-background/80 py-2">
                          <p className="font-semibold text-foreground">
                            {subjectScripts.length}
                          </p>
                          <p>{language.match({ english: () => "Scripts", german: () => "Skripte" })}</p>
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
                  {language.match({ english: () => "Overall View", german: () => "Gesamtuebersicht" })}
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
    </div>
  );
};

function HeroStat({
  label,
  value,
  hint,
  icon,
  tone,
  valueClassName,
  labelClassName,
  to,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ReactNode;
  tone?: "warn" | "ok" | "hot" | "violet" | "blue";
  valueClassName?: string;
  labelClassName?: string;
  to?: string;
}) {
  const toneClasses =
    tone === "warn"
      ? "text-[#E35D6A]"
      : tone === "ok"
        ? "text-success"
        : tone === "violet"
          ? "text-[#9B6BFF]"
          : tone === "blue"
            ? "text-[#6D8CFF]"
        : tone === "hot"
          ? "text-accent"
          : "text-primary";

  const content = (
    <div className="px-0 py-0.5">
      <div className="flex items-center justify-between gap-5 px-3 py-2.5 transition-colors hover:bg-muted/10">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`mt-0.5 shrink-0 ${toneClasses}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className={`${labelClassName ?? "text-[14px] font-semibold text-foreground"}`}>
              {label}
            </p>
            {hint ? (
              <p className="mt-px text-[12px] text-muted-foreground">
                {hint}
              </p>
            ) : null}
          </div>
        </div>
        <p
          className={`shrink-0 text-right font-bold leading-none text-foreground ${valueClassName ?? "text-[18px]"}`}
        >
          {value}
        </p>
      </div>
      <div className="mx-3 mt-0.5 h-px bg-zinc-600/20 dark:bg-zinc-700/25" />
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="-mx-3 block h-full rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        {content}
      </Link>
    );
  }

  return content;
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
    itemLink?: string;
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
          {items.map((item, index) => {
            const content = (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  {item.meta ? (
                    <p className="text-xs text-muted-foreground">{item.meta}</p>
                  ) : null}
                  {item.extra ? (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {item.extra}
                    </p>
                  ) : null}
                </div>
                {item.badgeClass && item.badgeText ? (
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[11px] ${item.badgeClass}`}
                  >
                    {item.badgeText}
                  </span>
                ) : null}
                {item.done !== undefined && item.onToggle ? (
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
                ) : null}
              </div>
            );

            return (
              <li
                key={`${item.title}-${index}`}
                className="rounded-xl border border-border/60 bg-card p-3"
              >
                {item.itemLink ? (
                  <Link
                    to={item.itemLink}
                    className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  >
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default DashboardPage;
