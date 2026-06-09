import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Plus,
  ThumbsUp,
  MessageCircle,
  Search,
  Clock,
  Users,
  Globe,
  Lock,
  Presentation,
  X,
  Hash,
  LogIn,
  Copy,
  TrendingUp,
  ExternalLink,
  FileText,
  Flag,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Whiteboard from "@/components/Whiteboard";
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
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Link, useNavigate } from "react-router-dom";

import { DHBW_STANDORTE } from "@/lib/dhbw";
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

type Sort = "neu" | "beliebt";

// ── Shared types ──

interface FPostItem {
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
  sketch?: string;
  linkedScriptIds?: string[];
  standort?: string;
  studiengang?: string;
  kurs?: string;
  vorlesung?: string;
  professor?: string;
}

interface FForumItem {
  id: string;
  name: string;
  visibility: "public" | "private";
  description: string;
  members: { userId: string; displayName: string }[];
  ownerId: string;
  inviteCode: string;
  kurs?: string;
  vorlesung?: string;
  professor?: string;
  standort?: string;
  jahrgang?: string;
}

interface FScriptItem {
  id: string;
  title: string;
  subject: string;
}

// ── Convex production path ──

function ForumPage() {
  const { user } = useAuth();
  const profile = useProfile();
  const me = user?.id || "";
  const displayName = profile?.display_name || "Unbekannt";
  const myJahrgang = profile?.jahrgang || undefined;
  const navigate = useNavigate();

  const forumsQuery = useQuery(api.forums.getAllAccessible);
  const allScriptsQuery = useQuery(api.scripts.listPublic);

  const createForumMutation = useMutation(api.forums.create);
  const createPostMutation = useMutation(api.posts.create);
  const toggleLikeMutation = useMutation(api.posts.toggleLike);
  const joinByCodeMutation = useMutation(api.forums.joinByCode);
  const joinMutation = useMutation(api.forums.join);
  const leaveMutation = useMutation(api.forums.leave);
  const inviteMutation = useMutation(api.notifications.inviteToForum);

  const [activeForumId, setActiveForumId] = useState<string>("");
  const [showPostForm, setShowPostForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("frage");
  const [sketch, setSketch] = useState<string | undefined>(undefined);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);
  const [linkedScriptIds, setLinkedScriptIds] = useState<string[]>([]);
  const [scriptPickerOpen, setScriptPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string>("alle");
  const [sort, setSort] = useState<Sort>("neu");

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ postId: string; postTitle: string } | null>(null);
  const [fName, setFName] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fVisibility, setFVisibility] = useState<"public" | "private">("public");
  const [fKurs, setFKurs] = useState("");
  const [fVorlesung, setFVorlesung] = useState("");
  const [fProfessor, setFProfessor] = useState("");
  const [fStandort, setFStandort] = useState<string>("");
  const [fAllowedKurse, setFAllowedKurse] = useState("");
  const [fJahrgangOnly, setFJahrgangOnly] = useState(true);
  const [fInvitees, setFInvitees] = useState("");
  const [joinCode, setJoinCode] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawForums: any[] = (forumsQuery ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pubScripts: FScriptItem[] = (allScriptsQuery ?? []).map((s: any) => ({
    id: s._id,
    title: s.title,
    subject: s.subject,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const forums: FForumItem[] = rawForums.map((f: any) => ({
    id: f._id,
    name: f.name,
    visibility: f.visibility,
    description: f.description ?? "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    members: (f.members ?? []).map((m: any) => ({
      userId: m.userId ?? m,
      displayName: m.displayName ?? m,
    })),
    ownerId: f.ownerId,
    inviteCode: f.inviteCode,
    kurs: f.kurs,
    vorlesung: f.vorlesung,
    professor: f.professor,
    standort: f.standort,
  }));

  // Posts for active forum
  const postsQuery = useQuery(
    api.posts.listByForum,
    activeForumId ? { forumId: activeForumId as Id<"forums"> } : "skip"
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawPosts: any[] = (postsQuery ?? []) as any[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allPosts: FPostItem[] = rawPosts.map((p: any) => ({
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
    sketch: p.sketch,
    linkedScriptIds: p.linkedScriptIds,
    standort: p.standort,
    studiengang: p.studiengang,
    kurs: p.kurs,
    vorlesung: p.vorlesung,
    professor: p.professor,
  }));

  const publicForums = forums.filter((f) => f.visibility === "public");
  const privateForums = forums.filter((f) => f.visibility === "private");

  const activeForum = useMemo(
    () => forums.find((f) => f.id === activeForumId) ?? forums[0],
    [forums, activeForumId]
  );

  useEffect(() => {
    if (activeForumId && !forums.some((f) => f.id === activeForumId)) {
      setActiveForumId(forums[0]?.id || "");
    }
    if (!activeForumId && forums.length > 0) {
      setActiveForumId(forums[0].id);
    }
  }, [forums, activeForumId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allPosts
      .filter((p) => {
        if (!myJahrgang) return true;
        return true;
      })
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          (p.kurs ?? "").toLowerCase().includes(q) ||
          (p.standort ?? "").toLowerCase().includes(q)
      )
      .filter((p) => activeTag === "alle" || p.tag === activeTag)
      .sort((a, b) => (sort === "beliebt" ? b.likeCount - a.likeCount : b._creationTime - a._creationTime));
  }, [allPosts, search, activeTag, sort, myJahrgang]);

  const isMember = activeForum?.members?.some((m) => m.userId === me) ?? false;
  const isOwner = activeForum?.ownerId === me;

  const postTitleError = title.trim().length > 0 && title.trim().length < 5 ? "Mindestens 5 Zeichen." : "";
  const postContentError = content.trim().length > 0 && content.trim().length < 10 ? "Mindestens 10 Zeichen." : "";
  const forumNameError = fName.trim().length > 0 && fName.trim().length < 3 ? "Mindestens 3 Zeichen." : "";
  const joinCodeError = joinCode.trim().length > 0 && joinCode.trim().length !== 6 ? "Der Einladungscode hat 6 Zeichen." : "";

  const addPost = async () => {
    if (title.trim().length < 5 || content.trim().length < 10) return;
    if (!activeForum) return;
    try {
      await createPostMutation({
        forumId: activeForum.id as Id<"forums">,
        title: title.trim(),
        content: content.trim(),
        tag: tag as "frage" | "lerngruppe" | "material" | "diskussion",
        sketch,
        linkedScriptIds: linkedScriptIds.length ? (linkedScriptIds as Id<"scripts">[]) : undefined,
      });
      setTitle("");
      setContent("");
      setSketch(undefined);
      setLinkedScriptIds([]);
      setShowPostForm(false);
    } catch {
      toast.error("Fehler beim Veröffentlichen");
    }
  };

  const toggleLike = async (id: string) => {
    if (!me) return;
    try {
      await toggleLikeMutation({ postId: id as Id<"posts"> });
    } catch {
      // Convex auto-revalidates, nothing extra needed
    }
  };

  const handleCreateForum = async () => {
    if (fName.trim().length < 3) {
      toast.error("Bitte einen längeren Forum-Namen vergeben");
      return;
    }
    try {
      const result = await createForumMutation({
        name: fName,
        description: fDesc,
        visibility: fVisibility,
        kurs: fKurs || undefined,
        vorlesung: fVorlesung || undefined,
        professor: fProfessor || undefined,
        standort: fStandort || profile?.hochschule || undefined,
        allowedKurse: fAllowedKurse
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        jahrgang: fJahrgangOnly ? myJahrgang : undefined,
      });
      const inviteNames = fInvitees.split(",").map((s) => s.trim()).filter(Boolean);
      if (inviteNames.length) {
        await inviteMutation({
          forumId: result.forumId as Id<"forums">,
          forumName: fName,
          recipientIds: inviteNames,
          recipientNames: inviteNames,
          fromName: me,
        });
      }
      toast.success(
        inviteNames.length
          ? `Forum „${fName}" erstellt · ${inviteNames.length} Einladung(en) versendet`
          : `Forum „${fName}" erstellt`
      );
      resetForumForm();
      setCreateOpen(false);
      setActiveForumId(result.forumId);
    } catch {
      toast.error("Fehler beim Erstellen des Forums");
    }
  };

  const handleJoinByCode = async () => {
    if (joinCode.trim().length !== 6) return;
    try {
      const result = await joinByCodeMutation({ code: joinCode.trim() });
      toast.success(`Beigetreten`);
      setJoinCode("");
      setJoinOpen(false);
      setActiveForumId(result.forumId);
    } catch {
      toast.error("Code ungültig");
    }
  };

  const handleJoinPublic = async (id: string) => {
    try {
      await joinMutation({ forumId: id as Id<"forums"> });
      toast.success("Beigetreten");
    } catch {
      toast.error("Fehler beim Beitreten");
    }
  };

  const handleLeave = async (id: string) => {
    try {
      await leaveMutation({ forumId: id as Id<"forums"> });
      setActiveForumId("");
    } catch {
      toast.error("Fehler beim Verlassen");
    }
  };

  const resetForumForm = () => {
    setFName("");
    setFDesc("");
    setFVisibility("public");
    setFKurs("");
    setFVorlesung("");
    setFProfessor("");
    setFStandort("");
    setFAllowedKurse("");
    setFJahrgangOnly(true);
    setFInvitees("");
  };

  const tags = [
    { id: "alle" as const, label: "Alle" },
    { id: "frage" as const, label: "Fragen" },
    { id: "lerngruppe" as const, label: "Lerngruppen" },
    { id: "material" as const, label: "Material" },
    { id: "diskussion" as const, label: "Diskussionen" },
  ];

  return (
    <ForumPageLayout
      forums={forums}
      activeForum={activeForum}
      activeForumId={activeForumId}
      setActiveForumId={setActiveForumId}
      publicForums={publicForums}
      privateForums={privateForums}
      isMember={isMember}
      isOwner={isOwner}
      me={me}
      navigate={navigate}
      createOpen={createOpen}
      setCreateOpen={setCreateOpen}
      joinOpen={joinOpen}
      setJoinOpen={setJoinOpen}
      fName={fName}
      setFName={setFName}
      fDesc={fDesc}
      setFDesc={setFDesc}
      fVisibility={fVisibility}
      setFVisibility={setFVisibility}
      fKurs={fKurs}
      setFKurs={setFKurs}
      fVorlesung={fVorlesung}
      setFVorlesung={setFVorlesung}
      fProfessor={fProfessor}
      setFProfessor={setFProfessor}
      fStandort={fStandort}
      setFStandort={setFStandort}
      fAllowedKurse={fAllowedKurse}
      setFAllowedKurse={setFAllowedKurse}
      fJahrgangOnly={fJahrgangOnly}
      setFJahrgangOnly={setFJahrgangOnly}
      fInvitees={fInvitees}
      setFInvitees={setFInvitees}
      forumNameError={forumNameError}
      handleCreateForum={handleCreateForum}
      resetForumForm={resetForumForm}
      joinCode={joinCode}
      setJoinCode={setJoinCode}
      joinCodeError={joinCodeError}
      handleJoinByCode={handleJoinByCode}
      handleJoinPublic={handleJoinPublic}
      handleLeave={handleLeave}
      showPostForm={showPostForm}
      setShowPostForm={setShowPostForm}
      title={title}
      setTitle={setTitle}
      content={content}
      setContent={setContent}
      tag={tag}
      setTag={setTag}
      sketch={sketch}
      setSketch={setSketch}
      whiteboardOpen={whiteboardOpen}
      setWhiteboardOpen={setWhiteboardOpen}
      linkedScriptIds={linkedScriptIds}
      setLinkedScriptIds={setLinkedScriptIds}
      scriptPickerOpen={scriptPickerOpen}
      setScriptPickerOpen={setScriptPickerOpen}
      pubScripts={pubScripts}
      postTitleError={postTitleError}
      postContentError={postContentError}
      addPost={addPost}
      filtered={filtered}
      search={search}
      setSearch={setSearch}
      sort={sort}
      setSort={setSort}
      activeTag={activeTag}
      setActiveTag={setActiveTag}
      tags={tags}
      toggleLike={toggleLike}
      myJahrgang={myJahrgang}
      reportTarget={reportTarget}
      setReportTarget={setReportTarget}
    />
  );
}

// ── Shared layout ──

function ForumPageLayout({
  forums,
  activeForum,
  activeForumId,
  setActiveForumId,
  publicForums,
  privateForums,
  isMember,
  isOwner,
  me,
  navigate,
  createOpen,
  setCreateOpen,
  joinOpen,
  setJoinOpen,
  fName,
  setFName,
  fDesc,
  setFDesc,
  fVisibility,
  setFVisibility,
  fKurs,
  setFKurs,
  fVorlesung,
  setFVorlesung,
  fProfessor,
  setFProfessor,
  fStandort,
  setFStandort,
  fAllowedKurse,
  setFAllowedKurse,
  fJahrgangOnly,
  setFJahrgangOnly,
  fInvitees,
  setFInvitees,
  forumNameError,
  handleCreateForum,
  resetForumForm,
  joinCode,
  setJoinCode,
  joinCodeError,
  handleJoinByCode,
  handleJoinPublic,
  handleLeave,
  showPostForm,
  setShowPostForm,
  title,
  setTitle,
  content,
  setContent,
  tag,
  setTag,
  sketch,
  setSketch,
  whiteboardOpen,
  setWhiteboardOpen,
  linkedScriptIds,
  setLinkedScriptIds,
  scriptPickerOpen,
  setScriptPickerOpen,
  pubScripts,
  postTitleError,
  postContentError,
  addPost,
  filtered,
  search,
  setSearch,
  sort,
  setSort,
  activeTag,
  setActiveTag,
  tags,
  toggleLike,
  myJahrgang,
  reportTarget,
  setReportTarget,
}: {
  forums: FForumItem[];
  activeForum: FForumItem | undefined;
  activeForumId: string;
  setActiveForumId: (id: string) => void;
  publicForums: FForumItem[];
  privateForums: FForumItem[];
  isMember: boolean;
  isOwner: boolean;
  me: string;
  navigate: ReturnType<typeof useNavigate>;
  createOpen: boolean;
  setCreateOpen: (v: boolean) => void;
  joinOpen: boolean;
  setJoinOpen: (v: boolean) => void;
  fName: string;
  setFName: (v: string) => void;
  fDesc: string;
  setFDesc: (v: string) => void;
  fVisibility: "public" | "private";
  setFVisibility: (v: "public" | "private") => void;
  fKurs: string;
  setFKurs: (v: string) => void;
  fVorlesung: string;
  setFVorlesung: (v: string) => void;
  fProfessor: string;
  setFProfessor: (v: string) => void;
  fStandort: string;
  setFStandort: (v: string) => void;
  fAllowedKurse: string;
  setFAllowedKurse: (v: string) => void;
  fJahrgangOnly: boolean;
  setFJahrgangOnly: (v: boolean) => void;
  fInvitees: string;
  setFInvitees: (v: string) => void;
  forumNameError: string;
  handleCreateForum: () => void;
  resetForumForm: () => void;
  joinCode: string;
  setJoinCode: (v: string) => void;
  joinCodeError: string;
  handleJoinByCode: () => void;
  handleJoinPublic: (id: string) => void;
  handleLeave: (id: string) => void;
  showPostForm: boolean;
  setShowPostForm: (v: boolean) => void;
  title: string;
  setTitle: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  tag: string;
  setTag: (v: any) => void;
  sketch?: string;
  setSketch: (v: string | undefined) => void;
  whiteboardOpen: boolean;
  setWhiteboardOpen: (v: boolean) => void;
  linkedScriptIds: string[];
  setLinkedScriptIds: (v: string[]) => void;
  scriptPickerOpen: boolean;
  setScriptPickerOpen: (v: boolean) => void;
  pubScripts: FScriptItem[];
  postTitleError: string;
  postContentError: string;
  addPost: () => void;
  filtered: FPostItem[];
  search: string;
  setSearch: (v: string) => void;
  sort: Sort;
  setSort: (v: Sort) => void;
  activeTag: string;
  setActiveTag: (v: any) => void;
  tags: { id: string; label: string }[];
  toggleLike: (id: string) => void;
  myJahrgang?: string;
  reportTarget: { postId: string; postTitle: string } | null;
  setReportTarget: (v: { postId: string; postTitle: string } | null) => void;
}) {
  const ForumItem = ({ f }: { f: FForumItem }) => {
    const Icon = f.visibility === "public" ? Hash : Lock;
    const active = f.id === activeForumId;
    return (
      <div
        className={`group flex items-center rounded-lg transition-colors ${
          active ? "bg-primary/10" : "hover:bg-secondary/60"
        }`}
      >
        <button
          onClick={() => setActiveForumId(f.id)}
          className={`flex-1 text-left px-3 py-2 flex items-center gap-2 min-w-0 ${
            active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          }`}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span className="text-sm font-medium truncate flex-1">{f.name}</span>
          <span className="text-[10px] text-muted-foreground/70 shrink-0">{f.members.length}</span>
        </button>
        <Link
          to={`/forum/${f.id}`}
          className="px-2 py-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"
          title="Detailansicht öffnen"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  };

  const formatDate = (ts: number) => {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return "gerade eben";
    if (m < 60) return `vor ${m} Min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `vor ${h} Std`;
    return new Date(ts).toLocaleDateString("de-DE");
  };

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success("Code kopiert");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 md:pt-24 pb-16 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading font-semibold text-sm">Foren</h3>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setJoinOpen(true)} title="Privatem Forum beitreten">
                      <LogIn className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCreateOpen(true)} title="Neues Forum erstellen">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 px-1">Öffentlich</p>
                  {publicForums.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-1 py-1">Keine öffentlichen Foren</p>
                  ) : (
                    <div className="space-y-0.5">
                      {publicForums.map((f) => (<ForumItem key={f.id} f={f} />))}
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 px-1">Privat / Gruppen</p>
                  {privateForums.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-1 py-1">Tritt bei via Code oder erstelle eines.</p>
                  ) : (
                    <div className="space-y-0.5">
                      {privateForums.map((f) => (<ForumItem key={f.id} f={f} />))}
                    </div>
                  )}
                </div>
              </div>

              {activeForum && (
                <div className="glass-card p-4 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Aktives Forum</p>
                    <p className="font-semibold text-sm truncate">{activeForum.name}</p>
                    {activeForum.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{activeForum.description}</p>
                    )}
                  </div>
                  {(activeForum.kurs || activeForum.vorlesung || activeForum.professor || activeForum.standort) && (
                    <div className="flex flex-wrap gap-1">
                      {activeForum.standort && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{activeForum.standort}</span>)}
                      {activeForum.kurs && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent">{activeForum.kurs}</span>)}
                      {activeForum.vorlesung && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/80">{activeForum.vorlesung}</span>)}
                      {activeForum.professor && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/80">Prof. {activeForum.professor}</span>)}
                    </div>
                  )}
                  {activeForum.visibility === "private" && (
                    <div className="rounded-lg border bg-primary/5 p-2">
                      <p className="text-[10px] text-muted-foreground mb-1">Einladungscode</p>
                      <div className="flex items-center gap-1">
                        <code className="flex-1 font-mono text-sm tracking-widest text-center py-1 rounded bg-background border">{activeForum.inviteCode}</code>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleCopy(activeForum.inviteCode)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" /> {activeForum.members.length} Mitglieder
                  </div>
                  <Link to={`/forum/${activeForum.id}`} className="block">
                    <Button size="sm" variant="outline" className="w-full gap-1.5">
                      <ExternalLink className="h-3.5 w-3.5" /> Detailansicht öffnen
                    </Button>
                  </Link>
                  <div className="flex gap-2">
                    {activeForum.visibility === "public" && !isMember && (
                      <Button size="sm" className="w-full" onClick={() => handleJoinPublic(activeForum.id)}>Beitreten</Button>
                    )}
                    {!isOwner && isMember && (
                      <Button size="sm" variant="outline" className="w-full" onClick={() => handleLeave(activeForum.id)}>Verlassen</Button>
                    )}
                  </div>
                </div>
              )}
            </aside>

            {/* Main */}
            <main>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Community</span>
                    {activeForum?.visibility === "private" && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        <Lock className="h-3 w-3" /> Privat
                      </span>
                    )}
                  </div>
                  <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight truncate">
                    {activeForum?.name || "Forum"} <span className="text-gradient">Forum</span>
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {activeForum?.description || "Diskussion in diesem Forum"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowPostForm((v) => !v)}
                    className="gap-2"
                    disabled={!isMember}
                    title={isMember ? "" : "Tritt dem Forum bei, um zu posten"}
                  >
                    <Plus className="h-4 w-4" /> Neuer Beitrag
                  </Button>
                </div>
              </motion.div>

              {/* Post form */}
              <AnimatePresence>
                {showPostForm && isMember && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="glass-card p-5 space-y-4">
                      <Input placeholder="Titel deines Beitrags" value={title} onChange={(e) => setTitle(e.target.value)} />
                      {postTitleError && <p className="text-xs text-destructive">{postTitleError}</p>}
                      <Textarea placeholder="Was möchtest du teilen?" value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="resize-none" />
                      {postContentError && <p className="text-xs text-destructive">{postContentError}</p>}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Kategorie</p>
                        <div className="flex flex-wrap gap-2">
                          {(["frage", "lerngruppe", "material", "diskussion"] as const).map((t) => (
                            <button
                              key={t}
                              onClick={() => setTag(t)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                tag === t ? tagStyles[t] : "text-muted-foreground bg-secondary border-transparent"
                              }`}
                            >
                              {tagLabels[t]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Whiteboard-Skizze</p>
                        {sketch ? (
                          <div className="relative inline-block">
                            <img src={sketch} alt="Skizze" className="max-h-40 rounded-lg border border-border bg-white" />
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" variant="outline" onClick={() => setWhiteboardOpen(true)}>Bearbeiten</Button>
                              <Button size="sm" variant="ghost" onClick={() => setSketch(undefined)} className="gap-1">
                                <X className="h-3.5 w-3.5" /> Entfernen
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button type="button" variant="outline" size="sm" onClick={() => setWhiteboardOpen(true)} className="gap-2">
                            <Presentation className="h-4 w-4" /> Whiteboard-Skizze hinzufügen
                          </Button>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs text-muted-foreground">Skripte verlinken (nur öffentliche)</p>
                          <Button type="button" size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setScriptPickerOpen(true)}>
                            <FileText className="h-3.5 w-3.5" /> Auswählen
                          </Button>
                        </div>
                        {linkedScriptIds.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground">Keine Skripte verlinkt</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {linkedScriptIds.map((id) => {
                              const s = pubScripts.find((x) => x.id === id);
                              if (!s) return null;
                              return (
                                <span key={id} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-success/10 text-success">
                                  <FileText className="h-3 w-3" />
                                  {s.title}
                                  <button type="button" onClick={() => setLinkedScriptIds((prev) => prev.filter((x) => x !== id))} className="ml-0.5 hover:text-destructive">
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowPostForm(false)}>Abbrechen</Button>
                        <Button onClick={addPost}>Veröffentlichen</Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search + Sort */}
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Beiträge durchsuchen…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <div className="flex gap-1 p-1 rounded-lg bg-secondary/60 w-fit">
                  <button
                    onClick={() => setSort("neu")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      sort === "neu" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" /> Neu
                  </button>
                  <button
                    onClick={() => setSort("beliebt")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      sort === "beliebt" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5" /> Beliebt
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {tags.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTag(t.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      activeTag === t.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/60 text-muted-foreground border-transparent hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Posts */}
              <div className="space-y-3">
                {filtered.length === 0 && (
                  <div className="glass-card p-10 text-center">
                    <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">Keine Beiträge gefunden</p>
                  </div>
                )}
                {filtered.map((post, i) => {
                  const avatarColor = avatarColors[post.authorName.charCodeAt(0) % avatarColors.length];
                  return (
                    <motion.article
                      key={post.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => navigate(`/forum/${activeForum?.id}/post/${post.id}`)}
                      className="glass-card p-5 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`h-10 w-10 rounded-full ${avatarColor} flex items-center justify-center font-bold text-sm shrink-0`}>
                          {post.authorName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="text-sm font-semibold">{post.authorName}</span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">{formatDate(post._creationTime)}</span>
                            <Badge variant="outline" className={`${tagStyles[post.tag]} text-[10px] py-0 h-5 ml-auto`}>
                              {tagLabels[post.tag]}
                            </Badge>
                          </div>
                          <h3 className="font-heading font-semibold text-base mb-1">{post.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                          {post.sketch && (
                            <img src={post.sketch} alt="Whiteboard-Skizze" className="mt-3 max-h-64 rounded-lg border border-border bg-white" />
                          )}
                          {post.linkedScriptIds && post.linkedScriptIds.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {post.linkedScriptIds.map((id) => {
                                const s = pubScripts.find((x) => x.id === id);
                                if (!s) return null;
                                return (
                                  <Link key={id} to="/skripte" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success hover:bg-success/20">
                                    <FileText className="h-3 w-3" />
                                    {s.title}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                          {(post.standort || post.studiengang || post.kurs || post.vorlesung || post.professor) && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {post.standort && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{post.standort}</span>)}
                              {post.studiengang && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/80 font-medium">{post.studiengang}</span>)}
                              {post.kurs && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-medium">{post.kurs}</span>)}
                              {post.vorlesung && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/80 font-medium">{post.vorlesung}</span>)}
                              {post.professor && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/80 font-medium">Prof. {post.professor}</span>)}
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleLike(post.id); }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                post.liked ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                              }`}
                            >
                              <ThumbsUp className={`h-3.5 w-3.5 ${post.liked ? "fill-primary" : ""}`} />
                              {post.likeCount}
                            </button>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground">
                              <MessageCircle className="h-3.5 w-3.5" />
                              {post.commentCount}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReportTarget({ postId: post.id, postTitle: post.title });
                              }}
                              title="Beitrag melden"
                              className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                              <Flag className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </main>
          </div>
        </div>
      </div>

      <ReportDialog
        open={reportTarget !== null}
        onOpenChange={(open) => { if (!open) setReportTarget(null); }}
        postId={reportTarget?.postId ?? ""}
        postTitle={reportTarget?.postTitle ?? ""}
        forumName={activeForum?.name ?? "Forum"}
        reportedBy={me}
      />

      {/* Create-forum dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Neues Forum erstellen</DialogTitle>
            <DialogDescription>
              Erstelle ein themenbezogenes Forum. Öffentliche Foren erscheinen für alle in der Liste, private nur für eingeladene Personen oder Kurse.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Name des Forums (z. B. Mathe 2 – Prof. Müller)" value={fName} onChange={(e) => setFName(e.target.value)} />
            {forumNameError && <p className="text-xs text-destructive">{forumNameError}</p>}
            <Textarea placeholder="Kurzbeschreibung (optional)" value={fDesc} onChange={(e) => setFDesc(e.target.value)} rows={2} />
            <div className="grid sm:grid-cols-2 gap-2">
              <Input placeholder="Kurs (z. B. WWI23A)" value={fKurs} onChange={(e) => setFKurs(e.target.value)} />
              <Input placeholder="Vorlesung (optional)" value={fVorlesung} onChange={(e) => setFVorlesung(e.target.value)} />
              <Input placeholder="Professor (optional)" value={fProfessor} onChange={(e) => setFProfessor(e.target.value)} />
              <select value={fStandort} onChange={(e) => setFStandort(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Standort (optional)</option>
                {DHBW_STANDORTE.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Sichtbarkeit</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFVisibility("public")}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    fVisibility === "public" ? "bg-primary/10 text-primary border-primary/30" : "text-muted-foreground bg-secondary border-transparent"
                  }`}
                ><Globe className="h-4 w-4" /> Öffentlich</button>
                <button
                  onClick={() => setFVisibility("private")}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    fVisibility === "private" ? "bg-primary/10 text-primary border-primary/30" : "text-muted-foreground bg-secondary border-transparent"
                  }`}
                ><Lock className="h-4 w-4" /> Privat</button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {fVisibility === "public" ? "Jeder kann das Forum in der Liste sehen und beitreten." : "Nur über Einladungscode oder zugelassene Kurse zugänglich."}
              </p>
            </div>
            {fVisibility === "private" && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Zugelassene Kurse (komma-getrennt, optional)</p>
                <Input placeholder="z. B. WWI23A, WWI23B" value={fAllowedKurse} onChange={(e) => setFAllowedKurse(e.target.value)} />
                <p className="text-[11px] text-muted-foreground mt-1">Mitglieder dieser Kurse erhalten automatisch Zugriff. Zusätzlich kannst du den Einladungscode teilen.</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Personen einladen (komma-getrennt, optional)</p>
              <Input placeholder="z. B. Anna M., Tim K." value={fInvitees} onChange={(e) => setFInvitees(e.target.value)} />
              <p className="text-[11px] text-muted-foreground mt-1">Eingeladene Personen erhalten eine Benachrichtigung und können annehmen oder ablehnen.</p>
            </div>
            {myJahrgang && (
              <label className="flex items-start gap-2 rounded-lg border bg-secondary/40 p-3 cursor-pointer select-none">
                <input type="checkbox" checked={fJahrgangOnly} onChange={(e) => setFJahrgangOnly(e.target.checked)} className="mt-1 accent-primary" />
                <span className="text-xs">
                  <span className="font-medium text-foreground">Nur für Jahrgang {myJahrgang}</span>
                  <span className="block text-muted-foreground mt-0.5">Nur Studierende dieses Jahrgangs sehen und betreten dieses Forum.</span>
                </span>
              </label>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => { resetForumForm(); setCreateOpen(false); }}>Abbrechen</Button>
              <Button onClick={handleCreateForum}>Forum erstellen</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join dialog */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><LogIn className="h-5 w-5 text-primary" /> Forum beitreten</DialogTitle>
            <DialogDescription>Gib den Einladungscode ein, den du erhalten hast.</DialogDescription>
          </DialogHeader>
          <Input placeholder="z. B. AB12CD" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} className="font-mono text-center text-lg tracking-widest" maxLength={6} />
          {joinCodeError && <p className="text-xs text-destructive">{joinCodeError}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setJoinOpen(false)}>Abbrechen</Button>
            <Button onClick={handleJoinByCode}>Beitreten</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={whiteboardOpen} onOpenChange={setWhiteboardOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>Whiteboard-Skizze</DialogTitle></DialogHeader>
          <Whiteboard height={460} saveLabel="Skizze übernehmen" onSave={(dataUrl) => { setSketch(dataUrl); setWhiteboardOpen(false); }} />
        </DialogContent>
      </Dialog>

      {/* Script picker */}
      <Dialog open={scriptPickerOpen} onOpenChange={setScriptPickerOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Skripte verlinken</DialogTitle>
            <DialogDescription>Nur öffentliche Skripte aus der Bibliothek können verlinkt werden.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-1.5">
            {pubScripts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Keine öffentlichen Skripte verfügbar</p>
            ) : (
              pubScripts.map((s) => {
                const sid = s.id;
                const checked = linkedScriptIds.includes(sid);
                return (
                  <button
                    key={sid}
                    onClick={() => setLinkedScriptIds((prev) => prev.includes(sid) ? prev.filter((x: string) => x !== sid) : [...prev, sid])}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      checked ? "bg-primary/5 border-primary/40" : "border-border hover:bg-secondary/40"
                    }`}
                  >
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.subject}</p>
                    </div>
                    {checked && <span className="text-xs text-primary font-medium">Verlinkt</span>}
                  </button>
                );
              })
            )}
          </div>
          <div className="flex justify-end pt-2 border-t">
            <Button onClick={() => setScriptPickerOpen(false)}>Fertig</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ForumPage;
