import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Hash, MessageSquare, ThumbsUp, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const HIDDEN_KEY = "dashboard_hidden_forums_v1";
const POSTS_PER_FORUM = 5;

const loadHidden = (): string[] => {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};
const saveHidden = (h: string[]) => localStorage.setItem(HIDDEN_KEY, JSON.stringify(h));

const ForumFeed = () => {
  const { language } = useLanguage();
  const forumsQuery = useQuery(api.forums.getAllAccessible);
  const recentPostsQuery = useQuery(api.posts.listRecent);

  const [hidden, setHidden] = useState<string[]>(() => loadHidden());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawForums: any[] = (forumsQuery ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawPosts: any[] = (recentPostsQuery ?? []) as any[];

  const forums = rawForums.map((f: any) => ({
    id: f._id,
    name: f.name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    posts: rawPosts.filter((p: any) => p.forumId === f._id).slice(0, POSTS_PER_FORUM).map((p: any) => ({
      id: p._id,
      title: p.title,
      authorName: p.authorName,
      date: p._creationTime,
      likeCount: p.likeCount ?? 0,
      commentCount: (p.comments ?? []).length,
    })),
  }));

  const toggleHidden = (id: string) => {
    const next = hidden.includes(id) ? hidden.filter((x) => x !== id) : [...hidden, id];
    setHidden(next);
    saveHidden(next);
  };

  const visible = forums.filter((f) => !hidden.includes(f.id));
  const hiddenForums = forums.filter((f) => hidden.includes(f.id));

  const formatDate = (ts: number) => {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return language.match({ english: () => "Just now", german: () => "gerade eben" });
    if (m < 60) return language.match({ english: () => `${m} min ago`, german: () => `vor ${m} Min` });
    const h = Math.floor(m / 60);
    if (h < 24) return language.match({ english: () => `${h} hr ago`, german: () => `vor ${h} Std` });
    return new Date(ts).toLocaleDateString("de-DE");
  };

  return (
    <section className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold text-lg">{language.match({ english: () => "Recent Forum Posts", german: () => "Aktuelle Forum-Beiträge" })}</h2>
        </div>
        <Link to="/forum" className="text-sm text-primary hover:underline flex items-center gap-1">
          {language.match({ english: () => "Go to Forum", german: () => "Zum Forum" })} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          {language.match({ english: () => "All forums are hidden. Enable a forum below to see posts.", german: () => "Alle Foren sind ausgeblendet. Aktiviere unten ein Forum, um Beiträge zu sehen." })}
        </p>
      ) : (
        <div className="space-y-6">
          {visible.map((forum) => (
            <div key={forum.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  {forum.name}
                </div>
                <button
                  onClick={() => toggleHidden(forum.id)}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  title={language.match({ english: () => "Hide forum from dashboard", german: () => "Forum im Dashboard ausblenden" })}
                >
                  <EyeOff className="h-3.5 w-3.5" /> {language.match({ english: () => "Hide", german: () => "Ausblenden" })}
                </button>
              </div>
              {forum.posts.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">{language.match({ english: () => "No posts yet.", german: () => "Noch keine Beiträge." })}</p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {forum.posts.map((p) => (
                    <li key={p.id} className="py-2.5">
                      <Link to={`/forum/${forum.id}/post/${p.id}`} className="block group">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {p.title}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>{p.authorName}</span>
                          <span>•</span>
                          <span>{typeof p.date === 'number' ? formatDate(p.date) : p.date}</span>
                          <span className="inline-flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" /> {p.likeCount}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" /> {p.commentCount}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {hiddenForums.length > 0 && (
        <div className="mt-5 pt-4 border-t border-border/60">
          <p className="text-xs text-muted-foreground mb-2">{language.match({ english: () => "Hidden", german: () => "Ausgeblendet" })}</p>
          <div className="flex flex-wrap gap-2">
            {hiddenForums.map((f) => (
              <Button
                key={f.id}
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-xs"
                onClick={() => toggleHidden(f.id)}
              >
                <Eye className="h-3 w-3" /> {f.name} {language.match({ english: () => "show", german: () => "einblenden" })}
              </Button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default ForumFeed;
