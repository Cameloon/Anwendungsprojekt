import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Search,
  ListTodo,
  Flame,
  Trash2,
  Paperclip,
  MessageSquare,
  Upload,
  Send,
  X,
  FileText,
  Download,
  Pencil,
  Globe,
  Lock,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const categoryColors: Record<string, string> = {
  abgabe: "bg-info/15 text-info border-info/20",
  pruefung: "bg-destructive/15 text-destructive border-destructive/20",
  sonstiges: "bg-primary/15 text-primary border-primary/20",
};
const categoryDot: Record<string, string> = {
  abgabe: "bg-info",
  pruefung: "bg-destructive",
  sonstiges: "bg-primary",
};
const categoryLabels: Record<string, string> = { abgabe: "Abgabe", pruefung: "Prüfung", sonstiges: "Sonstiges" };

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface DeadlineItem {
  id: string;
  title: string;
  date: string;
  category: "abgabe" | "pruefung" | "sonstiges";
  done: boolean;
  note?: string;
  attachments: Attachment[];
  messages: { id: string; author: string; text: string; createdAt: string }[];
  visibility: "public" | "private";
  invitees: string[];
  allowedKurse: string[];
  ownerId: string;
}

type Filter = "alle" | "offen" | "erledigt" | "dringend";

const formatBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

// ── Convex production path ──

function PlannerPage() {
  const { user } = useAuth();
  const profile = useProfile();
  const me = user?.id || "";
  const displayName = profile?.display_name || "Unbekannt";

  const deadlinesQuery = useQuery(api.deadlines.listForUser);

  const createMutation = useMutation(api.deadlines.create);
  const updateMutation = useMutation(api.deadlines.update);
  const toggleDoneMutation = useMutation(api.deadlines.toggleDone);
  const deleteMutation = useMutation(api.deadlines.deleteDeadline);
  const addMessageMutation = useMutation(api.deadlines.addMessage);
  const inviteMutation = useMutation(api.notifications.inviteToDeadline);
  const generateUploadUrlMutation = useMutation(api.deadlines.generateUploadUrl);
  const attachFileMutation = useMutation(api.deadlines.attachFile);
  const deleteAttachmentMutation = useMutation(api.deadlines.deleteAttachment);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawDeadlines: any[] = (deadlinesQuery ?? []) as any[];

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<"abgabe" | "pruefung" | "sonstiges">("abgabe");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("alle");
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"files" | "forum">("files");
  const [newMessage, setNewMessage] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [inviteesInput, setInviteesInput] = useState("");
  const [allowedKurseInput, setAllowedKurseInput] = useState("");

  const deadlines: DeadlineItem[] = rawDeadlines.map((d: any) => ({
    id: d._id,
    title: d.title,
    date: d.date,
    category: d.category,
    done: d.done,
    note: d.note,
    attachments: (d.attachments ?? []).map((a: any) => ({
      id: a._id,
      name: a.name,
      size: a.size,
      type: a.type,
      url: a.url ?? "",
    })),
    messages: (d.messages ?? []).map((m: any) => ({
      id: m._id,
      author: m.authorName,
      text: m.text,
      createdAt: new Date(m._creationTime).toLocaleDateString("de-DE"),
    })),
    visibility: d.visibility,
    invitees: d.invitees ?? [],
    allowedKurse: d.allowedKurse ?? [],
    ownerId: d.ownerId,
  }));

  const resetForm = () => {
    setTitle("");
    setDate("");
    setCategory("abgabe");
    setNote("");
    setPendingAttachments([]);
    setVisibility("private");
    setInviteesInput("");
    setAllowedKurseInput("");
    setEditingId(null);
    setShowForm(false);
  };

  const parseList = (s: string) =>
    s.split(",").map((x) => x.trim()).filter(Boolean);

  const submitDeadline = async () => {
    if (!title.trim() || !date) return;
    const invitees = parseList(inviteesInput);
    const allowedKurse = parseList(allowedKurseInput);
    try {
      if (editingId) {
        await updateMutation({
          deadlineId: editingId as Id<"deadlines">,
          title: title.trim(),
          date,
          category: category as "abgabe" | "pruefung" | "sonstiges",
          note: note.trim() || undefined,
          visibility,
          invitees: invitees.length ? invitees : undefined,
          allowedKurse: allowedKurse.length ? allowedKurse : undefined,
        });
        toast.success("Termin aktualisiert");
      } else {
        const result = await createMutation({
          title: title.trim(),
          date,
          category: category as "abgabe" | "pruefung" | "sonstiges",
          note: note.trim() || undefined,
          visibility,
          invitees: invitees.length ? invitees : undefined,
          allowedKurse: allowedKurse.length ? allowedKurse : undefined,
        });
        if (invitees.length) {
          await inviteMutation({
            deadlineId: result as Id<"deadlines">,
            deadlineTitle: title.trim(),
            recipientIds: invitees,
            recipientNames: invitees,
            fromName: me,
          });
        }
        toast.success("Termin erstellt");
      }
      resetForm();
    } catch {
      toast.error("Fehler beim Speichern");
    }
  };

  const startEdit = (d: DeadlineItem) => {
    setTitle(d.title);
    setDate(d.date);
    setCategory(d.category);
    setNote(d.note ?? "");
    setVisibility(d.visibility);
    setInviteesInput(d.invitees.join(", "));
    setAllowedKurseInput(d.allowedKurse.join(", "));
    setEditingId(d.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleDone = async (id: string) => {
    try {
      await toggleDoneMutation({ deadlineId: id as Id<"deadlines"> });
    } catch {
      toast.error("Fehler beim Aktualisieren");
    }
  };

  const removeDeadline = async (id: string) => {
    if (!window.confirm("Termin wirklich löschen?")) return;
    try {
      await deleteMutation({ deadlineId: id as Id<"deadlines"> });
      if (openId === id) setOpenId(null);
      toast.success("Termin gelöscht");
    } catch {
      toast.error("Fehler beim Löschen");
    }
  };

  const addMessage = async () => {
    const text = newMessage.trim();
    if (!text || !openId) return;
    try {
      await addMessageMutation({
        deadlineId: openId as Id<"deadlines">,
        text,
      });
      setNewMessage("");
    } catch {
      toast.error("Fehler beim Senden");
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return deadlines
      .filter((d) => d.title.toLowerCase().includes(q))
      .filter((d) => {
        if (filter === "offen") return !d.done;
        if (filter === "erledigt") return d.done;
        if (filter === "dringend") {
          const diff = new Date(d.date).getTime() - Date.now();
          return !d.done && diff < 3 * 24 * 60 * 60 * 1000;
        }
        return true;
      });
  }, [deadlines, search, filter]);

  const stats = useMemo(
    () => ({
      offen: deadlines.filter((d) => !d.done).length,
      dringend: deadlines.filter((d) => {
        const diff = new Date(d.date).getTime() - Date.now();
        return !d.done && diff < 3 * 24 * 60 * 60 * 1000;
      }).length,
      erledigt: deadlines.filter((d) => d.done).length,
    }),
    [deadlines]
  );

  const openDeadline = openId ? deadlines.find((d) => d.id === openId) : null;

  return (
    <PlannerLayout
      deadlines={deadlines}
      filtered={filtered}
      stats={stats}
      title={title}
      setTitle={setTitle}
      date={date}
      setDate={setDate}
      category={category}
      setCategory={setCategory}
      note={note}
      setNote={setNote}
      editingId={editingId}
      showForm={showForm}
      setShowForm={setShowForm}
      resetForm={resetForm}
      submitDeadline={submitDeadline}
      startEdit={startEdit}
      toggleDone={toggleDone}
      removeDeadline={removeDeadline}
      search={search}
      setSearch={setSearch}
      filter={filter}
      setFilter={setFilter}
      openId={openId}
      setOpenId={setOpenId}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      addMessage={addMessage}
      pendingAttachments={pendingAttachments}
      setPendingAttachments={setPendingAttachments}
      visibility={visibility}
      setVisibility={setVisibility}
      inviteesInput={inviteesInput}
      setInviteesInput={setInviteesInput}
      allowedKurseInput={allowedKurseInput}
      setAllowedKurseInput={setAllowedKurseInput}
      openDeadline={openDeadline}
      displayName={displayName}
    />
  );
}

// ── Shared layout ──

function PlannerLayout({
  deadlines,
  filtered,
  stats,
  title,
  setTitle,
  date,
  setDate,
  category,
  setCategory,
  note,
  setNote,
  editingId,
  showForm,
  setShowForm,
  resetForm,
  submitDeadline,
  startEdit,
  toggleDone,
  removeDeadline,
  search,
  setSearch,
  filter,
  setFilter,
  openId,
  setOpenId,
  activeTab,
  setActiveTab,
  newMessage,
  setNewMessage,
  addMessage,
  pendingAttachments,
  setPendingAttachments,
  visibility,
  setVisibility,
  inviteesInput,
  setInviteesInput,
  allowedKurseInput,
  setAllowedKurseInput,
  openDeadline,
  displayName,
}: {
  deadlines: DeadlineItem[];
  filtered: DeadlineItem[];
  stats: { offen: number; dringend: number; erledigt: number };
  title: string;
  setTitle: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  category: string;
  setCategory: (v: any) => void;
  note: string;
  setNote: (v: string) => void;
  editingId: string | null;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  resetForm: () => void;
  submitDeadline: () => void;
  startEdit: (d: DeadlineItem) => void;
  toggleDone: (id: string) => void;
  removeDeadline: (id: string) => void;
  search: string;
  setSearch: (v: string) => void;
  filter: Filter;
  setFilter: (v: Filter) => void;
  openId: string | null;
  setOpenId: (v: string | null) => void;
  activeTab: "files" | "forum";
  setActiveTab: (v: "files" | "forum") => void;
  newMessage: string;
  setNewMessage: (v: string) => void;
  addMessage: () => void;
  pendingAttachments: Attachment[];
  setPendingAttachments: (v: Attachment[]) => void;
  visibility: "public" | "private";
  setVisibility: (v: "public" | "private") => void;
  inviteesInput: string;
  setInviteesInput: (v: string) => void;
  allowedKurseInput: string;
  setAllowedKurseInput: (v: string) => void;
  openDeadline: DeadlineItem | null;
  displayName: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 md:pt-24 pb-16 px-6">
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Planer</span>
              </div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
                <span className="text-gradient">Termine</span> & Abgaben
              </h1>
              <p className="text-muted-foreground mt-1">
                Behalte Fristen, Prüfungen und Abgaben im Blick.
              </p>
            </div>
            <Button onClick={() => { resetForm(); setShowForm((v) => !v); }} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" /> Neuer Termin
            </Button>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Offen", count: stats.offen, icon: ListTodo, color: "text-info" },
              { label: "Dringend", count: stats.dringend, icon: Flame, color: "text-destructive" },
              { label: "Erledigt", count: stats.erledigt, icon: CheckCircle2, color: "text-success" },
            ].map((s) => (
              <div key={s.label} className="glass-card p-4 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg bg-secondary/80 flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.count}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Create/Edit form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-card p-5 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Input placeholder="Titel (z. B. Hausarbeit Mathe)" value={title} onChange={(e) => setTitle(e.target.value)} />
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    {(["abgabe", "pruefung", "sonstiges"] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          category === c ? categoryColors[c] : "text-muted-foreground bg-secondary border-transparent"
                        }`}
                      >
                        {categoryLabels[c]}
                      </button>
                    ))}
                  </div>
                  <Textarea placeholder="Notiz (optional)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="resize-none" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Sichtbarkeit</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setVisibility("public")}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${
                          visibility === "public" ? "bg-primary/10 text-primary border-primary/30" : "text-muted-foreground bg-secondary border-transparent"
                        }`}
                      >
                        <Globe className="h-4 w-4" /> Öffentlich
                      </button>
                      <button
                        onClick={() => setVisibility("private")}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${
                          visibility === "private" ? "bg-primary/10 text-primary border-primary/30" : "text-muted-foreground bg-secondary border-transparent"
                        }`}
                      >
                        <Lock className="h-4 w-4" /> Privat
                      </button>
                    </div>
                  </div>
                  {visibility === "private" && (
                    <>
                      <Input placeholder="Einzuladende Personen (komma-getrennt)" value={inviteesInput} onChange={(e) => setInviteesInput(e.target.value)} />
                      <Input placeholder="Zugelassene Kurse (komma-getrennt, optional)" value={allowedKurseInput} onChange={(e) => setAllowedKurseInput(e.target.value)} />
                    </>
                  )}
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" onClick={resetForm}>Abbrechen</Button>
                    <Button onClick={submitDeadline}>{editingId ? "Aktualisieren" : "Erstellen"}</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search + Filter */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Termine durchsuchen…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-1 p-1 rounded-lg bg-secondary/60 w-fit">
              {(["alle", "offen", "dringend", "erledigt"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                    filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {f === "dringend" ? "Dringend" : f === "offen" ? "Offen" : f === "erledigt" ? "Erledigt" : "Alle"}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline list */}
          <div className="space-y-2">
            {filtered.length === 0 && (
              <div className="glass-card p-10 text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Keine Termine gefunden.</p>
              </div>
            )}
            {filtered.map((d) => {
              const diff = new Date(d.date).getTime() - Date.now();
              const overdue = diff < 0 && !d.done;
              const urgent = diff >= 0 && diff < 3 * 24 * 60 * 60 * 1000 && !d.done;
              const messageCount = d.messages?.length ?? 0;
              const fileCount = d.attachments?.length ?? 0;
              return (
                <motion.div
                  key={d.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`glass-card p-4 flex items-center gap-3 ${d.done ? "opacity-60" : ""}`}
                >
                  <button onClick={() => toggleDone(d.id)} className="shrink-0">
                    {d.done ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/40 hover:border-primary transition-colors" />
                    )}
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`h-2 w-2 rounded-full ${categoryDot[d.category]}`} />
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${categoryColors[d.category]}`}>
                      {categoryLabels[d.category]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium truncate ${d.done ? "line-through" : ""}`}>
                        {d.title}
                      </p>
                      {overdue && <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">Überfällig</Badge>}
                      {urgent && <Badge variant="outline" className="text-[10px] text-warning border-warning/30">Bald</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(d.date).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                      {d.visibility === "private" && (
                        <span className="inline-flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Privat
                        </span>
                      )}
                      {d.invitees.length > 0 && (
                        <span>{d.invitees.length} Eingeladene</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {fileCount > 0 && (
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50">
                        <Paperclip className="h-3 w-3" /> {fileCount}
                      </span>
                    )}
                    {messageCount > 0 && (
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50">
                        <MessageSquare className="h-3 w-3" /> {messageCount}
                      </span>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setOpenId(d.id)} title="Details">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => startEdit(d)} title="Bearbeiten">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => removeDeadline(d.id)} title="Löschen">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!openId} onOpenChange={(o) => { if (!o) setOpenId(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              {openDeadline?.title || "Termin"}
            </DialogTitle>
            <DialogDescription>
              {openDeadline && (
                <span className="inline-flex items-center gap-2">
                  <span>{new Date(openDeadline.date).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${categoryColors[openDeadline.category]}`}>
                    {categoryLabels[openDeadline.category]}
                  </span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "files" | "forum")} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mb-3">
              <TabsTrigger value="files" className="gap-1.5">
                <Paperclip className="h-4 w-4" /> Dateien
              </TabsTrigger>
              <TabsTrigger value="forum" className="gap-1.5">
                <MessageSquare className="h-4 w-4" /> Forum ({openDeadline?.messages?.length ?? 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="flex-1 overflow-y-auto space-y-3">
              {(!openDeadline || openDeadline.attachments.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-8">Keine Dateien angehängt.</p>
              )}
              {openDeadline?.attachments.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(a.size)}</p>
                  </div>
                  <a href={a.url} download className="text-primary hover:underline text-xs inline-flex items-center gap-1">
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">Datei anhängen</p>
                <label className="flex items-center justify-center gap-2 p-4 rounded-lg border border-dashed cursor-pointer hover:bg-secondary/40 transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Klicken zum Hochladen</span>
                  <input type="file" className="hidden" multiple onChange={() => {}} />
                </label>
              </div>
            </TabsContent>

            <TabsContent value="forum" className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                {(!openDeadline || openDeadline.messages.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">Keine Nachrichten.</p>
                )}
                {openDeadline?.messages.map((m) => (
                  <div key={m.id} className="p-3 rounded-lg bg-secondary/40">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">{m.author}</span>
                      <span className="text-[10px] text-muted-foreground">{m.createdAt}</span>
                    </div>
                    <p className="text-sm">{m.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Input placeholder="Nachricht schreiben…" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") addMessage(); }} />
                <Button size="icon" onClick={addMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PlannerPage;
