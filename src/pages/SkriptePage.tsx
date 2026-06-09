import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  Eye,
  Download,
  Search,
  BookOpen,
  HardDrive,
  Filter,
  Globe,
  Lock,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { loadScripts, saveScripts, subscribeScripts, type Script } from "@/lib/scriptsStore";
import { validateSubject, validateScriptDescription } from "@/lib/validation";

const subjectColors: Record<string, string> = {
  Mathematik: "bg-info/15 text-info border-info/20",
  Informatik: "bg-primary/15 text-primary border-primary/20",
  Statistik: "bg-success/15 text-success border-success/20",
  Physik: "bg-accent/15 text-accent border-accent/20",
};

const typeColors: Record<Script["type"], string> = {
  PDF: "bg-destructive/10 text-destructive",
  DOCX: "bg-info/10 text-info",
  Notiz: "bg-success/10 text-success",
};

const SkriptePage = () => {
  const [scripts, setScripts] = useState<Script[]>(() => loadScripts());
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [activeSubject, setActiveSubject] = useState<string>("alle");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  // derive validation messages from current input so they disappear when corrected

  useEffect(() => subscribeScripts(() => setScripts(loadScripts())), []);

  const subjects = useMemo(() => {
    const set = new Set(scripts.map((s) => s.subject));
    return ["alle", ...Array.from(set)];
  }, [scripts]);

  const addScript = () => {
    const nextTitleError = title.trim().length < 3 ? "Mindestens 3 Zeichen." : "";
    const nextSubjectError = validateSubject(subject);
    const nextDescriptionError = validateScriptDescription(description);
    if (nextTitleError || nextSubjectError || nextDescriptionError) return;
    const next: Script = {
      id: Date.now().toString(),
      title,
      subject,
      description,
      author: "Du",
      date: new Date().toLocaleDateString("de-DE"),
      pages: 0,
      type: "Notiz",
      visibility,
    };
    const updated = [next, ...scripts];
    setScripts(updated);
    saveScripts(updated);
    setTitle("");
    setSubject("");
    setDescription("");
    setVisibility("public");
    setShowUpload(false);
  };

  const filtered = useMemo(() => {
    return scripts
      .filter((s) => s.visibility !== "private" || s.author === "Du")
      .filter(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.description.toLowerCase().includes(search.toLowerCase())
      )
      .filter((s) => activeSubject === "alle" || s.subject === activeSubject);
  }, [scripts, search, activeSubject]);

  const totalPages = scripts.reduce((sum, s) => sum + s.pages, 0);

  const stats = [
    {
      label: "Skripte",
      value: scripts.length,
      icon: FileText,
      bg: "bg-primary/10",
      color: "text-primary",
    },
    {
      label: "Fächer",
      value: new Set(scripts.map((s) => s.subject)).size,
      icon: BookOpen,
      bg: "bg-info/10",
      color: "text-info",
    },
    {
      label: "Seiten gesamt",
      value: totalPages,
      icon: HardDrive,
      bg: "bg-success/10",
      color: "text-success",
    },
  ];

  // derived validation messages (live) so they update/clear automatically
  const titleError = title.trim().length > 0 && title.trim().length < 3 ? "Mindestens 3 Zeichen." : "";
  const subjectError = subject.trim().length > 0 ? validateSubject(subject) : "";
  const descriptionError = description.trim().length > 0 ? validateScriptDescription(description) : "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 md:pt-24 pb-16 px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Lernmaterial</span>
              </div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
                Skript-<span className="text-gradient">Bibliothek</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                Alle Skripte und Notizen an einem Ort
              </p>
            </div>
            <Button onClick={() => setShowUpload(!showUpload)} className="gap-2">
              <Upload className="h-4 w-4" /> Hochladen
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

          {/* Upload form */}
          <AnimatePresence>
            {showUpload && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-card p-5 space-y-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Input
                        placeholder="Titel des Skripts"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                      {titleError && <p className="text-xs text-destructive">{titleError}</p>}
                    </div>
                    <div className="space-y-1">
                      <Input
                        placeholder="Fach / Modul"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                      {subjectError && <p className="text-xs text-destructive">{subjectError}</p>}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Textarea
                      placeholder="Kurze Beschreibung zum Inhalt"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                    {descriptionError && <p className="text-xs text-destructive">{descriptionError}</p>}
                  </div>
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center text-muted-foreground text-sm cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
                    <Upload className="h-8 w-8 mx-auto mb-2 opacity-60" />
                    <p className="font-medium text-foreground">Datei hierher ziehen</p>
                    <p className="text-xs mt-1">PDF, DOCX oder Bilder · max. 25 MB</p>
                  </div>
                  <div className="flex gap-2">
                    <button
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
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowUpload(false)}>
                      Abbrechen
                    </Button>
                    <Button onClick={addScript}>Skript hochladen</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Skripte durchsuchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Subject filter */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {subjects.map((s) => (
              <button
                key={s}
                onClick={() => setActiveSubject(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeSubject === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/60 text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                {s === "alle" ? "Alle Fächer" : s}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.length === 0 && (
              <div className="md:col-span-2 lg:col-span-3 glass-card p-10 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Keine Skripte gefunden</p>
              </div>
            )}
            {filtered.map((script, i) => (
              <motion.div
                key={script.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card p-5 flex flex-col hover:shadow-md hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                      subjectColors[script.subject] || "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {script.visibility === "private" && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        <Lock className="h-3 w-3" /> Privat
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        typeColors[script.type]
                      }`}
                    >
                      {script.type}
                    </span>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={`${
                    subjectColors[script.subject] || ""
                  } text-[10px] py-0 h-5 w-fit mb-2`}
                >
                  {script.subject}
                </Badge>

                <h3 className="font-heading font-semibold text-base leading-snug mb-1.5">
                  {script.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
                  {script.description}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                  <div className="min-w-0">
                    <p className="truncate">{script.author}</p>
                    <p className="text-[10px] mt-0.5">
                      {script.date}
                      {script.pages > 0 && ` · ${script.pages} S.`}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkriptePage;
