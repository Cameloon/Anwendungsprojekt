import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Archive,
  ArrowLeft,
  MessageSquare,
  Plus,
  ThumbsUp,
  Users,
  Lock,
  Hash,
  FileText,
  Send,
  X,
  UserPlus,
  Copy,
  ExternalLink,
  Trash2,
  CalendarDays,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useProfile } from "@/hooks/useProfile";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

const tagStyles: Record<string, string> = {
  frage: "bg-info/15 text-info border-info/20",
  material: "bg-success/15 text-success border-success/20",
  diskussion: "bg-accent/15 text-accent border-accent/20",
};
interface PostItem {
  id: string;
  _creationTime: number;
  authorName: string;
  authorId: string;
  title: string;
  content: string;
  tag: string;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  linkedScriptIds?: string[];
  linkedDeadlineIds?: string[];
  updatedAt?: number;
}

interface MemberItem {
  userId: string;
  displayName: string;
}

interface ForumDetailData {
  id: string;
  name: string;
  description: string;
  visibility: "public" | "private";
  kurs?: string;
  vorlesung?: string;
  professor?: string;
  standort?: string;
  inviteCode: string;
  ownerId?: string;
  archivedByMe?: boolean;
  members: MemberItem[];
}

interface ScriptItem {
  _id: string;
  title: string;
  subject: string;
}

interface DeadlineItem {
  _id: string;
  title: string;
  date: string;
  category: string;
  done: boolean;
}

// ── Convex production path ──

const ForumDetailPage = () => {
  const { forumId } = useParams<{ forumId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const me = user?.id || "";

  const forumQuery = useQuery(
    api.forums.getById,
    forumId ? { forumId: forumId as Id<"forums"> } : "skip"
  );
  const membersQuery = useQuery(
    api.forums.getMembers,
    forumId ? { forumId: forumId as Id<"forums"> } : "skip"
  );
  const isMemberQuery = useQuery(
    api.forums.isMember,
    forumId ? { forumId: forumId as Id<"forums"> } : "skip"
  );
  const postsQuery = useQuery(
    api.posts.listByForum,
    forumId ? { forumId: forumId as Id<"forums"> } : "skip"
  );
  const allScripts = useQuery(api.scripts.listPublic);
  const allDeadlines = useQuery(api.deadlines.listForUser);
  const kursPeople = (useQuery(api.profiles.listSameKurs) ?? []) as { userId: string; displayName: string }[];

  const joinMutation = useMutation(api.forums.join);
  const leaveMutation = useMutation(api.forums.leave);
  const createPostMutation = useMutation(api.posts.create);
  const toggleLikeMutation = useMutation(api.posts.toggleLike);
  const inviteMutation = useMutation(api.notifications.inviteToForum);
  const archiveForumMutation = useMutation(api.forums.archive);
  const unarchiveForumMutation = useMutation(api.forums.unarchive);
  const deleteForumMutation = useMutation(api.forums.deleteForum);
  const deletePostMutation = useMutation(api.posts.deletePost);
  const deleteCommentMutation = useMutation(api.posts.deleteComment);
  const profile = useProfile();
  const isAdmin = profile?.role === "admin";

  const [showPostForm, setShowPostForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("diskussion");
  const [linkedScriptIds, setLinkedScriptIds] = useState<string[]>([]);
  const [scriptPickerOpen, setScriptPickerOpen] = useState(false);
  const [linkedDeadlineIds, setLinkedDeadlineIds] = useState<string[]>([]);
  const [deadlinePickerOpen, setDeadlinePickerOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");
  const [selectedInvitees, setSelectedInvitees] = useState<{ userId: string; displayName: string }[]>([]);

  const loading = forumQuery === undefined || membersQuery === undefined || isMemberQuery === undefined || postsQuery === undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 md:pt-24 pb-16 px-6 text-center">
          <div className="h-6 w-6 animate-spin mx-auto text-muted-foreground border-2 border-current border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!forumQuery) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 md:pt-24 pb-16 px-6 container mx-auto max-w-3xl text-center">
          <p className="text-muted-foreground mb-4">{language.match({ english: () => "Forum not found.", german: () => "Forum nicht gefunden." })}</p>
          <Button onClick={() => navigate("/forum")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> {language.match({ english: () => "Back", german: () => "Zurück" })}
          </Button>
        </div>
      </div>
    );
  }

  const isMember = !!isMemberQuery;
  const isOwner = !!forumQuery?.ownerId && forumQuery.ownerId === me;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawForum: any = forumQuery;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawMembers: any[] = membersQuery ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawPosts: any[] = postsQuery ?? [];

  const forum: ForumDetailData = {
    id: rawForum._id,
    name: rawForum.name,
    description: rawForum.description ?? "",
    visibility: rawForum.visibility,
    kurs: rawForum.kurs,
    vorlesung: rawForum.vorlesung,
    professor: rawForum.professor,
    standort: rawForum.standort,
    inviteCode: rawForum.inviteCode,
    ownerId: rawForum.ownerId,
    archivedByMe: rawForum.archivedByMe,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    members: rawMembers.map((m: any) => ({ userId: m.userId, displayName: m.displayName })),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts: PostItem[] = rawPosts.map((p: any) => ({
    id: p._id,
    _creationTime: p._creationTime,
    authorName: p.authorName,
    authorId: p.authorId,
    title: p.title,
    content: p.content,
    tag: p.tag,
    liked: p.liked ?? false,
    likeCount: p.likeCount ?? 0,
    commentCount: (p.comments ?? []).length,
    linkedScriptIds: p.linkedScriptIds,
    linkedDeadlineIds: p.linkedDeadlineIds,
    updatedAt: p.updatedAt,
  }));

  const scripts: ScriptItem[] = (allScripts ?? []).map((s: any) => ({
    _id: s._id,
    title: s.title,
    subject: s.subject,
  }));

  const deadlines: DeadlineItem[] = (allDeadlines ?? []).map((d: any) => ({
    _id: d._id,
    title: d.title,
    date: d.date,
    category: d.category,
    done: d.done,
  }));

  const titleError = title.trim().length > 0 && title.trim().length < 5 ? language.match({ english: () => "At least 5 characters.", german: () => "Mindestens 5 Zeichen." }) : "";
  const contentError = content.trim().length > 0 && content.trim().length < 10 ? language.match({ english: () => "At least 10 characters.", german: () => "Mindestens 10 Zeichen." }) : "";
  const inviteError = selectedInvitees.length === 0 ? language.match({ english: () => "Select at least one person.", german: () => "Mindestens eine Person angeben." }) : "";

  const handlePost = async () => {
    const nextTitleError = title.trim().length < 5 ? language.match({ english: () => "At least 5 characters.", german: () => "Mindestens 5 Zeichen." }) : "";
    const nextContentError = content.trim().length < 10 ? language.match({ english: () => "At least 10 characters.", german: () => "Mindestens 10 Zeichen." }) : "";
    if (nextTitleError || nextContentError) return;
    try {
      await createPostMutation({
        forumId: forum.id as Id<"forums">,
        title: title.trim(),
        content: content.trim(),
        tag: tag as "frage" | "material" | "diskussion",
        visibility: forum.visibility,
        linkedScriptIds: linkedScriptIds.length ? (linkedScriptIds as Id<"scripts">[]) : undefined,
        linkedDeadlineIds: linkedDeadlineIds.length ? (linkedDeadlineIds as Id<"deadlines">[]) : undefined,
      });
      setTitle("");
      setContent("");
      setLinkedScriptIds([]);
      setLinkedDeadlineIds([]);
      setShowPostForm(false);
      toast.success(language.match({ english: () => "Post published", german: () => "Beitrag veröffentlicht" }));
    } catch {
      toast.error(language.match({ english: () => "Error publishing", german: () => "Fehler beim Veröffentlichen" }));
    }
  };

  const handleToggleLike = (postId: string) => {
    if (!me) return;
    toggleLikeMutation({ postId: postId as Id<"posts"> });
  };

  const handleJoin = async () => {
    try {
      await joinMutation({ forumId: forum.id as Id<"forums"> });
      toast.success(language.match({ english: () => "Joined", german: () => "Beigetreten" }));
    } catch {
      toast.error(language.match({ english: () => "Error joining", german: () => "Fehler beim Beitreten" }));
    }
  };

  const handleLeave = async () => {
    try {
      await leaveMutation({ forumId: forum.id as Id<"forums"> });
      navigate("/forum");
    } catch {
      toast.error(language.match({ english: () => "Error leaving", german: () => "Fehler beim Verlassen" }));
    }
  };

  const handleInvite = async () => {
    if (selectedInvitees.length === 0) {
      toast.error(language.match({ english: () => "Select at least one person", german: () => "Mindestens eine Person angeben" }));
      return;
    }
    try {
      await inviteMutation({
        forumId: forum.id as Id<"forums">,
        forumName: forum.name,
        recipientIds: selectedInvitees.map((p) => p.userId),
        recipientNames: selectedInvitees.map((p) => p.displayName),
        fromName: me,
      });
      toast.success(language.match({ english: () => `${selectedInvitees.length} invitation(s) sent`, german: () => `${selectedInvitees.length} Einladung(en) gesendet` }));
      setSelectedInvitees([]);
      setInviteSearch("");
      setInviteOpen(false);
    } catch {
      toast.error(language.match({ english: () => "Error sending invitations", german: () => "Fehler beim Senden der Einladungen" }));
    }
  };

  const toggleLink = (id: string) =>
    setLinkedScriptIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleDeadlineLink = (id: string) =>
    setLinkedDeadlineIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <ForumDetailLayout
      forum={forum}
      posts={posts}
      me={me}
      isMember={isMember}
      isOwner={isOwner}
      navigate={navigate}
      showPostForm={showPostForm}
      setShowPostForm={setShowPostForm}
      title={title}
      setTitle={setTitle}
      content={content}
      setContent={setContent}
      tag={tag}
      setTag={setTag}
      linkedScriptIds={linkedScriptIds}
      toggleLink={toggleLink}
      scriptPickerOpen={scriptPickerOpen}
      setScriptPickerOpen={setScriptPickerOpen}
      scripts={scripts}
      linkedDeadlineIds={linkedDeadlineIds}
      toggleDeadlineLink={toggleDeadlineLink}
      deadlinePickerOpen={deadlinePickerOpen}
      setDeadlinePickerOpen={setDeadlinePickerOpen}
      deadlines={deadlines}
      handlePost={handlePost}
      handleToggleLike={handleToggleLike}
      handleJoin={handleJoin}
      handleLeave={handleLeave}
      titleError={titleError}
      contentError={contentError}
      inviteOpen={inviteOpen}
      setInviteOpen={setInviteOpen}
      inviteSearch={inviteSearch}
      setInviteSearch={setInviteSearch}
      selectedInvitees={selectedInvitees}
      setSelectedInvitees={setSelectedInvitees}
      kursPeople={kursPeople}
      inviteError={inviteError}
      handleInvite={handleInvite}
      isAdmin={isAdmin}
      deleteForumMutation={deleteForumMutation}
      deletePostMutation={deletePostMutation}
      deleteCommentMutation={deleteCommentMutation}
    />
  );
}



// ── Shared layout ──

function ForumDetailLayout({
  forum,
  posts,
  me,
  isMember,
  isOwner,
  navigate,
  showPostForm,
  setShowPostForm,
  title,
  setTitle,
  content,
  setContent,
  tag,
  setTag,
  linkedScriptIds,
  toggleLink,
  scriptPickerOpen,
  setScriptPickerOpen,
  scripts,
  linkedDeadlineIds,
  toggleDeadlineLink,
  deadlinePickerOpen,
  setDeadlinePickerOpen,
  deadlines,
  handlePost,
  handleToggleLike,
  handleJoin,
  handleLeave,
  titleError,
  contentError,
  inviteOpen,
  setInviteOpen,
  inviteSearch,
  setInviteSearch,
  selectedInvitees,
  setSelectedInvitees,
  kursPeople,
  inviteError,
  handleInvite,
  isAdmin,
  deleteForumMutation,
  deletePostMutation,
  deleteCommentMutation,
}: {
  forum: ForumDetailData;
  posts: PostItem[];
  me: string;
  isMember: boolean;
  isOwner: boolean;
  navigate: ReturnType<typeof useNavigate>;
  showPostForm: boolean;
  setShowPostForm: (v: boolean) => void;
  title: string;
  setTitle: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  tag: string;
  setTag: (v: any) => void;
  linkedScriptIds: string[];
  toggleLink: (id: string) => void;
  scriptPickerOpen: boolean;
  setScriptPickerOpen: (v: boolean) => void;
  scripts: ScriptItem[];
  linkedDeadlineIds: string[];
  toggleDeadlineLink: (id: string) => void;
  deadlinePickerOpen: boolean;
  setDeadlinePickerOpen: (v: boolean) => void;
  deadlines: DeadlineItem[];
  handlePost: () => void;
  handleToggleLike: (id: string) => void;
  handleJoin: () => void;
  handleLeave: () => void;
  titleError: string;
  contentError: string;
  inviteOpen: boolean;
  setInviteOpen: (v: boolean) => void;
  inviteSearch: string;
  setInviteSearch: (v: string) => void;
  selectedInvitees: { userId: string; displayName: string }[];
  setSelectedInvitees: (v: { userId: string; displayName: string }[]) => void;
  kursPeople: { userId: string; displayName: string }[];
  inviteError: string;
  handleInvite: () => void;
  isAdmin: boolean;
  deleteForumMutation: (args: any) => any;
  deletePostMutation: (args: any) => any;
  deleteCommentMutation: (args: any) => any;
}) {
  const { language } = useLanguage();
  const tTagLabels: Record<string, string> = {
    frage: language.match({ english: () => "Question", german: () => "Frage" }),
    material: language.match({ english: () => "Material", german: () => "Material" }),
    diskussion: language.match({ english: () => "Discussion", german: () => "Diskussion" }),
  };
  const formatDate = (ts: number) => {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return language.match({ english: () => "just now", german: () => "gerade eben" });
    if (m < 60) return language.match({ english: () => `${m} min ago`, german: () => `vor ${m} Min` });
    const h = Math.floor(m / 60);
    if (h < 24) return language.match({ english: () => `${h} hr ago`, german: () => `vor ${h} Std` });
    return new Date(ts).toLocaleDateString("de-DE");
  };
  const Icon = forum.visibility === "public" ? Hash : Lock;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 md:pt-24 pb-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/forum")}
            className="gap-1.5 mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" /> {language.match({ english: () => "All Forums", german: () => "Alle Foren" })}
          </Button>

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-6"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {forum.visibility === "public" ? language.match({ english: () => "Public", german: () => "Öffentlich" }) : language.match({ english: () => "Private", german: () => "Privat" })}
                  </Badge>
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Users className="h-3 w-3" /> {forum.members.length} {language.match({ english: () => "Members", german: () => "Mitglieder" })}
                  </span>
                </div>
                <h1 className="font-heading text-3xl font-bold tracking-tight">{forum.name}</h1>
                {forum.description && (
                  <p className="text-muted-foreground mt-1.5">{forum.description}</p>
                )}
                {(forum.kurs || forum.vorlesung || forum.professor || forum.standort) && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {forum.standort && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{forum.standort}</span>
                    )}
                    {forum.kurs && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent">{forum.kurs}</span>
                    )}
                    {forum.vorlesung && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/80">{forum.vorlesung}</span>
                    )}
                    {forum.professor && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/80">{language.match({ english: () => "Prof. ", german: () => "Prof. " })}{forum.professor}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setInviteOpen(true)}>
                  <UserPlus className="h-4 w-4" /> {language.match({ english: () => "Invite", german: () => "Einladen" })}
                </Button>
                {!isOwner && isMember && (
                  <Button size="sm" variant="ghost" onClick={handleLeave}>
                    {language.match({ english: () => "Leave", german: () => "Verlassen" })}
                  </Button>
                )}
                {isMember && (
                  forum.archivedByMe ? (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={async () => { try { await unarchiveForumMutation({ forumId: forum.id as any }); toast.success(language.match({ english: () => "Forum restored", german: () => "Forum wiederhergestellt" })); } catch { toast.error(language.match({ english: () => "Error", german: () => "Fehler" })); } }}>
                      <Archive className="h-4 w-4" /> {language.match({ english: () => "Undo", german: () => "Rückgängig" })}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="gap-1.5 text-destructive" onClick={async () => { try { await archiveForumMutation({ forumId: forum.id as any }); toast.success(language.match({ english: () => "Forum archived", german: () => "Forum archiviert" })); } catch { toast.error(language.match({ english: () => "Error", german: () => "Fehler" })); } }}>
                      <Archive className="h-4 w-4" /> {language.match({ english: () => "Archive", german: () => "Archivieren" })}
                    </Button>
                  )
                )}
                {isAdmin && (
                  <Button size="sm" variant="outline" className="gap-1.5 text-destructive" onClick={async () => {
                    if (!window.confirm(language.match({ english: () => `Really delete forum "${forum.name}"?`, german: () => `Forum „${forum.name}" wirklich löschen?` }))) return;
                    try { await deleteForumMutation({ forumId: forum.id as any }); toast.success(language.match({ english: () => "Forum deleted", german: () => "Forum gelöscht" })); navigate("/forum"); } catch { toast.error(language.match({ english: () => "Error", german: () => "Fehler" })); }
                  }}>
                    <Trash2 className="h-4 w-4" /> {language.match({ english: () => "Delete", german: () => "Löschen" })}
                  </Button>
                )}
              </div>
            </div>
            {forum.visibility === "private" && (
              <div className="rounded-lg border bg-primary/5 p-2 mt-4 max-w-xs">
                <p className="text-[10px] text-muted-foreground mb-1">{language.match({ english: () => "Invite code", german: () => "Einladungscode" })}</p>
                <div className="flex items-center gap-1">
                  <code className="flex-1 font-mono text-sm tracking-widest text-center py-1 rounded bg-background border">
                    {forum.inviteCode}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => {
                      navigator.clipboard.writeText(forum.inviteCode);
                      toast.success(language.match({ english: () => "Code copied", german: () => "Code kopiert" }));
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>

          <div className="grid lg:grid-cols-[1fr_280px] gap-6">
            {/* Posts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-semibold">{language.match({ english: () => "Posts", german: () => "Beiträge" })} ({posts.length})</h2>
                {isMember ? (
                  <Button size="sm" className="gap-1.5" onClick={() => setShowPostForm((v) => !v)}>
                    <Plus className="h-4 w-4" /> {language.match({ english: () => "New Post", german: () => "Neuer Beitrag" })}
                  </Button>
                ) : forum.visibility === "public" ? (
                  <Button size="sm" className="gap-1.5" onClick={handleJoin}>
                    <Users className="h-4 w-4" /> {language.match({ english: () => "Join", german: () => "Beitreten" })}
                  </Button>
                ) : null}
              </div>

              {showPostForm && isMember && (
                <div className="glass-card p-4 space-y-3">
                  <Input placeholder={language.match({ english: () => "Title", german: () => "Titel" })} value={title} onChange={(e) => setTitle(e.target.value)} />
                  {titleError && <p className="text-xs text-destructive">{titleError}</p>}
                  <Textarea
                    placeholder={language.match({ english: () => "What would you like to share?", german: () => "Was möchtest du teilen?" })}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  {contentError && <p className="text-xs text-destructive">{contentError}</p>}
                  <div className="flex flex-wrap gap-2">
                    {(["frage", "material", "diskussion"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTag(t)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                          tag === t ? tagStyles[t] : "text-muted-foreground bg-secondary border-transparent"
                        }`}
                      >
                        {tTagLabels[t]}
                      </button>
                    ))}
                  </div>

                  {/* Linked scripts */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs text-muted-foreground">{language.match({ english: () => "Link scripts", german: () => "Skripte verlinken" })}</p>
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setScriptPickerOpen(true)}>
                        <FileText className="h-3.5 w-3.5" /> {language.match({ english: () => "Select", german: () => "Auswählen" })}
                      </Button>
                    </div>
                    {linkedScriptIds.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground">{language.match({ english: () => "No scripts linked", german: () => "Keine Skripte verlinkt" })}</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {linkedScriptIds.map((id) => {
                          const s = scripts.find((x) => x._id === id);
                          if (!s) return null;
                          return (
                            <span key={id} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-success/10 text-success">
                              <FileText className="h-3 w-3" />
                              {s.title}
                              <button onClick={() => toggleLink(id)} className="ml-0.5 hover:text-destructive">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Linked deadlines */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs text-muted-foreground">{language.match({ english: () => "Link deadlines", german: () => "Deadlines verlinken" })}</p>
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setDeadlinePickerOpen(true)}>
                        <CalendarDays className="h-3.5 w-3.5" /> {language.match({ english: () => "Select", german: () => "Auswählen" })}
                      </Button>
                    </div>
                    {linkedDeadlineIds.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground">{language.match({ english: () => "No deadlines linked", german: () => "Keine Deadlines verlinkt" })}</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {linkedDeadlineIds.map((id) => {
                          const d = deadlines.find((x) => x._id === id);
                          if (!d) return null;
                          return (
                            <span key={id} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                              <CalendarDays className="h-3 w-3" />
                              {d.title}
                              <button onClick={() => toggleDeadlineLink(id)} className="ml-0.5 hover:text-destructive">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowPostForm(false)}>
                      {language.match({ english: () => "Cancel", german: () => "Abbrechen" })}
                    </Button>
                    <Button size="sm" onClick={handlePost} className="gap-1.5">
                      <Send className="h-4 w-4" /> {language.match({ english: () => "Publish", german: () => "Veröffentlichen" })}
                    </Button>
                  </div>
                </div>
              )}

              {posts.length === 0 ? (
                <div className="glass-card p-10 text-center">
                  <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground text-sm">{language.match({ english: () => "No posts yet.", german: () => "Noch keine Beiträge." })}</p>
                </div>
              ) : (
                posts.map((p) => (
                  <article
                    key={p.id}
                    onClick={() => navigate(`/forum/${forum.id}/post/${p.id}`)}
                    className="glass-card p-4 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1.5 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{p.authorName}</span>
                      <span>·</span>
                      <span>
                        {formatDate(p._creationTime)}
                        {p.updatedAt && p.updatedAt > p._creationTime + 1000 && (
                          <> · <span className="italic">{language.match({ english: () => "edited", german: () => "bearbeitet" })}</span></>
                        )}
                      </span>
                      <Badge variant="outline" className={`${tagStyles[p.tag]} text-[10px] py-0 h-5 ml-auto`}>
                        {tTagLabels[p.tag]}
                      </Badge>
                    </div>
                    <h3 className="font-heading font-semibold mb-1">{p.title}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.content}</p>
                    {p.linkedScriptIds && p.linkedScriptIds.length > 0 && (
                      <div className="mt-3 pt-3 border-t flex flex-wrap gap-1.5">
                        {p.linkedScriptIds.map((id) => {
                          const s = scripts.find((x) => x._id === id);
                          if (!s) return null;
                          return (
                            <Link
                              key={id}
                              to="/skripte"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md bg-success/10 text-success hover:bg-success/20"
                            >
                              <FileText className="h-3 w-3" />
                              {s.title}
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </Link>
                          );
                        })}
                      </div>
                    )}
                    {p.linkedDeadlineIds && p.linkedDeadlineIds.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {p.linkedDeadlineIds.map((id) => {
                          const d = deadlines.find((x) => x._id === id);
                          if (!d) return null;
                          return (
                            <Link
                              key={id}
                              to="/planner"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md bg-warning/10 text-warning hover:bg-warning/20"
                            >
                              <CalendarDays className="h-3 w-3" />
                              {d.title}
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </Link>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleLike(p.id); }}
                        className={`inline-flex items-center gap-1 transition-colors ${
                          p.liked ? "text-primary" : "hover:text-foreground"
                        }`}
                      >
                        <ThumbsUp className={`h-3.5 w-3.5 ${p.liked ? "fill-primary" : ""}`} />
                        {p.likeCount}
                      </button>
                      <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {p.commentCount}</span>
                      {isAdmin && (
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (window.confirm(language.match({ english: () => `Really delete post "${p.title}"?`, german: () => `Beitrag „${p.title}" wirklich löschen?` }))) deletePostMutation({ postId: p.id as any }); }}
                          className="ml-auto inline-flex items-center gap-1 text-destructive hover:text-destructive/80 transition-colors"
                          title={language.match({ english: () => "Delete post (Admin)", german: () => "Beitrag löschen (Admin)" })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>

            {/* Sidebar: members + linked scripts overview */}
            <aside className="space-y-4">
              <div className="glass-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{language.match({ english: () => "Members", german: () => "Mitglieder" })}</p>
                <div className="space-y-1">
                  {forum.members.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{language.match({ english: () => "No members", german: () => "Keine Mitglieder" })}</p>
                  ) : (
                    forum.members.map((m) => (
                      <div key={m.userId} className="flex items-center gap-2 text-sm">
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                          {m.displayName[0]?.toUpperCase()}
                        </div>
                        <span className="truncate">{m.displayName}</span>
                        {forum.ownerId && m.userId === forum.ownerId && (
                          <span className="text-[9px] px-1.5 rounded bg-secondary text-muted-foreground ml-auto">{language.match({ english: () => "Owner", german: () => "Owner" })}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="glass-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  {language.match({ english: () => "Linked Scripts", german: () => "Verlinkte Skripte" })}
                </p>
                {(() => {
                  const used = new Set<string>();
                  posts.forEach((p) => p.linkedScriptIds?.forEach((id) => used.add(id)));
                  const linked = scripts.filter((s) => used.has(s._id));
                  if (linked.length === 0)
                    return <p className="text-xs text-muted-foreground">{language.match({ english: () => "No scripts linked yet.", german: () => "Noch keine Skripte verlinkt." })}</p>;
                  return (
                    <div className="space-y-1.5">
                      {linked.map((s) => (
                        <Link
                          key={s._id}
                          to="/skripte"
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary/40 text-sm"
                        >
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{s.title}</p>
                            <p className="text-[10px] text-muted-foreground">{s.subject}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={(open) => { setInviteOpen(open); if (!open) { setInviteSearch(""); setSelectedInvitees([]); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> {language.match({ english: () => "Invite People", german: () => "Personen einladen" })}
            </DialogTitle>
            <DialogDescription>
              {language.match({ english: () => "Invited people will receive a notification and can accept or decline.", german: () => "Eingeladene Personen erhalten eine Benachrichtigung und können annehmen oder ablehnen." })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Input
                placeholder={language.match({ english: () => "Search name…", german: () => "Name suchen…" })}
                value={inviteSearch}
                onChange={(e) => setInviteSearch(e.target.value)}
                autoComplete="off"
              />
              {inviteSearch.trim().length > 0 && (() => {
                const suggestions = kursPeople.filter(
                  (p) =>
                    p.displayName.toLowerCase().includes(inviteSearch.toLowerCase()) &&
                    !selectedInvitees.some((s) => s.userId === p.userId)
                ).slice(0, 6);
                return suggestions.length > 0 ? (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-md border bg-popover shadow-md">
                    {suggestions.map((p) => (
                      <button
                        key={p.userId}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                        onClick={() => { setSelectedInvitees([...selectedInvitees, p]); setInviteSearch(""); }}
                      >
                        {p.displayName}
                      </button>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
            {selectedInvitees.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedInvitees.map((p) => (
                  <span key={p.userId} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2.5 py-1">
                    {p.displayName}
                    <button type="button" onClick={() => setSelectedInvitees(selectedInvitees.filter((s) => s.userId !== p.userId))} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {inviteError && selectedInvitees.length === 0 && <p className="text-xs text-destructive">{inviteError}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setInviteOpen(false)}>{language.match({ english: () => "Cancel", german: () => "Abbrechen" })}</Button>
            <Button onClick={handleInvite} disabled={selectedInvitees.length === 0}>{language.match({ english: () => "Send Invitations", german: () => "Einladungen senden" })}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Script picker */}
      <Dialog open={scriptPickerOpen} onOpenChange={setScriptPickerOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> {language.match({ english: () => "Link Scripts", german: () => "Skripte verlinken" })}
            </DialogTitle>
            <DialogDescription>
              {language.match({ english: () => "Only public scripts from the library can be linked.", german: () => "Nur öffentliche Skripte aus der Bibliothek können verlinkt werden." })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-1.5">
            {scripts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {language.match({ english: () => "No scripts available", german: () => "Keine Skripte verfügbar" })}
              </p>
            ) : (
              scripts.map((s) => {
                const checked = linkedScriptIds.includes(s._id);
                return (
                  <button
                    key={s._id}
                    onClick={() => toggleLink(s._id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      checked
                        ? "bg-primary/5 border-primary/40"
                        : "border-border hover:bg-secondary/40"
                    }`}
                  >
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.subject}
                      </p>
                    </div>
                    {checked && <span className="text-xs text-primary font-medium">{language.match({ english: () => "Linked", german: () => "Verlinkt" })}</span>}
                  </button>
                );
              })
            )}
          </div>
          <div className="flex justify-end pt-2 border-t">
            <Button onClick={() => setScriptPickerOpen(false)}>{language.match({ english: () => "Done", german: () => "Fertig" })}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deadline picker */}
      <Dialog open={deadlinePickerOpen} onOpenChange={setDeadlinePickerOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-warning" /> {language.match({ english: () => "Link Deadlines", german: () => "Deadlines verlinken" })}
            </DialogTitle>
            <DialogDescription>
              {language.match({ english: () => "Select deadlines to link in this post.", german: () => "Wähle Deadlines aus, die in diesem Beitrag verlinkt werden sollen." })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-1.5">
            {deadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {language.match({ english: () => "No deadlines available", german: () => "Keine Deadlines verfügbar" })}
              </p>
            ) : (
              deadlines.map((d) => {
                const checked = linkedDeadlineIds.includes(d._id);
                return (
                  <button
                    key={d._id}
                    onClick={() => toggleDeadlineLink(d._id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      checked
                        ? "bg-warning/5 border-warning/40"
                        : "border-border hover:bg-secondary/40"
                    } ${d.done ? "opacity-50" : ""}`}
                  >
                    <CalendarDays className="h-4 w-4 text-warning shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.date} · {d.category}
                      </p>
                    </div>
                    {checked && <span className="text-xs text-warning font-medium">{language.match({ english: () => "Linked", german: () => "Verlinkt" })}</span>}
                  </button>
                );
              })
            )}
          </div>
          <div className="flex justify-end pt-2 border-t">
            <Button onClick={() => setDeadlinePickerOpen(false)}>{language.match({ english: () => "Done", german: () => "Fertig" })}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ForumDetailPage;
