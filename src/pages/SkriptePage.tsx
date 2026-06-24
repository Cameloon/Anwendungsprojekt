import { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  Download,
  Search,
  BookOpen,
  HardDrive,
  Filter,
  Globe,
  Lock,
  Trash2,
  Loader2,
  X,
  File,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  validateSubject,
  validateScriptDescription,
  validateFileSize,
  FILE_MAX_BYTES,
} from "@/lib/validation";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
];

function inferScriptType(file: File): "PDF" | "DOCX" | "Notiz" {
  if (file.type === "application/pdf") return "PDF";
  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "DOCX";
  return "Notiz";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const subjectColors: Record<string, string> = {
  Mathematik: "bg-info/15 text-info border-info/20",
  Informatik: "bg-primary/15 text-primary border-primary/20",
  Statistik: "bg-success/15 text-success border-success/20",
  Physik: "bg-accent/15 text-accent border-accent/20",
};

const typeColors: Record<string, string> = {
  PDF: "bg-destructive/10 text-destructive",
  DOCX: "bg-info/10 text-info",
  Notiz: "bg-success/10 text-success",
};

interface ScriptItem {
  id: string;
  title: string;
  subject: string;
  description: string;
  authorName: string;
  authorId: string;
  date: string;
  pages: number;
  type: "PDF" | "DOCX" | "Notiz";
  visibility: "public" | "private";
  url?: string;
  fileName?: string;
}

const SkriptePage = () => {
  const { user } = useAuth();
  const profile = useProfile();
  const me = user?.id || "";
  const displayName = profile?.display_name || "Unbekannt";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scriptsQuery = useQuery(api.scripts.listVisible);

  const createMutation = useMutation(api.scripts.create);
  const deleteMutation = useMutation(api.scripts.deleteScript);
  const generateUploadUrlMutation = useMutation(api.scripts.generateUploadUrl);

  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [activeSubject, setActiveSubject] = useState<string>("alle");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawScripts: any[] = (scriptsQuery ?? []) as any[];

  const scripts: ScriptItem[] = rawScripts.map((s: any) => ({
    id: s._id,
    title: s.title,
    subject: s.subject,
    description: s.description,
    authorName: s.authorName,
    authorId: s.authorId,
    date: new Date(s._creationTime).toLocaleDateString("de-DE"),
    pages: s.pages,
    type: s.type,
    visibility: s.visibility,
    url: s.url,
    fileName: s.fileName,
  }));

  const subjects = useMemo(() => {
    const set = new Set(scripts.map((s) => s.subject));
    return ["alle", ...Array.from(set)];
  }, [scripts]);

  const handleFileSelect = (file: File | null) => {
    setFileError("");
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError("Nur PDF, DOCX und Bilder (PNG, JPG, WebP) sind erlaubt.");
      return;
    }
    const sizeErr = validateFileSize(file.size);
    if (sizeErr) {
      setFileError(sizeErr);
      return;
    }
    setSelectedFile(file);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0] ?? null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0] ?? null);
  };

  const addScript = async () => {
    const nextTitleError = title.trim().length < 3 ? "Mindestens 3 Zeichen." : "";
    const nextSubjectError = validateSubject(subject);
    const nextDescriptionError = validateScriptDescription(description);
    if (nextTitleError || nextSubjectError || nextDescriptionError) return;

    if (!selectedFile) {
      try {
        await createMutation({
          title: title.trim(),
          subject: subject.trim(),
          description: description.trim(),
          pages: 0,
          type: "Notiz",
          visibility,
        });
        toast.success("Skript erstellt");
      } catch {
        toast.error("Fehler beim Erstellen");
      }
      resetForm();
      return;
    }

    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrlMutation();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });
      if (!result.ok) throw new Error("Upload fehlgeschlagen");
      const { storageId } = (await result.json()) as { storageId: Id<"_storage"> };

      await createMutation({
        title: title.trim(),
        subject: subject.trim(),
        description: description.trim(),
        pages: 0,
        type: inferScriptType(selectedFile),
        visibility,
        storageId,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
      });
      toast.success("Skript hochgeladen");
    } catch {
      toast.error("Fehler beim Hochladen");
    }
    setUploading(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setSubject("");
    setDescription("");
    setVisibility("public");
    setShowUpload(false);
    setSelectedFile(null);
    setFileError("");
  };

  const removeScript = async (id: string) => {
    if (!window.confirm("Skript wirklich löschen?")) return;
    try {
      await deleteMutation({ scriptId: id as Id<"scripts"> });
      toast.success("Skript gelöscht");
    } catch {
      toast.error("Fehler beim Löschen");
    }
  };

  const filtered = useMemo(() => {
    return scripts
      .filter((s) => s.visibility !== "private" || s.authorId === me)
      .filter(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.description.toLowerCase().includes(search.toLowerCase())
      )
      .filter((s) => activeSubject === "alle" || s.subject === activeSubject);
  }, [scripts, search, activeSubject, me]);

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
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center text-muted-foreground text-sm cursor-pointer transition-colors ${
                      dragging
                        ? "border-primary border-solid bg-primary/10"
                        : selectedFile
                          ? "border-primary/40 bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
                      onChange={onFileInputChange}
                      className="hidden"
                    />
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <File className="h-6 w-6 text-primary" />
                        <div className="text-left">
                          <p className="font-medium text-foreground truncate max-w-[300px]">
                            {selectedFile.name}
                          </p>
                          <p className="text-[10px] mt-0.5">
                            {formatFileSize(selectedFile.size)} · {inferScriptType(selectedFile)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            setFileError("");
                          }}
                          className="p-1 rounded-full hover:bg-secondary transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto mb-2 opacity-60" />
                        <p className="font-medium text-foreground">Datei hierher ziehen</p>
                        <p className="text-xs mt-1">PDF, DOCX oder Bilder · max. 25 MB</p>
                      </>
                    )}
                  </div>
                  {fileError && <p className="text-xs text-destructive">{fileError}</p>}
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
                    <Button variant="outline" onClick={resetForm} disabled={uploading}>
                      Abbrechen
                    </Button>
                    <Button onClick={addScript} disabled={uploading}>
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Lädt hoch…
                        </>
                      ) : selectedFile ? (
                        <>
                          <Upload className="h-4 w-4 mr-1" /> Skript hochladen
                        </>
                      ) : (
                        "Als Notiz speichern"
                      )}
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

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                  <div className="min-w-0">
                    <p className="truncate">{script.authorName}</p>
                    <p className="text-[10px] mt-0.5">
                      {script.date}
                      {script.pages > 0 && ` · ${script.pages} S.`}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {script.url && (
                      <a href={script.url} target="_blank" download className="inline-flex">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    {script.authorId === me && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeScript(script.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
