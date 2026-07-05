import { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileText,
  Upload,
  Download,
  Search,
  BookOpen,
  Filter,
  Globe,
  Lock,
  Users,
  GraduationCap,
  Trash2,
  Loader2,
  X,
  File,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BackToTopButton from "@/components/BackToTopButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { validateScriptDescription, validateFileSize } from "@/lib/validation";
import Combobox from "@/components/ui/combobox";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/webp",
];

function inferScriptType(file: File): "PDF" | "DOCX" | "PPTX" | "Notiz" {
  if (file.type === "application/pdf") return "PDF";
  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "DOCX";
  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  )
    return "PPTX";
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
  PPTX: "bg-accent/10 text-accent",
  Notiz: "bg-success/10 text-success",
};

type Visibility = "public" | "private" | "jahrgang" | "group";

interface ScriptItem {
  id: string;
  title: string;
  subject: string;
  description: string;
  authorName: string;
  authorId: string;
  date: string;
  pages: number;
  type: "PDF" | "DOCX" | "PPTX" | "Notiz";
  visibility: Visibility;
  url?: string;
  fileName?: string;
  forumId?: string;
}

const SkriptePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { language } = useLanguage();
  const me = user?.id || "";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dismissedQueryScriptId = useRef<string | null>(null);
  const scriptsQuery = useQuery(api.scripts.listVisible);
  const lecturesQuery = useQuery(api.semesterLectures.getLecturesForMyKurs);
  const privateForumsQuery = useQuery(api.forums.getPrivateForumsForUser, {});
  const lectures = lecturesQuery ?? [];
  const privateForums = privateForumsQuery ?? [];
  const lectureOptions = lectures.map((l) => ({
    value: l._id,
    label: l.lectureName,
  }));
  const forumOptions = privateForums.map((f) => ({
    value: f._id,
    label: f.name,
  }));

  const createMutation = useMutation(api.scripts.create);
  const deleteMutation = useMutation(api.scripts.deleteScript);
  const generateUploadUrlMutation = useMutation(api.scripts.generateUploadUrl);
  const discardUploadMutation = useMutation(api.scripts.discardUpload);

  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [lectureId, setLectureId] = useState("");
  const [description, setDescription] = useState("");
  const [pages, setPages] = useState("");
  const [search, setSearch] = useState("");
  const [activeSubject, setActiveSubject] = useState<string>("alle");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [forumId, setForumId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState("");
  const [openScriptId, setOpenScriptId] = useState<string | null>(null);

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
    forumId: s.forumId,
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
      setFileError(
        language.match({ english: () => "Only PDF, DOCX, PPTX and images (PNG, JPG, WebP) are allowed.", german: () => "Nur PDF, DOCX, PPTX und Bilder (PNG, JPG, WebP) sind erlaubt." }),
      );
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

  const subjectArg = lectureId
    ? ({
        type: "lecture" as const,
        lectureId: lectureId as Id<"semesterLectures">,
      } as const)
    : "";

  const addScript = async () => {
    if (uploading) return;

    const nextTitleError =
      title.trim().length < 3 ? language.match({ english: () => "At least 3 characters.", german: () => "Mindestens 3 Zeichen." }) : "";
    const nextDescriptionError = validateScriptDescription(description);
    if (nextTitleError || nextDescriptionError) return;

    if (!lectureId) {
      toast.error(language.match({ english: () => "Please select a subject / module.", german: () => "Bitte ein Fach / Modul auswählen." }));
      return;
    }

    if (visibility === "group" && !forumId) {
      toast.error(language.match({ english: () => "Please select a forum.", german: () => "Bitte ein Forum auswählen." }));
      return;
    }

    const forumArg =
      visibility === "group" ? (forumId as Id<"forums">) : undefined;
    const pagesNum = Number(pages);
    const pagesArg = Number.isFinite(pagesNum) && pagesNum > 0 ? Math.floor(pagesNum) : 0;

    if (!selectedFile) {
      setUploading(true);
      try {
        await createMutation({
          title: title.trim(),
          subject: subjectArg,
          description: description.trim(),
          pages: pagesArg,
          type: "Notiz",
          visibility,
          forumId: forumArg,
        });
        toast.success(language.match({ english: () => "Script created", german: () => "Skript erstellt" }));
        resetForm();
      } catch (e: any) {
        toast.error(e?.message ?? language.match({ english: () => "Error creating script", german: () => "Fehler beim Erstellen" }));
      }
      setUploading(false);
      return;
    }

    setUploading(true);
    let storageId: Id<"_storage"> | null = null;
    try {
      const uploadUrl = await generateUploadUrlMutation();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });
      if (!result.ok) throw new Error(language.match({ english: () => "Upload failed", german: () => "Upload fehlgeschlagen" }));
      ({ storageId } = (await result.json()) as { storageId: Id<"_storage"> });

      await createMutation({
        title: title.trim(),
        subject: subjectArg,
        description: description.trim(),
        pages: pagesArg,
        type: inferScriptType(selectedFile),
        visibility,
        storageId,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        forumId: forumArg,
      });
      toast.success(language.match({ english: () => "Script uploaded", german: () => "Skript hochgeladen" }));
      resetForm();
    } catch (e: any) {
      toast.error(e?.message ?? language.match({ english: () => "Error uploading", german: () => "Fehler beim Hochladen" }));
      // Datei wurde bereits hochgeladen, aber nie einem Skript zugeordnet —
      // aufräumen, damit kein verwaister Storage-Blob zurückbleibt.
      if (storageId) {
        discardUploadMutation({ storageId }).catch(() => {
          // Best effort — kein zusätzlicher Nutzerhinweis nötig
        });
      }
    }
    setUploading(false);
  };

  const resetForm = () => {
    setTitle("");
    setLectureId("");
    setDescription("");
    setPages("");
    setVisibility("public");
    setForumId("");
    setShowUpload(false);
    setSelectedFile(null);
    setFileError("");
  };

  const removeScript = async (id: string) => {
    if (!window.confirm(language.match({ english: () => "Really delete script?", german: () => "Skript wirklich löschen?" }))) return;
    try {
      await deleteMutation({ scriptId: id as Id<"scripts"> });
      toast.success(language.match({ english: () => "Script deleted", german: () => "Skript gelöscht" }));
    } catch {
      toast.error(language.match({ english: () => "Error deleting", german: () => "Fehler beim Löschen" }));
    }
  };

  const filtered = useMemo(() => {
    return scripts
      .filter(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.description.toLowerCase().includes(search.toLowerCase()),
      )
      .filter((s) => activeSubject === "alle" || s.subject === activeSubject);
  }, [scripts, search, activeSubject, me]);

  const openScript = openScriptId
    ? (scripts.find((script) => script.id === openScriptId) ?? null)
    : null;

  useEffect(() => {
    const scriptFromQuery = searchParams.get("script");
    if (!scriptFromQuery) return;
    // Nutzer hat den Dialog für genau diesen Script-Parameter bereits geschlossen —
    // nicht erneut öffnen, auch wenn dieser Effekt (z. B. durch eine Convex-
    // Reactivity-Aktualisierung von `scripts`) erneut feuert, bevor der
    // URL-Parameter tatsächlich entfernt wurde.
    if (dismissedQueryScriptId.current === scriptFromQuery) return;

    const matchedScript = scripts.find(
      (script) => script.id === scriptFromQuery,
    );
    if (matchedScript && openScriptId !== scriptFromQuery) {
      setOpenScriptId(scriptFromQuery);
      setActiveSubject(matchedScript.subject);
    }
  }, [openScriptId, scripts, searchParams]);

  const stats = [
    {
      label: language.match({ english: () => "Scripts", german: () => "Skripte" }),
      value: scripts.length,
      icon: FileText,
      bg: "bg-primary/10",
      color: "text-primary",
    },
    {
      label: language.match({ english: () => "Subjects", german: () => "Fächer" }),
      value: new Set(scripts.map((s) => s.subject)).size,
      icon: BookOpen,
      bg: "bg-info/10",
      color: "text-info",
    },
  ];

  // derived validation messages (live) so they update/clear automatically
  const titleError =
    title.trim().length > 0 && title.trim().length < 3
      ? language.match({ english: () => "At least 3 characters.", german: () => "Mindestens 3 Zeichen." })
      : "";
  const descriptionError =
    description.trim().length > 0 ? validateScriptDescription(description) : "";

  const visibilityLabels: Record<Visibility, string> = {
    public: language.match({ english: () => "Public", german: () => "Öffentlich" }),
    private: language.match({ english: () => "Private", german: () => "Privat" }),
    jahrgang: language.match({ english: () => "Course", german: () => "Kurs" }),
    group: language.match({ english: () => "Group", german: () => "Gruppe" }),
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <BackToTopButton />
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
                <span className="text-sm text-muted-foreground">
                  {language.match({ english: () => "Study Material", german: () => "Lernmaterial" })}
                </span>
              </div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
                {language.match({ english: () => "Script ", german: () => "Skript-" })}<span className="text-gradient">{language.match({ english: () => "Library", german: () => "Bibliothek" })}</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                {language.match({ english: () => "All scripts and notes in one place", german: () => "Alle Skripte und Notizen an einem Ort" })}
              </p>
            </div>
            <Button
              onClick={() => setShowUpload(!showUpload)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" /> {language.match({ english: () => "Upload", german: () => "Hochladen" })}
            </Button>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.05 }}
                className="glass-card p-4 flex items-center gap-3"
              >
                <div
                  className={`h-10 w-10 rounded-lg ${s.bg} flex items-center justify-center`}
                >
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="font-heading text-2xl font-bold leading-none">
                    {s.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {s.label}
                  </p>
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
                        placeholder={language.match({ english: () => "Script Title", german: () => "Titel des Skripts" })}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                      {titleError && (
                        <p className="text-xs text-destructive">{titleError}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Combobox
                        value={lectureId}
                        onChange={setLectureId}
                        options={lectureOptions}
                        placeholder={language.match({ english: () => "Select subject / module", german: () => "Fach / Modul auswählen" })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Textarea
                      placeholder={language.match({ english: () => "Brief description of the content", german: () => "Kurze Beschreibung zum Inhalt" })}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                    {descriptionError && (
                      <p className="text-xs text-destructive">
                        {descriptionError}
                      </p>
                    )}
                  </div>
                  <div className="w-full md:w-40">
                    <Input
                      type="number"
                      min={0}
                      placeholder={language.match({ english: () => "Pages (optional)", german: () => "Seitenzahl (optional)" })}
                      value={pages}
                      onChange={(e) => setPages(e.target.value)}
                    />
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        fileInputRef.current?.click();
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
                      accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp"
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
                            {formatFileSize(selectedFile.size)} ·{" "}
                            {inferScriptType(selectedFile)}
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
                        <p className="font-medium text-foreground">
                          {language.match({ english: () => "Drag file here", german: () => "Datei hierher ziehen" })}
                        </p>
                        <p className="text-xs mt-1">
                          {language.match({ english: () => "PDF, DOCX, PPTX or images · max 25 MB", german: () => "PDF, DOCX, PPTX oder Bilder · max. 25 MB" })}
                        </p>
                      </>
                    )}
                  </div>
                  {fileError && (
                    <p className="text-xs text-destructive">{fileError}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { value: "public", label: visibilityLabels.public, icon: Globe },
                        { value: "private", label: visibilityLabels.private, icon: Lock },
                        { value: "jahrgang", label: visibilityLabels.jahrgang, icon: GraduationCap },
                        { value: "group", label: visibilityLabels.group, icon: Users },
                      ] as const
                    ).map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setVisibility(value)}
                        className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          visibility === value
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "text-muted-foreground bg-secondary border-transparent"
                        }`}
                      >
                        <Icon className="h-4 w-4" /> {label}
                      </button>
                    ))}
                  </div>
                  {visibility === "group" && (
                    <Combobox
                      value={forumId}
                      onChange={setForumId}
                      options={forumOptions}
                      placeholder={language.match({ english: () => "Select group", german: () => "Gruppe auswählen" })}
                    />
                  )}
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={resetForm}
                      disabled={uploading}
                    >
                      {language.match({ english: () => "Cancel", german: () => "Abbrechen" })}
                    </Button>
                    <Button onClick={addScript} disabled={uploading}>
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" /> {language.match({ english: () => "Uploading…", german: () => "Lädt hoch…" })}
                        </>
                      ) : selectedFile ? (
                        <>
                          <Upload className="h-4 w-4 mr-1" /> {language.match({ english: () => "Upload Script", german: () => "Skript hochladen" })}
                        </>
                      ) : (
                        language.match({ english: () => "Save as Note", german: () => "Als Notiz speichern" })
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
              placeholder={language.match({ english: () => "Search scripts…", german: () => "Skripte durchsuchen…" })}
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
                {s === "alle" ? language.match({ english: () => "All Subjects", german: () => "Alle Fächer" }) : s}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.length === 0 && (
              <div className="md:col-span-2 lg:col-span-3 glass-card p-10 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">{language.match({ english: () => "No scripts found", german: () => "Keine Skripte gefunden" })}</p>
              </div>
            )}
            {filtered.map((script, i) => (
              <motion.div
                key={script.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card p-5 flex flex-col hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer"
                onClick={() => setOpenScriptId(script.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                      subjectColors[script.subject] ||
                      "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {script.visibility === "private" && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        <Lock className="h-3 w-3" /> {visibilityLabels.private}
                      </span>
                    )}
                    {script.visibility === "jahrgang" && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        <GraduationCap className="h-3 w-3" /> {visibilityLabels.jahrgang}
                      </span>
                    )}
                    {script.visibility === "group" && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        <Users className="h-3 w-3" /> {visibilityLabels.group}
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
                    <p className="text-[10px] mt-0.5">{script.date}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {script.url && (
                      <a
                        href={script.url}
                        target="_blank"
                        download
                        className="inline-flex"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                        onClick={(e) => {
                          e.stopPropagation();
                          removeScript(script.id);
                        }}
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

      <Dialog
        open={!!openScriptId}
        onOpenChange={(open) => {
          if (!open) {
            setOpenScriptId(null);
            if (searchParams.get("script")) {
              dismissedQueryScriptId.current = searchParams.get("script");
              const nextParams = new URLSearchParams(searchParams);
              nextParams.delete("script");
              setSearchParams(nextParams, { replace: true });
            }
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{openScript?.title || language.match({ english: () => "Script", german: () => "Skript" })}</DialogTitle>
            <DialogDescription>
              {openScript
                ? `${openScript.subject} · ${openScript.authorName} · ${openScript.date}`
                : language.match({ english: () => "Script details", german: () => "Details zum Skript" })}
            </DialogDescription>
          </DialogHeader>

          {openScript && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{openScript.subject}</Badge>
                <Badge variant="outline">{openScript.type}</Badge>
                <Badge variant="outline">{visibilityLabels[openScript.visibility]}</Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                {openScript.description || language.match({ english: () => "No description available.", german: () => "Keine Beschreibung vorhanden." })}
              </p>

              <div className="flex items-center justify-between rounded-xl border p-3 text-sm">
                <div>
                  <p className="font-medium">
                    {openScript.fileName || openScript.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                  {openScript.pages > 0
                    ? `${openScript.pages} ${language.match({ english: () => "Pages", german: () => "Seiten" })}`
                    : language.match({ english: () => "Note or file without page count", german: () => "Notiz oder Datei ohne Seitenangabe" })}
                  </p>
                </div>
                {openScript.url && (
                  <a href={openScript.url} target="_blank" download>
                    <Button className="gap-2">
                      <Download className="h-4 w-4" />
                      {language.match({ english: () => "Open", german: () => "Öffnen" })}
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SkriptePage;
