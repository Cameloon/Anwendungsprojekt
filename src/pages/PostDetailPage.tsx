import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Send,
  FileText,
  ExternalLink,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import {
  addComment,
  loadPosts,
  subscribe,
  updatePost,
  type ForumComment,
  type SharedPost,
} from "@/lib/forumStore";
import { loadForums, subscribeForums, type Forum } from "@/lib/forumsStore";
import { publicScripts, subscribeScripts, type Script } from "@/lib/scriptsStore";

const tagStyles = {
  frage: "bg-info/15 text-info border-info/20",
  lerngruppe: "bg-primary/15 text-primary border-primary/20",
  material: "bg-success/15 text-success border-success/20",
  diskussion: "bg-accent/15 text-accent border-accent/20",
};
const tagLabels = {
  frage: "Frage",
  lerngruppe: "Lerngruppe",
  material: "Material",
  diskussion: "Diskussion",
};

const avatarColors = [
  "bg-primary/15 text-primary",
  "bg-info/15 text-info",
  "bg-success/15 text-success",
  "bg-accent/15 text-accent",
  "bg-destructive/15 text-destructive",
];

const PostDetailPage = () => {
  const { forumId, postId } = useParams<{ forumId: string; postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const profile = useProfile();
  const me = profile?.display_name || "Du";

  const [posts, setPosts] = useState<SharedPost[]>(() => loadPosts());
  const [forums, setForums] = useState<Forum[]>(() => loadForums());
  const [scripts, setScripts] = useState<Script[]>(() => publicScripts());
  const [comment, setComment] = useState("");

  useEffect(() => subscribe(() => setPosts(loadPosts())), []);
  useEffect(() => subscribeForums(() => setForums(loadForums())), []);
  useEffect(() => subscribeScripts(() => setScripts(publicScripts())), []);

  const post = useMemo(() => posts.find((p) => p.id === postId), [posts, postId]);
  const forum = useMemo(() => forums.find((f) => f.id === forumId), [forums, forumId]);

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 md:pt-24 pb-16 px-6 container mx-auto max-w-3xl text-center">
          <p className="text-muted-foreground mb-4">Beitrag nicht gefunden.</p>
          <Button onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Zurück
          </Button>
        </div>
      </div>
    );
  }

  const comments = post.comments ?? [];
  const linkedScripts = (post.linkedScriptIds ?? [])
    .map((id) => scripts.find((s) => s.id === id))
    .filter(Boolean) as Script[];

  const toggleLike = () => {
    updatePost(post.id, {
      liked: !post.liked,
      likes: post.liked ? Math.max(0, post.likes - 1) : post.likes + 1,
    });
  };

  const submitComment = () => {
    const text = comment.trim();
    if (!text) return;
    const c: ForumComment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      author: me,
      content: text,
      date: "gerade eben",
      createdAt: Date.now(),
    };
    addComment(post.id, c);
    setComment("");
    toast.success("Kommentar gepostet");
  };

  const backTo = forum ? `/forum/${forum.id}` : "/forum";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 md:pt-24 pb-16 px-6">
        <div className="container mx-auto max-w-3xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(backTo)}
            className="gap-1.5 mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />{" "}
            {forum ? `Zurück zu ${forum.name}` : "Zurück"}
          </Button>

          <motion.article
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`h-10 w-10 rounded-full ${
                  avatarColors[post.author.charCodeAt(0) % avatarColors.length]
                } flex items-center justify-center font-bold`}
              >
                {post.author[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{post.author}</p>
                <p className="text-xs text-muted-foreground">{post.date}</p>
              </div>
              <Badge variant="outline" className={`${tagStyles[post.tag]} text-[10px] py-0 h-5`}>
                {tagLabels[post.tag]}
              </Badge>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight mb-2">
              {post.title}
            </h1>
            <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{post.content}</p>

            {post.sketch && (
              <img
                src={post.sketch}
                alt="Whiteboard-Skizze"
                className="mt-4 max-h-96 rounded-lg border border-border bg-white"
              />
            )}

            {linkedScripts.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Verlinkte Skripte
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {linkedScripts.map((s) => (
                    <Link
                      key={s.id}
                      to="/skripte"
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-success/10 text-success hover:bg-success/20"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {s.title}
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-5 pt-4 border-t">
              <button
                onClick={toggleLike}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  post.liked
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <ThumbsUp className={`h-3.5 w-3.5 ${post.liked ? "fill-primary" : ""}`} />
                {post.likes}
              </button>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                {comments.length} {comments.length === 1 ? "Kommentar" : "Kommentare"}
              </span>
            </div>
          </motion.article>

          {/* Composer */}
          <div className="glass-card p-4 mb-6">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Antwort schreiben</p>
            <Textarea
              placeholder="Schreibe einen Kommentar…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none mb-2"
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") submitComment();
              }}
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-muted-foreground">Tipp: ⌘/Ctrl + Enter zum Senden</p>
              <Button size="sm" onClick={submitComment} disabled={!comment.trim()} className="gap-1.5">
                <Send className="h-4 w-4" /> Posten
              </Button>
            </div>
          </div>

          {/* Comments list */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Noch keine Kommentare. Sei der/die Erste!</p>
              </div>
            ) : (
              comments
                .slice()
                .sort((a, b) => a.createdAt - b.createdAt)
                .map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="glass-card p-4 flex gap-3"
                  >
                    <div
                      className={`h-8 w-8 rounded-full ${
                        avatarColors[c.author.charCodeAt(0) % avatarColors.length]
                      } flex items-center justify-center text-xs font-bold shrink-0`}
                    >
                      {c.author[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold">{c.author}</span>
                        <span className="text-[10px] text-muted-foreground">{c.date}</span>
                      </div>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap">{c.content}</p>
                    </div>
                  </motion.div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
