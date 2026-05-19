import { useEffect, useMemo, useState } from "react";
import { loadPosts, savePosts, subscribe, type SharedPost } from "@/lib/forumStore";
import {
  loadForums,
  subscribeForums,
  createForum,
  joinForumByCode,
  joinForum,
  leaveForum,
  deleteForum,
  accessibleForums,
  type Forum,
  type ForumVisibility,
} from "@/lib/forumsStore";
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
  Check,
  Trash2,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Whiteboard from "@/components/Whiteboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { DHBW_STANDORTE } from "@/lib/dhbw";
import { inviteToForum } from "@/lib/notificationsStore";
import { Link, useNavigate } from "react-router-dom";
import { publicScripts, subscribeScripts, type Script } from "@/lib/scriptsStore";
import { FileText } from "lucide-react";
import { toast } from "sonner";

type Post = SharedPost;

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

const initialPosts: Post[] = [
  {
    id: "1",
    author: "Anna M.",
    title: "Frage zur linearen Algebra Aufgabe 3",
    content: "Kann mir jemand bei der Eigenwertberechnung helfen? Ich komme bei der 3x3 Matrix nicht weiter.",
    date: "vor 2 Stunden",
    likes: 5,
    replies: 3,
    tag: "frage",
    standort: "DHBW Stuttgart",
    studiengang: "Wirtschaftsinformatik",
    kurs: "WWI23A",
  },
  {
    id: "2",
    author: "Tim K.",
    title: "Lerngruppe für Statistik Klausur",
    content: "Wer hat Lust auf eine kursübergreifende Lerngruppe für die Statistik-Klausur? Online via Discord.",
    date: "vor 5 Stunden",
    likes: 12,
    replies: 8,
    tag: "lerngruppe",
    standort: "DHBW Mannheim",
    studiengang: "BWL-Industrie",
    kurs: "WIN22",
  },
  {
    id: "3",
    author: "Lena S.",
    title: "Zusammenfassung Vorlesung 7 - Algorithmen",
    content: "Habe meine Zusammenfassung zur Sortieralgorithmen-Vorlesung hochgeladen. Schaut gerne rein!",
    date: "gestern",
    likes: 20,
    replies: 4,
    tag: "material",
    standort: "DHBW Karlsruhe",
    studiengang: "Informatik",
    kurs: "TINF22",
  },
];

const avatarColors = [
  "bg-primary/15 text-primary",
  "bg-info/15 text-info",
  "bg-success/15 text-success",
  "bg-accent/15 text-accent",
  "bg-destructive/15 text-destructive",
];

type Sort = "neu" | "beliebt";

const ForumPage = () => {
  const { user } = useAuth();
  const profile = useProfile();
  const me = profile?.display_name || "Du";
  const myJahrgang = profile?.jahrgang || undefined;

  const [stored, setStored] = useState<Post[]>(() => loadPosts());
  const [forums, setForums] = useState<Forum[]>(() => loadForums());
  const [activeForumId, setActiveForumId] = useState<string>("public");

  // Post form
  const [showPostForm, setShowPostForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState<Post["tag"]>("frage");
  const [sketch, setSketch] = useState<string | undefined>(undefined);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);
  const [linkedScriptIds, setLinkedScriptIds] = useState<string[]>([]);
  const [scriptPickerOpen, setScriptPickerOpen] = useState(false);
  const [pubScripts, setPubScripts] = useState<Script[]>(() => publicScripts());
  const navigate = useNavigate();

  // Forum-creation dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [fName, setFName] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fVisibility, setFVisibility] = useState<ForumVisibility>("public");
  const [fKurs, setFKurs] = useState("");
  const [fVorlesung, setFVorlesung] = useState("");
  const [fProfessor, setFProfessor] = useState("");
  const [fStandort, setFStandort] = useState<string>("");
  const [fAllowedKurse, setFAllowedKurse] = useState("");
  const [fJahrgangOnly, setFJahrgangOnly] = useState(true);
  const [fInvitees, setFInvitees] = useState("");
  const [joinCode, setJoinCode] = useState("");

  // List filters
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<Post["tag"] | "alle">("alle");
  const [sort, setSort] = useState<Sort>("neu");

  useEffect(() => subscribe(() => setStored(loadPosts())), []);
  useEffect(() => subscribeForums(() => setForums(loadForums())), []);
  useEffect(() => subscribeScripts(() => setPubScripts(publicScripts())), []);

  const accessible = useMemo(
    () => accessibleForums(me, undefined, myJahrgang),
    [forums, me, myJahrgang]
  );
  const publicForums = accessible.filter((f) => f.visibility === "public" && !f.isDefault);
  const privateForums = accessible.filter((f) => f.visibility === "private");
  const defaultForum = accessible.find((f) => f.isDefault)!;

  const activeForum = useMemo(
    () => accessible.find((f) => f.id === activeForumId) ?? defaultForum,
    [accessible, activeForumId, defaultForum]
  );

  // Effective active id (in case current active became inaccessible)
  useEffect(() => {
    if (!accessible.some((f) => f.id === activeForumId)) setActiveForumId("public");
  }, [accessible, activeForumId]);

  const allPosts = useMemo(
    () => (activeForum.isDefault ? [...stored, ...initialPosts] : [...stored]),
    [stored, activeForum.isDefault]
  );

  const addPost = () => {
    if (!title.trim() || !content.trim()) return;
    const next: Post = {
      id: Date.now().toString(),
      author: me,
      title: title.trim(),
      content: content.trim(),
      date: "gerade eben",
      likes: 0,
      replies: 0,
      tag,
      standort: profile?.hochschule || activeForum.standort,
      studiengang: profile?.studienfach,
      kurs: activeForum.kurs,
      vorlesung: activeForum.vorlesung,
      professor: activeForum.professor,
      visibility: activeForum.visibility,
      sketch,
      groupId: activeForum.isDefault ? undefined : activeForum.id,
      linkedScriptIds: linkedScriptIds.length ? linkedScriptIds : undefined,
      jahrgang: myJahrgang,
    };
    const updated = [next, ...stored];
    setStored(updated);
    savePosts(updated);
    setTitle("");
    setContent("");
    setSketch(undefined);
    setLinkedScriptIds([]);
    setShowPostForm(false);
  };

  const toggleLike = (id: string) => {
    const updated = stored.map((p) =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    );
    setStored(updated);
    savePosts(updated);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allPosts
      .filter((p) => (activeForum.isDefault ? !p.groupId : p.groupId === activeForum.id))
      .filter((p) => {
        // Jahrgang-Beschränkung: zeige nur Beiträge des eigenen Jahrgangs
        // (oder Beiträge ohne Jahrgang, z. B. legacy/seed).
        if (!myJahrgang) return true;
        return !p.jahrgang || p.jahrgang === myJahrgang;
      })
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          (p.kurs ?? "").toLowerCase().includes(q) ||
          (p.standort ?? "").toLowerCase().includes(q)
      )
      .filter((p) => activeTag === "alle" || p.tag === activeTag)
      .sort((a, b) => (sort === "beliebt" ? b.likes - a.likes : 0));
  }, [allPosts, search, activeTag, sort, activeForum, myJahrgang]);

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

  const handleCreateForum = () => {
    if (!fName.trim()) {
      toast.error("Bitte einen Namen vergeben");
      return;
    }
    const f = createForum({
      name: fName,
      description: fDesc,
      visibility: fVisibility,
      kurs: fKurs,
      vorlesung: fVorlesung,
      professor: fProfessor,
      standort: fStandort || profile?.hochschule || undefined,
      allowedKurse: fAllowedKurse
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      jahrgang: fJahrgangOnly ? myJahrgang : undefined,
      ownerName: me,
    });
    const invitees = fInvitees.split(",").map((s) => s.trim()).filter(Boolean);
    if (invitees.length) inviteToForum(f.id, f.name, invitees, me);
    toast.success(
      invitees.length
        ? `Forum „${f.name}" erstellt · ${invitees.length} Einladung(en) versendet`
        : `Forum „${f.name}" erstellt`
    );
    resetForumForm();
    setCreateOpen(false);
    setActiveForumId(f.id);
  };

  const handleJoinByCode = () => {
    const f = joinForumByCode(joinCode.trim(), me);
    if (!f) {
      toast.error("Code ungültig");
      return;
    }
    toast.success(`Beigetreten: ${f.name}`);
    setJoinCode("");
    setJoinOpen(false);
    setActiveForumId(f.id);
  };

  const handleJoinPublic = (id: string) => {
    const f = joinForum(id, me);
    if (f) toast.success(`Beigetreten: ${f.name}`);
  };

  const handleLeave = (id: string) => {
    leaveForum(id, me);
    setActiveForumId("public");
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Forum wirklich löschen?")) return;
    deleteForum(id);
    setActiveForumId("public");
  };

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success("Code kopiert");
  };

  const tags: { id: Post["tag"] | "alle"; label: string }[] = [
    { id: "alle", label: "Alle" },
    { id: "frage", label: "Fragen" },
    { id: "lerngruppe", label: "Lerngruppen" },
    { id: "material", label: "Material" },
    { id: "diskussion", label: "Diskussionen" },
  ];

  const isMember = activeForum.isDefault || activeForum.members.includes(me);
  const isOwner = activeForum.ownerName === me;

  // Sidebar item renderer
  const ForumItem = ({ f }: { f: Forum }) => {
    const Icon = f.isDefault ? Globe : f.visibility === "public" ? Hash : Lock;
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
          {!f.isDefault && (
            <span className="text-[10px] text-muted-foreground/70 shrink-0">{f.members.length}</span>
          )}
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading font-semibold text-sm">Foren</h3>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setJoinOpen(true)}
                      title="Privatem Forum beitreten"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setCreateOpen(true)}
                      title="Neues Forum erstellen"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <ForumItem f={defaultForum} />
                </div>

                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 px-1">
                    Öffentlich
                  </p>
                  {publicForums.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-1 py-1">Keine öffentlichen Foren</p>
                  ) : (
                    <div className="space-y-0.5">
                      {publicForums.map((f) => (
                        <ForumItem key={f.id} f={f} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 px-1">
                    Privat / Gruppen
                  </p>
                  {privateForums.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-1 py-1">
                      Tritt bei via Code oder erstelle eines.
                    </p>
                  ) : (
                    <div className="space-y-0.5">
                      {privateForums.map((f) => (
                        <ForumItem key={f.id} f={f} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {!activeForum.isDefault && (
                <div className="glass-card p-4 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Aktives Forum</p>
                    <p className="font-semibold text-sm truncate">{activeForum.name}</p>
                    {activeForum.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {activeForum.description}
                      </p>
                    )}
                  </div>
                  {(activeForum.kurs || activeForum.vorlesung || activeForum.professor || activeForum.standort) && (
                    <div className="flex flex-wrap gap-1">
                      {activeForum.standort && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {activeForum.standort}
                        </span>
                      )}
                      {activeForum.kurs && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                          {activeForum.kurs}
                        </span>
                      )}
                      {activeForum.vorlesung && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/80">
                          {activeForum.vorlesung}
                        </span>
                      )}
                      {activeForum.professor && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/80">
                          Prof. {activeForum.professor}
                        </span>
                      )}
                    </div>
                  )}
                  {activeForum.visibility === "private" && (
                    <div className="rounded-lg border bg-primary/5 p-2">
                      <p className="text-[10px] text-muted-foreground mb-1">Einladungscode</p>
                      <div className="flex items-center gap-1">
                        <code className="flex-1 font-mono text-sm tracking-widest text-center py-1 rounded bg-background border">
                          {activeForum.inviteCode}
                        </code>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => handleCopy(activeForum.inviteCode)}
                        >
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
                      <Button size="sm" className="w-full" onClick={() => handleJoinPublic(activeForum.id)}>
                        Beitreten
                      </Button>
                    )}
                    {!isOwner && isMember && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleLeave(activeForum.id)}
                      >
                        Verlassen
                      </Button>
                    )}
                    {isOwner && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full text-destructive gap-1"
                        onClick={() => handleDelete(activeForum.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Löschen
                      </Button>
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
                    {activeForum.visibility === "private" && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        <Lock className="h-3 w-3" /> Privat
                      </span>
                    )}
                  </div>
                  <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight truncate">
                    {activeForum.name} <span className="text-gradient">Forum</span>
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {activeForum.isDefault
                      ? "Kurs- und standortübergreifend für alle DHBW-Studierenden"
                      : activeForum.description || "Diskussion in diesem Forum"}
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
                      <Input
                        placeholder="Titel deines Beitrags"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                      <Textarea
                        placeholder="Was möchtest du teilen?"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Kategorie</p>
                        <div className="flex flex-wrap gap-2">
                          {(["frage", "lerngruppe", "material", "diskussion"] as const).map((t) => (
                            <button
                              key={t}
                              onClick={() => setTag(t)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                tag === t
                                  ? tagStyles[t]
                                  : "text-muted-foreground bg-secondary border-transparent"
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
                            <img
                              src={sketch}
                              alt="Skizze"
                              className="max-h-40 rounded-lg border border-border bg-white"
                            />
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" variant="outline" onClick={() => setWhiteboardOpen(true)}>
                                Bearbeiten
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setSketch(undefined)} className="gap-1">
                                <X className="h-3.5 w-3.5" /> Entfernen
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setWhiteboardOpen(true)}
                            className="gap-2"
                          >
                            <Presentation className="h-4 w-4" /> Whiteboard-Skizze hinzufügen
                          </Button>
                        )}
                      </div>
                      {/* Linked public scripts */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs text-muted-foreground">Skripte verlinken (nur öffentliche)</p>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs gap-1"
                            onClick={() => setScriptPickerOpen(true)}
                          >
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
                                <span
                                  key={id}
                                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-success/10 text-success"
                                >
                                  <FileText className="h-3 w-3" />
                                  {s.title}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setLinkedScriptIds((prev) => prev.filter((x) => x !== id))
                                    }
                                    className="ml-0.5 hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowPostForm(false)}>
                          Abbrechen
                        </Button>
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
                  <Input
                    placeholder="Beiträge durchsuchen…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
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
                  const avatarColor = avatarColors[post.author.charCodeAt(0) % avatarColors.length];
                  return (
                    <motion.article
                      key={post.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() =>
                        navigate(
                          `/forum/${activeForum.isDefault ? "public" : activeForum.id}/post/${post.id}`
                        )
                      }
                      className="glass-card p-5 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`h-10 w-10 rounded-full ${avatarColor} flex items-center justify-center font-bold text-sm shrink-0`}
                        >
                          {post.author[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="text-sm font-semibold">{post.author}</span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">{post.date}</span>
                            <Badge
                              variant="outline"
                              className={`${tagStyles[post.tag]} text-[10px] py-0 h-5 ml-auto`}
                            >
                              {tagLabels[post.tag]}
                            </Badge>
                          </div>
                          <h3 className="font-heading font-semibold text-base mb-1">{post.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                          {post.sketch && (
                            <img
                              src={post.sketch}
                              alt="Whiteboard-Skizze"
                              className="mt-3 max-h-64 rounded-lg border border-border bg-white"
                            />
                          )}
                          {post.linkedScriptIds && post.linkedScriptIds.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {post.linkedScriptIds.map((id) => {
                                const s = pubScripts.find((x) => x.id === id);
                                if (!s) return null;
                                return (
                                  <Link
                                    key={id}
                                    to="/skripte"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success hover:bg-success/20"
                                  >
                                    <FileText className="h-3 w-3" />
                                    {s.title}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                          {(post.standort || post.studiengang || post.kurs || post.vorlesung || post.professor) && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {post.standort && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                  {post.standort}
                                </span>
                              )}
                              {post.studiengang && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/80 font-medium">
                                  {post.studiengang}
                                </span>
                              )}
                              {post.kurs && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-medium">
                                  {post.kurs}
                                </span>
                              )}
                              {post.vorlesung && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/80 font-medium">
                                  {post.vorlesung}
                                </span>
                              )}
                              {post.professor && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/80 font-medium">
                                  Prof. {post.professor}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLike(post.id);
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                post.liked ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                              }`}
                            >
                              <ThumbsUp className={`h-3.5 w-3.5 ${post.liked ? "fill-primary" : ""}`} />
                              {post.likes}
                            </button>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground">
                              <MessageCircle className="h-3.5 w-3.5" />
                              {post.comments?.length ?? post.replies}
                            </span>
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

      {/* Create-forum dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Neues Forum erstellen
            </DialogTitle>
            <DialogDescription>
              Erstelle ein themenbezogenes Forum. Öffentliche Foren erscheinen für alle in der Liste, private nur für eingeladene Personen oder Kurse.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Name des Forums (z. B. Mathe 2 – Prof. Müller)" value={fName} onChange={(e) => setFName(e.target.value)} />
            <Textarea
              placeholder="Kurzbeschreibung (optional)"
              value={fDesc}
              onChange={(e) => setFDesc(e.target.value)}
              rows={2}
            />
            <div className="grid sm:grid-cols-2 gap-2">
              <Input placeholder="Kurs (z. B. WWI23A)" value={fKurs} onChange={(e) => setFKurs(e.target.value)} />
              <Input
                placeholder="Vorlesung (optional)"
                value={fVorlesung}
                onChange={(e) => setFVorlesung(e.target.value)}
              />
              <Input
                placeholder="Professor (optional)"
                value={fProfessor}
                onChange={(e) => setFProfessor(e.target.value)}
              />
              <select
                value={fStandort}
                onChange={(e) => setFStandort(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Standort (optional)</option>
                {DHBW_STANDORTE.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Sichtbarkeit</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFVisibility("public")}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    fVisibility === "public"
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "text-muted-foreground bg-secondary border-transparent"
                  }`}
                >
                  <Globe className="h-4 w-4" /> Öffentlich
                </button>
                <button
                  onClick={() => setFVisibility("private")}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    fVisibility === "private"
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "text-muted-foreground bg-secondary border-transparent"
                  }`}
                >
                  <Lock className="h-4 w-4" /> Privat
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {fVisibility === "public"
                  ? "Jeder kann das Forum in der Liste sehen und beitreten."
                  : "Nur über Einladungscode oder zugelassene Kurse zugänglich."}
              </p>
            </div>
            {fVisibility === "private" && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Zugelassene Kurse (komma-getrennt, optional)</p>
                <Input
                  placeholder="z. B. WWI23A, WWI23B"
                  value={fAllowedKurse}
                  onChange={(e) => setFAllowedKurse(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Mitglieder dieser Kurse erhalten automatisch Zugriff. Zusätzlich kannst du den Einladungscode teilen.
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Personen einladen (komma-getrennt, optional)</p>
              <Input
                placeholder="z. B. Anna M., Tim K."
                value={fInvitees}
                onChange={(e) => setFInvitees(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Eingeladene Personen erhalten eine Benachrichtigung und können annehmen oder ablehnen.
              </p>
            </div>
            {myJahrgang && (
              <label className="flex items-start gap-2 rounded-lg border bg-secondary/40 p-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={fJahrgangOnly}
                  onChange={(e) => setFJahrgangOnly(e.target.checked)}
                  className="mt-1 accent-primary"
                />
                <span className="text-xs">
                  <span className="font-medium text-foreground">
                    Nur für Jahrgang {myJahrgang}
                  </span>
                  <span className="block text-muted-foreground mt-0.5">
                    Nur Studierende dieses Jahrgangs sehen und betreten dieses Forum.
                  </span>
                </span>
              </label>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreateForum}>Forum erstellen</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join dialog */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-primary" /> Forum beitreten
            </DialogTitle>
            <DialogDescription>Gib den Einladungscode ein, den du erhalten hast.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="z. B. AB12CD"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            className="font-mono text-center text-lg tracking-widest"
            maxLength={6}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setJoinOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleJoinByCode}>Beitreten</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={whiteboardOpen} onOpenChange={setWhiteboardOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Whiteboard-Skizze</DialogTitle>
          </DialogHeader>
          <Whiteboard
            height={460}
            saveLabel="Skizze übernehmen"
            onSave={(dataUrl) => {
              setSketch(dataUrl);
              setWhiteboardOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Script picker */}
      <Dialog open={scriptPickerOpen} onOpenChange={setScriptPickerOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Skripte verlinken
            </DialogTitle>
            <DialogDescription>
              Nur öffentliche Skripte aus der Bibliothek können verlinkt werden.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-1.5">
            {pubScripts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Keine öffentlichen Skripte verfügbar
              </p>
            ) : (
              pubScripts.map((s) => {
                const checked = linkedScriptIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() =>
                      setLinkedScriptIds((prev) =>
                        prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]
                      )
                    }
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
                        {s.subject} · {s.author}
                      </p>
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
};

export default ForumPage;
