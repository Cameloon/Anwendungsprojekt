import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Send,
  FileText,
  ExternalLink,
  Flag,
  Reply,
  X,
  Trash2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { ReportDialog } from "@/components/ReportDialog";

const tagStyles: Record<string, string> = {
  frage: "bg-info/15 text-info border-info/20",
  lerngruppe: "bg-primary/15 text-primary border-primary/20",
  material: "bg-success/15 text-success border-success/20",
  diskussion: "bg-accent/15 text-accent border-accent/20",
};
const tagLabels: Record<string, string> = {
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

function formatDate(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "gerade eben";
  if (m < 60) return `vor ${m} Min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std`;
  return new Date(ts).toLocaleDateString("de-DE");
}

interface PostComment {
  _id: string;
  _creationTime: number;
  authorId: string;
  authorName: string;
  content: string;
  parentId?: string;
  liked: boolean;
  likeCount: number;
}

interface EnrichedPost {
  _id: string;
  _creationTime: number;
  forumId: string;
  authorName: string;
  title: string;
  content: string;
  tag: string;
  liked: boolean;
  likeCount: number;
  comments: PostComment[];
  sketch?: string;
  linkedScriptIds?: string[];
}

interface ForumInfo {
  _id: string;
  name: string;
}

interface ScriptInfo {
  _id: string;
  title: string;
}

function PostDetailPage() {
  const { forumId, postId } = useParams<{ forumId: string; postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const profile = useProfile();
  const me = user?.id || "";
  const displayName = profile?.display_name || "Unbekannt";
  const isAdmin = profile?.role === "admin";

  const post = useQuery(
    api.posts.getById,
    postId ? { postId: postId as Id<"posts"> } : "skip"
  ) as EnrichedPost | null | undefined;
  const forum = useQuery(
    api.forums.getById,
    forumId ? { forumId: forumId as Id<"forums"> } : "skip"
  ) as ForumInfo | null | undefined;
  const allScripts = useQuery(api.scripts.listPublic) as ScriptInfo[] | undefined;

  const toggleLikeMutation = useMutation(api.posts.toggleLike);
  const toggleCommentLikeMutation = useMutation(api.posts.toggleCommentLike);
  const addCommentMutation = useMutation(api.posts.addComment);
  const deleteCommentMutation = useMutation(api.posts.deleteComment);

  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  if (post === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 md:pt-24 pb-16 px-6 container mx-auto max-w-3xl text-center">
          <div className="h-6 w-6 animate-spin mx-auto text-muted-foreground border-2 border-current border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

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
  const linkedScripts = (allScripts ?? []).filter((s) =>
    (post.linkedScriptIds ?? []).some((id) => id === s._id)
  );

  const handleToggleLike = () => {
    if (!me) return;
    toggleLikeMutation({ postId: post._id });
  };

  const handleToggleCommentLike = async (commentId: string) => {
    if (!me) return;
    try {
      await toggleCommentLikeMutation({ commentId: commentId as Id<"postComments"> });
    } catch (e) {
      toast.error("Fehler beim Liken des Kommentars");
    }
  };

  const submitComment = async () => {
    const text = comment.trim();
    if (!text) return;
    try {
      await addCommentMutation({
        postId: post._id,
        content: text,
        parentId: replyTo ? (replyTo.id as Id<"postComments">) : undefined,
      });
      setComment("");
      setReplyTo(null);
      toast.success("Kommentar gepostet");
    } catch {
      toast.error("Fehler beim Posten");
    }
  };

  const startReply = (c: PostComment) => {
    setReplyTo({ id: c._id, name: c.authorName });
    setComment(`@${c.authorName} `);
  };

  const cancelReply = () => {
    setReplyTo(null);
    setComment("");
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Kommentar wirklich löschen?")) return;
    try {
      await deleteCommentMutation({ commentId: commentId as Id<"postComments"> });
      toast.success("Kommentar gelöscht");
    } catch {
      toast.error("Fehler beim Löschen");
    }
  };

  const backTo = forum ? `/forum/${forum._id}` : "/forum";

  return (
    <PostDetailLayout
      post={post}
      forumName={forum?.name ?? null}
      backTo={backTo}
      navigate={navigate}
      comments={comments}
      comment={comment}
      setComment={setComment}
      submitComment={submitComment}
      handleToggleLike={handleToggleLike}
      handleToggleCommentLike={handleToggleCommentLike}
      replyTo={replyTo}
      startReply={startReply}
      cancelReply={cancelReply}
      reportOpen={reportOpen}
      setReportOpen={setReportOpen}
      me={me}
      reportedBy={displayName}
      linkedScripts={linkedScripts}
      isAdmin={isAdmin}
      handleDeleteComment={handleDeleteComment}
    />
  );
}

// ── Shared layout ──

function PostDetailLayout({
  post,
  forumName,
  backTo,
  navigate,
  comments,
  comment,
  setComment,
  submitComment,
  handleToggleLike,
  handleToggleCommentLike,
  replyTo,
  startReply,
  cancelReply,
  reportOpen,
  setReportOpen,
  me,
  reportedBy,
  linkedScripts,
  isAdmin,
  handleDeleteComment,
}: {
  post: EnrichedPost;
  forumName: string | null;
  backTo: string;
  navigate: ReturnType<typeof useNavigate>;
  comments: PostComment[];
  comment: string;
  setComment: (v: string) => void;
  submitComment: () => void;
  handleToggleLike: () => void;
  handleToggleCommentLike: (commentId: string) => void;
  replyTo: { id: string; name: string } | null;
  startReply: (c: PostComment) => void;
  cancelReply: () => void;
  reportOpen: boolean;
  setReportOpen: (open: boolean) => void;
  me: string;
  reportedBy: string;
  linkedScripts: ScriptInfo[];
  isAdmin: boolean;
  handleDeleteComment: (commentId: string) => void;
}) {
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
            <ArrowLeft className="h-4 w-4" />
            {forumName ? `Zurück zu ${forumName}` : "Zurück"}
          </Button>

          <motion.article
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`h-10 w-10 rounded-full ${
                  avatarColors[post.authorName.charCodeAt(0) % avatarColors.length]
                } flex items-center justify-center font-bold`}
              >
                {post.authorName[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{post.authorName}</p>
                <p className="text-xs text-muted-foreground">{formatDate(post._creationTime)}</p>
              </div>
              <Badge variant="outline" className={`${tagStyles[post.tag] || ""} text-[10px] py-0 h-5`}>
                {tagLabels[post.tag as keyof typeof tagLabels] || post.tag}
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
                      key={s._id}
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
                onClick={handleToggleLike}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  post.liked
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <ThumbsUp className={`h-3.5 w-3.5 ${post.liked ? "fill-primary" : ""}`} />
                {post.likeCount}
              </button>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                {comments.length} {comments.length === 1 ? "Kommentar" : "Kommentare"}
              </span>
              <button
                onClick={() => setReportOpen(true)}
                title="Beitrag melden"
                className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Flag className="h-3.5 w-3.5" />
                Melden
              </button>
            </div>
          </motion.article>

          <div className="glass-card p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-medium">
                {replyTo ? `Antwort an @${replyTo.name}` : "Kommentar schreiben"}
              </p>
              {replyTo && (
                <button onClick={cancelReply} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
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

          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Noch keine Kommentare. Sei der/die Erste!</p>
              </div>
            ) : (
              (() => {
                const sorted = [...comments].sort((a, b) => a._creationTime - b._creationTime);
                const childrenOf = new Map<string, PostComment[]>();
                const roots: PostComment[] = [];
                for (const c of sorted) {
                  if (!c.parentId) { roots.push(c); continue; }
                  const arr = childrenOf.get(c.parentId) ?? [];
                  arr.push(c);
                  childrenOf.set(c.parentId, arr);
                }
                const renderComment = (comment: PostComment, depth: number, idxs: number[]) => {
                  const isRoot = depth === 0;
                  const avatarSize = isRoot ? "h-8 w-8" : "h-7 w-7";
                  const avatarFont = isRoot ? "text-xs" : "text-[10px]";
                  const inner = (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idxs.reduce((a, b) => a + b, 0) * 0.02 }}
                      className={`flex gap-3 ${isRoot ? "glass-card p-4" : "py-3"}`}
                    >
                      <div
                        className={`${avatarSize} rounded-full shrink-0 ${
                          avatarColors[comment.authorName.charCodeAt(0) % avatarColors.length]
                        } flex items-center justify-center ${avatarFont} font-bold`}
                      >
                        {comment.authorName[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold">{comment.authorName}</span>
                          <span className="text-[10px] text-muted-foreground">{formatDate(comment._creationTime)}</span>
                        </div>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <button
                            onClick={() => handleToggleCommentLike(comment._id)}
                            className={`inline-flex items-center gap-1 rounded-md text-[10px] font-medium transition-colors ${
                              comment.liked
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <ThumbsUp className={`h-3 w-3 ${comment.liked ? "fill-primary" : ""}`} />
                            {comment.likeCount}
                          </button>
                          <button
                            onClick={() => startReply(comment)}
                            className="inline-flex items-center gap-1 rounded-md text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Reply className="h-3 w-3" /> Antworten
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteComment(comment._id)}
                              className="inline-flex items-center gap-1 rounded-md text-[10px] font-medium text-muted-foreground hover:text-destructive transition-colors"
                              title="Kommentar löschen (Admin)"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                  const children = childrenOf.get(comment._id) ?? [];
                  return (
                    <div
                      key={comment._id}
                      style={
                        isRoot
                          ? undefined
                          : { marginLeft: Math.min(depth * 20, 60), paddingLeft: Math.min(depth * 8 + 8, 24), borderLeft: "2px solid hsl(var(--border))" }
                      }
                    >
                      {inner}
                      {children.map((child, ci) => renderComment(child, depth + 1, [...idxs, ci]))}
                    </div>
                  );
                };
                return roots.map((root, i) => renderComment(root, 0, [i]));
              })()
            )}
          </div>
        </div>
      </div>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        postId={post._id}
        postTitle={post.title}
        forumName={forumName ?? "Forum"}
        reportedBy={reportedBy}
      />
    </div>
  );
}

export default PostDetailPage;
