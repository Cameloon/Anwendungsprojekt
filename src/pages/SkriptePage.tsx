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
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { loadScripts, saveScripts, subscribeScripts, type Script } from "@/lib/scriptsStore";

const MAX_SCRIPT_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_SCRIPT_EXTENSIONS = ["pdf", "docx", "pptx", "png", "jpg", "jpeg"];
const SCRIPT_FILE_ACCEPT = ".pdf,.docx,.pptx,.png,.jpg,.jpeg";

const subjectColors: Record<string, string> = {
  Mathematik: "bg-info/15 text-info border-info/20",
  Informatik: "bg-primary/15 text-primary border-primary/20",
  Statistik: "bg-success/15 text-success border-success/20",
  Physik: "bg-accent/15 text-accent border-accent/20",
};

const typeColors: Record<Script["type"], string> = {
  PDF: "bg-destructive/10 text-destructive",
  DOCX: "bg-info/10 text-info",
  PPTX: "bg-accent/10 text-accent",
  PNG: "bg-success/10 text-success",
  JPG: "bg-success/10 text-success",
  Notiz: "bg-success/10 text-success",
};

const formatBytes = (value: number) => {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const getScriptFileType = (file: File): Script["type"] | null => {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_SCRIPT_EXTENSIONS.includes(ext)) return null;
  if (ext === "pdf") return "PDF";
  if (ext === "docx") return "DOCX";
  if (ext === "pptx") return "PPTX";
  if (ext === "jpg" || ext === "jpeg") return "JPG";
  return "PNG";
};

const SkriptePage = () => {
  const [scripts, setScripts] = useState<Script[]>(() => loadScripts());
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [activeSubject, setActiveSubject] = useState<string>("alle");
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  useEffect(() => subscribeScripts(() => setScripts(loadScripts())), []);

  const subjects = useMemo(() => {
    const set = new Set(scripts.map((s) => s.subject));
    return ["alle", ...Array.from(set)];
  }, [scripts]);

  const resetUploadForm = () => {
    setTitle("");
    setSubject("");
    setDescription("");
    setSelectedFile(null);
    setVisibility("public");
  };

  const validateSelectedFile = (file: File) => {
    const type = getScriptFileType(file);
    if (!type) {
      const message = "Ungültiger Dateityp. Erlaubt sind PDF, DOCX, PPTX, PNG und JPG.";
      setUploadState({ kind: "error", message });
      return { ok: false as const, message };
    }
    if (file.size > MAX_SCRIPT_FILE_SIZE) {
      const message = `Datei zu groß. Maximal erlaubt sind ${formatBytes(MAX_SCRIPT_FILE_SIZE)}.`;
      setUploadState({ kind: "error", message });
      return { ok: false as const, message };
    }
    return { ok: true as const, type };
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    const result = validateSelectedFile(file);
    if (!result.ok) {
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setUploadState({
      kind: "success",
      message: `Datei ausgewählt: ${file.name} (${formatBytes(file.size)})`,
    });
  };

  const addScript = () => {
    if (!title.trim() || !subject.trim() || !selectedFile) {
      setUploadState({
        kind: "error",
        message: "Bitte Titel, Fach und eine gültige Datei angeben.",
      });
      return;
    }

    const validated = validateSelectedFile(selectedFile);
    if (!validated.ok) {
      setSelectedFile(null);
      return;
    }

    const next: Script = {
      id: Date.now().toString(),
      title: title.trim(),
      subject: subject.trim(),
      description: description.trim(),
      author: "Du",
      date: new Date().toLocaleDateString("de-DE"),
      pages: 0,
      type: validated.type,
      visibility,
      fileName: selectedFile.name,
    };
    const updated = [next, ...scripts];
    setScripts(updated);
    saveScripts(updated);
    setUploadState({
      kind: "success",
      message: `"${selectedFile.name}" wurde erfolgreich hochgeladen.`,
    });
    resetUploadForm();
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
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

          <AnimatePresence>
            {uploadState && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`mb-6 rounded-xl border p-4 flex items-start gap-3 ${
                  uploadState.kind === "success"
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                }`}
              >
                {uploadState.kind === "success" ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {uploadState.kind === "success" ? "Upload erfolgreich" : "Upload abgewiesen"}
                  </p>
                  <p className="text-xs opacity-90 mt-0.5">{uploadState.message}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                    <Input
                      placeholder="Titel des Skripts"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    <Input
                      placeholder="Fach / Modul"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <Textarea
                    placeholder="Kurze Beschreibung zum Inhalt"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <label className="border-2 border-dashed border-border rounded-xl p-8 text-center text-muted-foreground text-sm cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors block">
                    <Upload className="h-8 w-8 mx-auto mb-2 opacity-60" />
                    <p className="font-medium text-foreground">Datei auswählen</p>
                    <p className="text-xs mt-1">
                      Erlaubt: PDF, DOCX, PPTX, PNG, JPG · max. {formatBytes(MAX_SCRIPT_FILE_SIZE)}
                    </p>
                    <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                      {ALLOWED_SCRIPT_EXTENSIONS.map((ext) => (
                        <span
                          key={ext}
                          className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-foreground/80"
                        >
                          .{ext}
                        </span>
                      ))}
                    </div>
                    <input
                      type="file"
                      accept={SCRIPT_FILE_ACCEPT}
                      className="hidden"
                      onChange={(e) => {
                        handleFileChange(e.target.files?.[0] ?? null);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {selectedFile && (
                    <div className="rounded-lg border bg-success/10 border-success/20 p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-success truncate">{selectedFile.name}</p>
                        <p className="text-xs text-success/80">{formatBytes(selectedFile.size)}</p>
                      </div>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px]">
                        Bereit
                      </Badge>
                    </div>
                  )}
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
                    <Button onClick={addScript} disabled={!title.trim() || !subject.trim() || !selectedFile}>
                      Skript hochladen
                    </Button>
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
                {script.fileName && (
                  <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium text-muted-foreground w-fit">
                    <FileText className="h-3 w-3" />
                    {script.fileName}
                  </div>
                )}

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
