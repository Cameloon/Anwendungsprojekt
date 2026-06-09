import { useEffect, useMemo, useState, useContext } from "react";
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
import { toast } from "@/hooks/use-toast";
import { addPost as addForumPost } from "@/lib/forumStore";
import { inviteToDeadline } from "@/lib/notificationsStore";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { validateTitle, validateDate, validateMessage } from "@/lib/validation";




import { useLanguage } from "@/hooks/useLanguage";


interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface ForumMessage {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface Deadline {
  id: string;
  title: string;
  date: string;
  category: "abgabe" | "pruefung" | "sonstiges";
  done: boolean;
  note?: string;
  attachments: Attachment[];
  messages: ForumMessage[];
  visibility: "public" | "private";
  invitees: string[];        // display names
  allowedKurse: string[];    // course codes (auto-invite course)
}

const categoryColors = {
  abgabe: "bg-info/15 text-info border-info/20",
  pruefung: "bg-destructive/15 text-destructive border-destructive/20",
  sonstiges: "bg-primary/15 text-primary border-primary/20",
};

const categoryDot = {
  abgabe: "bg-info",
  pruefung: "bg-destructive",
  sonstiges: "bg-primary",
};

const categoryLabels = { abgabe: "Abgabe", pruefung: "Prüfung", sonstiges: "Sonstiges" };

const initialDeadlines: Deadline[] = [
  { id: "1", title: "Hausarbeit Mathematik", date: "2026-04-25", category: "abgabe", done: false, attachments: [], messages: [], visibility: "private", invitees: [], allowedKurse: [] },
  { id: "2", title: "Klausur Informatik", date: "2026-05-10", category: "pruefung", done: false, attachments: [], messages: [], visibility: "public", invitees: [], allowedKurse: [] },
  { id: "3", title: "Projektabgabe Software Engineering", date: "2026-04-30", category: "abgabe", done: false, attachments: [], messages: [], visibility: "private", invitees: [], allowedKurse: ["WWI23A"] },
  { id: "4", title: "Übungsblatt Datenbanken", date: "2026-04-22", category: "abgabe", done: true, attachments: [], messages: [], visibility: "private", invitees: [], allowedKurse: [] },
];

type Filter = "alle" | "offen" | "erledigt" | "dringend";

const formatBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};









const PlannerPage = () => {
  const { user } = useAuth();
  const profile = useProfile();
  const { language } = useLanguage();
  const me = profile?.display_name || "Du";
  const [deadlines, setDeadlines] = useState<Deadline[]>(initialDeadlines);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<Deadline["category"]>("abgabe");
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
  // derived validation so errors update/clear automatically

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
    // derived errors will clear when inputs are reset
  };

  const parseList = (s: string) =>
    s.split(",").map((x) => x.trim()).filter(Boolean);

  const submitDeadline = () => {
    const nextTitleError = validateTitle(title);
    const nextDateError = validateDate(date);
    if (nextTitleError || nextDateError) return;
    const invitees = parseList(inviteesInput);
    const allowedKurse = parseList(allowedKurseInput);
    let targetId = editingId;
    let prevInvitees: string[] = [];
    if (editingId) {
      const existing = deadlines.find((d) => d.id === editingId);
      prevInvitees = existing?.invitees ?? [];
      setDeadlines((prev) =>
        prev.map((d) =>
          d.id === editingId
            ? {
                ...d,
                title,
                date,
                category,
                note: note.trim() || undefined,
                attachments: pendingAttachments,
                visibility,
                invitees,
                allowedKurse,
              }
            : d
        )
      );
      toast({ title: "Termin aktualisiert" });
    } else {
      targetId = Date.now().toString();
      setDeadlines((prev) => [
        ...prev,
        {
          id: targetId!,
          title,
          date,
          category,
          done: false,
          note: note.trim() || undefined,
          attachments: pendingAttachments,
          messages: [],
          visibility,
          invitees,
          allowedKurse,
        },
      ]);
    }
    // Send invitations to NEW invitees only
    const newInvitees = invitees.filter((x) => !prevInvitees.includes(x));
    if (targetId && newInvitees.length) {
      inviteToDeadline(targetId, title, newInvitees, me);
      toast({
        title: `${newInvitees.length} Einladung(en) gesendet`,
        //description: "Eingeladene Personen werden benachrichtigt.",
        description: language.match(
          {
            english: () => {return "Invited people will get notified"},
            german: () => {return "Eingeladene Personen werden benachrichtigt"},
          }
        ),
      });
    }
    resetForm();
  };

  const startEdit = (d: Deadline) => {
    setEditingId(d.id);
    setTitle(d.title);
    setDate(d.date);
    setCategory(d.category);
    setNote(d.note ?? "");
    setPendingAttachments(d.attachments);
    setVisibility(d.visibility);
    setInviteesInput(d.invitees.join(", "));
    setAllowedKurseInput(d.allowedKurse.join(", "));
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePendingUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newAttachments: Attachment[] = Array.from(files).map((f) => ({
      id: `${Date.now()}-${f.name}`,
      name: f.name,
      size: f.size,
      type: f.type,
      url: URL.createObjectURL(f),
    }));
    setPendingAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removePendingAttachment = (attachId: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== attachId));
  };

  const toggleDone = (id: string) =>
    setDeadlines((prev) => prev.map((d) => (d.id === id ? { ...d, done: !d.done } : d)));

  const removeDeadline = (id: string) =>
    setDeadlines((prev) => prev.filter((d) => d.id !== id));

  const daysUntil = (date: string) =>
    Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);

  const handleFileUpload = (id: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newAttachments: Attachment[] = Array.from(files).map((f) => ({
      id: `${Date.now()}-${f.name}`,
      name: f.name,
      size: f.size,
      type: f.type,
      url: URL.createObjectURL(f),
    }));
    setDeadlines((prev) =>
      prev.map((d) => (d.id === id ? { ...d, attachments: [...d.attachments, ...newAttachments] } : d))
    );
    toast({ title: "Datei(en) hochgeladen", description: `${files.length} Datei(en) hinzugefügt` });
  };

  const removeAttachment = (deadlineId: string, attachId: string) => {
    setDeadlines((prev) =>
      prev.map((d) =>
        d.id === deadlineId ? { ...d, attachments: d.attachments.filter((a) => a.id !== attachId) } : d
      )
    );
  };

  const addMessage = (id: string) => {
    if (newMessage.trim().length < 5) return;
    const text = newMessage.trim();
    const msg: ForumMessage = {
      id: Date.now().toString(),
      author: "Du",
      text,
      createdAt: new Date().toISOString(),
    };
    const target = deadlines.find((d) => d.id === id);
    setDeadlines((prev) =>
      prev.map((d) => (d.id === id ? { ...d, messages: [...d.messages, msg] } : d))
    );
    // Mirror into the main Forum so all task-forum messages are stored & visible there
    if (target) {
      addForumPost({
        id: `planner-${msg.id}`,
        author: "Du",
        title: `Aufgabe: ${target.title}`,
        content: text,
        date: "gerade eben",
        likes: 0,
        replies: 0,
        tag: "diskussion",
        vorlesung: target.title,
        source: "planner",
        taskId: target.id,
      });
      toast({ title: "Im Forum gespeichert", description: "Beitrag ist nun auch im Forum sichtbar." });
    }
    setNewMessage("");
  };

  const filtered = useMemo(() => {
    return [...deadlines]
      .filter((d) => d.title.toLowerCase().includes(search.toLowerCase()))
      .filter((d) => {
        if (filter === "offen") return !d.done;
        if (filter === "erledigt") return d.done;
        if (filter === "dringend") return !d.done && daysUntil(d.date) <= 3;
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [deadlines, search, filter]);

  const open = deadlines.filter((d) => !d.done);
  const urgent = open.filter((d) => daysUntil(d.date) <= 3 && daysUntil(d.date) >= 0);
  const done = deadlines.filter((d) => d.done);

  const stats = [
    { label: "Offen", value: open.length, icon: ListTodo, color: "text-primary", bg: "bg-primary/10" },
    { label: "Dringend", value: urgent.length, icon: Flame, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Erledigt", value: done.length, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  ];

  const filters: { id: Filter; label: string }[] = [
    { id: "alle", label: "Alle" },
    { id: "offen", label: "Offen" },
    { id: "dringend", label: "Dringend" },
    { id: "erledigt", label: "Erledigt" },
  ];

  const activeDeadline = deadlines.find((d) => d.id === openId) || null;

  // derived validation messages
  const titleError = validateTitle(title);
  const dateError = date ? validateDate(date) : "";
  const messageError = validateMessage(newMessage);

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
                <span className="text-sm text-muted-foreground">
                  {language.match(
                    {
                      english: () => {return "Appointments & Deadlines"},
                      german: () => {return "Termine & Deadlines"},
                    }
                  )}
                </span>
              </div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
                Termin-<span className="text-gradient">Planner</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                {language.match(
                  {
                    english: () => {return "Keep an eye on all of your Tests and Assignments"},
                    german: () => {return "Behalte alle Abgaben und Prüfungen im Blick"},
                  }
                )}

              </p>
            </div>
            <Button onClick={() => (showForm ? resetForm() : setShowForm(true))} className="gap-2">
              <Plus className="h-4 w-4" /> Neuer Termin
            </Button>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.05 }}
                className="glass-card p-4 flex items-center gap-3"
              >
                <div className={`h-10 w-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="font-heading text-2xl font-bold leading-none">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-card p-5 space-y-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    <Input
                      placeholder="Titel des Termins"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  {titleError && <p className="text-xs text-destructive">{titleError}</p>}
                  {dateError && <p className="text-xs text-destructive">{dateError}</p>}
                  <div className="flex flex-wrap gap-2">
                    {(["abgabe", "pruefung", "sonstiges"] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          category === c
                            ? categoryColors[c]
                            : "text-muted-foreground bg-secondary border-transparent"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${categoryDot[c]}`} />
                        {categoryLabels[c]}
                      </button>
                    ))}
                  </div>

                  <Textarea
                    placeholder="Notiz (optional) — z. B. Details, Themen, Räume…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />

                  {/* Visibility */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Sichtbarkeit</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setVisibility("public")}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          visibility === "public"
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "text-muted-foreground bg-secondary border-transparent"
                        }`}
                      >
                        <Globe className="h-4 w-4" /> Öffentlich
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisibility("private")}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          visibility === "private"
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "text-muted-foreground bg-secondary border-transparent"
                        }`}
                      >
                        <Lock className="h-4 w-4" /> Privat
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {visibility === "public"
                        ? "Für alle DHBW-Studierenden sichtbar."
                        : "Nur für eingeladene Personen oder zugelassene Kurse sichtbar."}
                    </p>
                  </div>

                  {visibility === "private" && (
                    <div className="grid sm:grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Personen einladen</p>
                        <Input
                          placeholder="z. B. Anna M., Tim K."
                          value={inviteesInput}
                          onChange={(e) => setInviteesInput(e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">Komma-getrennt</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Kurse einladen</p>
                        <Input
                          placeholder="z. B. WWI23A, WWI23B"
                          value={allowedKurseInput}
                          onChange={(e) => setAllowedKurseInput(e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">Komma-getrennt</p>
                      </div>
                    </div>
                  )}

                  {/* Attachments while creating/editing */}
                  <div className="space-y-2">
                    <label
                      htmlFor="upload-new"
                      className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-colors"
                    >
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <p className="text-xs font-medium">Dateien hochladen</p>
                      <p className="text-[11px] text-muted-foreground">Optional</p>
                      <input
                        id="upload-new"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          handlePendingUpload(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {pendingAttachments.length > 0 && (
                      <div className="space-y-1.5">
                        {pendingAttachments.map((a) => (
                          <div key={a.id} className="flex items-center gap-2 p-2 rounded-md bg-secondary/40">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{a.name}</p>
                              <p className="text-[10px] text-muted-foreground">{formatBytes(a.size)}</p>
                            </div>
                            <button
                              onClick={() => removePendingAttachment(a.id)}
                              className="p-1 rounded hover:bg-background text-muted-foreground hover:text-destructive"
                              aria-label="Entfernen"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={resetForm}>
                      Abbrechen
                    </Button>
                    <Button onClick={submitDeadline}>
                      {editingId ? "Speichern" : "Hinzufügen"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filters + Search */}
          <div className="flex flex-col md:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Termine durchsuchen…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1 p-1 rounded-lg bg-secondary/60 w-fit">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filter === f.id
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="space-y-2.5">
            {filtered.length === 0 && (
              <div className="glass-card p-10 text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Keine Termine gefunden</p>
              </div>
            )}
            {filtered.map((d, i) => {
              const days = daysUntil(d.date);
              const isUrgent = days <= 3 && days >= 0 && !d.done;
              const isOverdue = days < 0 && !d.done;
              const due = new Date(d.date);
              return (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`glass-card p-4 flex items-center gap-4 group hover:shadow-md transition-all ${
                    d.done ? "opacity-60" : ""
                  } ${isUrgent ? "border-destructive/40" : ""} ${
                    isOverdue ? "border-destructive/60 bg-destructive/5" : ""
                  }`}
                >
                  {/* Date chip */}
                  <div
                    className={`flex flex-col items-center justify-center h-14 w-14 rounded-xl shrink-0 ${
                      d.done
                        ? "bg-secondary text-muted-foreground"
                        : isUrgent || isOverdue
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-semibold leading-none">
                      {due.toLocaleDateString("de-DE", { month: "short" })}
                    </span>
                    <span className="font-heading text-xl font-bold leading-none mt-1">
                      {due.getDate()}
                    </span>
                  </div>

                  {/* Check */}
                  <button
                    onClick={() => toggleDone(d.id)}
                    className="shrink-0"
                    aria-label="Als erledigt markieren"
                  >
                    <CheckCircle2
                      className={`h-6 w-6 transition-colors ${
                        d.done
                          ? "text-success"
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${d.done ? "line-through" : ""}`}>
                      {d.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`${categoryColors[d.category]} text-[10px] py-0 h-5`}
                      >
                        {categoryLabels[d.category]}
                      </Badge>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${
                          d.visibility === "public"
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary text-muted-foreground"
                        }`}
                        title={
                          d.visibility === "public"
                            ? "Öffentlich"
                            : `Privat${
                                d.invitees.length || d.allowedKurse.length
                                  ? ` • ${[...d.invitees, ...d.allowedKurse].join(", ")}`
                                  : ""
                              }`
                        }
                      >
                        {d.visibility === "public" ? (
                          <Globe className="h-3 w-3" />
                        ) : (
                          <Lock className="h-3 w-3" />
                        )}
                        {d.visibility === "public" ? "Öffentlich" : "Privat"}
                      </span>
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {due.toLocaleDateString("de-DE")}
                      </span>
                      {!d.done && (
                        <span
                          className={`text-xs font-medium ${
                            isOverdue
                              ? "text-destructive"
                              : isUrgent
                                ? "text-destructive"
                                : "text-muted-foreground"
                          }`}
                        >
                          {isOverdue
                            ? `${Math.abs(days)} Tage überfällig`
                            : days === 0
                              ? "Heute"
                              : `in ${days} ${days === 1 ? "Tag" : "Tagen"}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick actions: files + forum */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setOpenId(d.id);
                        setActiveTab("files");
                      }}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Dateien"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      {d.attachments.length > 0 && <span>{d.attachments.length}</span>}
                    </button>
                    <button
                      onClick={() => {
                        setOpenId(d.id);
                        setActiveTab("forum");
                      }}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Forum"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      {d.messages.length > 0 && <span>{d.messages.length}</span>}
                    </button>
                  </div>

                  {(isUrgent || isOverdue) && (
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                  <button
                    onClick={() => startEdit(d)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                    aria-label="Bearbeiten"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeDeadline(d.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    aria-label="Löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail dialog: files + forum */}
      <Dialog open={!!openId} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="max-w-2xl">
          {activeDeadline && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${categoryDot[activeDeadline.category]}`} />
                  {activeDeadline.title}
                </DialogTitle>
                <DialogDescription>
                  {new Date(activeDeadline.date).toLocaleDateString("de-DE", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </DialogDescription>
              </DialogHeader>

              {activeDeadline.note && (
                <div className="rounded-lg bg-secondary/40 p-3 text-sm whitespace-pre-wrap">
                  {activeDeadline.note}
                </div>
              )}
              <div className="flex justify-end -mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    setOpenId(null);
                    startEdit(activeDeadline);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Termin bearbeiten
                </Button>
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "files" | "forum")}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="files" className="gap-2">
                    <Paperclip className="h-4 w-4" />
                    Dateien ({activeDeadline.attachments.length})
                  </TabsTrigger>
                  <TabsTrigger value="forum" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Forum ({activeDeadline.messages.length})
                  </TabsTrigger>
                </TabsList>

                {/* Files tab */}
                <TabsContent value="files" className="space-y-3 mt-4">
                  <label
                    htmlFor={`upload-${activeDeadline.id}`}
                    className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-colors"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm font-medium">Dateien hochladen</p>
                    <p className="text-xs text-muted-foreground">Klicken oder Dateien hierher ziehen</p>
                    <input
                      id={`upload-${activeDeadline.id}`}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(activeDeadline.id, e.target.files)}
                    />
                  </label>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {activeDeadline.attachments.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Noch keine Dateien hochgeladen
                      </p>
                    )}
                    {activeDeadline.attachments.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 group"
                      >
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{a.name}</p>
                          <p className="text-xs text-muted-foreground">{formatBytes(a.size)}</p>
                        </div>
                        <a
                          href={a.url}
                          download={a.name}
                          className="p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => removeAttachment(activeDeadline.id, a.id)}
                          className="p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Forum tab */}
                <TabsContent value="forum" className="space-y-3 mt-4">
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {activeDeadline.messages.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Noch keine Beiträge — starte die Diskussion!
                      </p>
                    )}
                    {activeDeadline.messages.map((m) => (
                      <div key={m.id} className="p-3 rounded-lg bg-secondary/40">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold">{m.author}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(m.createdAt).toLocaleString("de-DE", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </p>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 items-end pt-2 border-t">
                    <Textarea
                      placeholder="Schreibe einen Beitrag…"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                    {messageError && <p className="text-xs text-destructive">{messageError}</p>}
                    <Button
                      onClick={() => addMessage(activeDeadline.id)}
                      disabled={!newMessage.trim()}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlannerPage;
