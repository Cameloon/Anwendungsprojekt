import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Globe, Hash, MessageSquare, ThumbsUp, MessageCircle, ArrowRight } from "lucide-react";
import { loadPosts, subscribe, type SharedPost } from "@/lib/forumStore";
import { accessibleForums, subscribeForums, type Forum } from "@/lib/forumsStore";
import { Button } from "@/components/ui/button";

const HIDDEN_KEY = "dashboard_hidden_forums_v1";
const POSTS_PER_FORUM = 5;
const CURRENT_USER = "Du";

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
  const [posts, setPosts] = useState<SharedPost[]>(() => loadPosts());
  const [accessible, setAccessible] = useState<Forum[]>(() => accessibleForums(CURRENT_USER));
  const [hidden, setHidden] = useState<string[]>(() => loadHidden());

  useEffect(() => subscribe(() => setPosts(loadPosts())), []);
  useEffect(() => subscribeForums(() => setAccessible(accessibleForums(CURRENT_USER))), []);

  const forums = useMemo(() => {
    return accessible.map((f) => ({
      id: f.id,
      name: f.name,
      icon: f.isDefault ? Globe : Hash,
      posts: (f.isDefault
        ? posts.filter((p) => !p.groupId && p.visibility !== "private")
        : posts.filter((p) => p.groupId === f.id)
      ).slice(0, POSTS_PER_FORUM),
    }));
  }, [posts, accessible]);

  const toggleHidden = (id: string) => {
    const next = hidden.includes(id) ? hidden.filter((x) => x !== id) : [...hidden, id];
    setHidden(next);
    saveHidden(next);
  };

  const visible = forums.filter((f) => !hidden.includes(f.id));
  const hiddenForums = forums.filter((f) => hidden.includes(f.id));

  return (
    <section className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold text-lg">Aktuelle Forum-Beiträge</h2>
        </div>
        <Link to="/forum" className="text-sm text-primary hover:underline flex items-center gap-1">
          Zum Forum <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          Alle Foren sind ausgeblendet. Aktiviere unten ein Forum, um Beiträge zu sehen.
        </p>
      ) : (
        <div className="space-y-6">
          {visible.map((forum) => {
            const Icon = forum.icon;
            return (
              <div key={forum.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {forum.name}
                  </div>
                  <button
                    onClick={() => toggleHidden(forum.id)}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    title="Forum im Dashboard ausblenden"
                  >
                    <EyeOff className="h-3.5 w-3.5" /> Ausblenden
                  </button>
                </div>
                {forum.posts.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">Noch keine Beiträge.</p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {forum.posts.map((p) => (
                      <li key={p.id} className="py-2.5">
                        <Link to="/forum" className="block group">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {p.title}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span>{p.author}</span>
                            <span>•</span>
                            <span>{p.date}</span>
                            <span className="inline-flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" /> {p.likes}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" /> {p.replies}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {hiddenForums.length > 0 && (
        <div className="mt-5 pt-4 border-t border-border/60">
          <p className="text-xs text-muted-foreground mb-2">Ausgeblendet</p>
          <div className="flex flex-wrap gap-2">
            {hiddenForums.map((f) => (
              <Button
                key={f.id}
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-xs"
                onClick={() => toggleHidden(f.id)}
              >
                <Eye className="h-3 w-3" /> {f.name} einblenden
              </Button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default ForumFeed;
