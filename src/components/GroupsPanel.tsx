import { useState, useRef } from "react";
import { Archive, Upload, FileIcon, Users, Plus, Copy, Check, LogIn, Trash2, Crown, Presentation, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import Whiteboard from "@/components/Whiteboard";

interface GroupsPanelProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const GroupsPanel = ({ open, onOpenChange }: GroupsPanelProps) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const rawGroups = useQuery(api.groups.listForUser, {});
  const archivedGroups = useQuery(api.groups.listArchived, {});
  const createGroupMut = useMutation(api.groups.create);
  const joinByCodeMut = useMutation(api.groups.joinByCode);
  const deleteGroupMut = useMutation(api.groups.deleteGroup);
  const archiveGroupMut = useMutation(api.groups.archive);
  const unarchiveGroupMut = useMutation(api.groups.unarchive);
  const generateGroupUploadUrl = useMutation(api.groups.generateGroupUploadUrl);
  const attachGroupFileMut = useMutation(api.groups.attachGroupFile);
  const deleteGroupFileMut = useMutation(api.groups.deleteGroupFile);

  const uploadInputRef = useRef<HTMLInputElement>(null);

  const groups = rawGroups ?? [];
  const archGroups = archivedGroups ?? [];
  const [view, setView] = useState<"list" | "create" | "join" | "detail">("list");
  const [activeId, setActiveId] = useState<Id<"groups"> | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"info" | "whiteboard" | "files">("info");
  const [files, setFiles] = useState<{ _id: string; name: string; url: string; fileType: string; fileSize: number }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const active = activeId
    ? groups.find((g) => g._id === activeId) ?? archGroups.find((g) => g._id === activeId) ?? null
    : null;

  const nameError = name.trim().length > 0 && name.trim().length < 3
    ? language.match({
        english: () => "At least 3 characters.",
        german: () => "Mindestens 3 Zeichen.",
      })
    : "";
  const codeError = code.trim().length > 0 && code.trim().length !== 6
    ? language.match({
        english: () => "The invite code is 6 characters.",
        german: () => "Der Einladungscode hat 6 Zeichen.",
      })
    : "";

  const handleCreate = async () => {
    if (name.trim().length < 3) return;
    setCreating(true);
    try {
      const result = await createGroupMut({ name: name.trim(), description: desc.trim() });
      setName("");
      setDesc("");
      setActiveId(result.groupId as Id<"groups">);
      setView("detail");
      toast.success(
        language.match({
          english: () => "Group created!",
          german: () => "Gruppe erstellt!",
        })
      );
    } catch {
      toast.error(
        language.match({
          english: () => "Error creating group.",
          german: () => "Fehler beim Erstellen der Gruppe.",
        })
      );
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (code.trim().length !== 6) return;
    setJoining(true);
    try {
      const result = await joinByCodeMut({ code: code.trim().toUpperCase() });
      if (!result) {
        toast.error(
          language.match({
            english: () => "Invalid code",
            german: () => "Code ungültig",
          })
        );
        return;
      }
      setActiveId(result.groupId as Id<"groups">);
      setCode("");
      setView("detail");
      toast.success(
        language.match({
          english: () => `Joined: ${result.name}`,
          german: () => `Beigetreten: ${result.name}`,
        })
      );
    } catch {
      toast.error(
        language.match({
          english: () => "Error joining group.",
          german: () => "Fehler beim Beitreten.",
        })
      );
    } finally {
      setJoining(false);
    }
  };

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeId) return;
    setUploading(true);
    try {
      const uploadUrl = await generateGroupUploadUrl();
      const resp = await fetch(uploadUrl, {
        method: "POST",
        body: file,
      });
      const { storageId } = await resp.json();
      await attachGroupFileMut({
        groupId: activeId,
        name: file.name,
        storageId: storageId as Id<"_storage">,
        fileType: file.type || "unknown",
        fileSize: file.size,
      });
      toast.success(
        language.match({
          english: () => "File uploaded",
          german: () => "Datei hochgeladen",
        })
      );
    } catch {
      toast.error(
        language.match({
          english: () => "Error uploading",
          german: () => "Fehler beim Hochladen",
        })
      );
    } finally {
      setUploading(false);
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    }
  };

  const handleDeleteFile = async (fileId: Id<"groupFiles">) => {
    try {
      await deleteGroupFileMut({ fileId });
      toast.success(
        language.match({
          english: () => "File deleted",
          german: () => "Datei gelöscht",
        })
      );
    } catch {
      toast.error(
        language.match({
          english: () => "Error deleting file",
          german: () => "Fehler beim Löschen",
        })
      );
    }
  };

  const groupFilesQuery = useQuery(
    api.groups.getGroupFiles,
    activeId ? { groupId: activeId } : "skip"
  );
  const groupFiles = groupFilesQuery ?? [];

  const handleDelete = async (id: Id<"groups">) => {
    if (
      !window.confirm(
        language.match({
          english: () => "Really delete group?",
          german: () => "Gruppe wirklich löschen?",
        })
      )
    )
      return;
    try {
      await deleteGroupMut({ groupId: id });
      setView("list");
      setActiveId(null);
      toast.success(
        language.match({
          english: () => "Group deleted.",
          german: () => "Gruppe gelöscht.",
        })
      );
    } catch {
      toast.error(
        language.match({
          english: () => "Error deleting group.",
          german: () => "Fehler beim Löschen.",
        })
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {language.match({
              english: () => "Study Groups",
              german: () => "Lerngruppen",
            })}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {view === "list" && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="flex gap-2">
                <Button onClick={() => setView("create")} className="gap-2 flex-1">
                  <Plus className="h-4 w-4" />{" "}
                  {language.match({
                    english: () => "New Group",
                    german: () => "Neue Gruppe",
                  })}
                </Button>
                <Button onClick={() => setView("join")} variant="outline" className="gap-2 flex-1">
                  <LogIn className="h-4 w-4" />{" "}
                  {language.match({
                    english: () => "Join",
                    german: () => "Beitreten",
                  })}
                </Button>
              </div>

              {!rawGroups ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {groups.length === 0 ? (
                    <div className="text-center py-10 border border-dashed rounded-xl">
                      <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        {language.match({
                          english: () => "No groups yet",
                          german: () => "Noch keine Gruppen",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {language.match({
                          english: () => "Create one or join with a code",
                          german: () => "Erstelle eine oder tritt bei mit einem Code",
                        })}
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">
                        {language.match({
                          english: () => "Active Groups",
                          german: () => "Aktive Gruppen",
                        })}
                      </p>
                      <ul className="space-y-2">
                        {groups.map((g) => (
                          <li
                            key={g._id}
                            onClick={() => {
                              setActiveId(g._id);
                              setTab("info");
                              setView("detail");
                            }}
                            className="p-4 rounded-xl border hover:border-primary/40 hover:bg-secondary/40 cursor-pointer transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold truncate">{g.name}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {g.description ||
                                    language.match({
                                      english: () => "No description",
                                      german: () => "Keine Beschreibung",
                                    })}
                                </p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{g.members.length}</span>
                                  <span className="font-mono px-1.5 py-0.5 rounded bg-secondary text-foreground/80">{g.inviteCode}</span>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {archGroups.length > 0 && (
                    <>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Archive className="h-3 w-3" />{" "}
                        {language.match({
                          english: () => "Archived Groups",
                          german: () => "Archivierte Gruppen",
                        })}
                      </p>
                      <ul className="space-y-2">
                        {archGroups.map((g) => (
                          <li
                            key={g._id}
                            onClick={() => {
                              setActiveId(g._id);
                              setTab("info");
                              setView("detail");
                            }}
                            className="p-4 rounded-xl border border-dashed opacity-70 hover:opacity-100 hover:border-primary/40 hover:bg-secondary/40 cursor-pointer transition-all"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold truncate">{g.name}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {g.description ||
                                    language.match({
                                      english: () => "No description",
                                      german: () => "Keine Beschreibung",
                                    })}
                                </p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{g.members.length}</span>
                                  <Archive className="h-3 w-3" />
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {view === "create" && (
            <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <Input
                placeholder={language.match({
                  english: () => "Name (e.g. Math study group)",
                  german: () => "Name (z.B. Mathe-Lerngruppe)",
                })}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
              <Textarea
                placeholder={language.match({
                  english: () => "What's it about? (optional)",
                  german: () => "Worum geht's? (optional)",
                })}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setView("list")}>
                  {language.match({
                    english: () => "Back",
                    german: () => "Zurück",
                  })}
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {language.match({
                    english: () => "Create",
                    german: () => "Erstellen",
                  })}
                </Button>
              </div>
            </motion.div>
          )}

          {view === "join" && (
            <motion.div key="join" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {language.match({
                  english: () => "Enter the invite code you received.",
                  german: () => "Gib den Einladungscode ein, den du erhalten hast.",
                })}
              </p>
              <Input
                placeholder={language.match({
                  english: () => "e.g. AB12CD",
                  german: () => "z.B. AB12CD",
                })}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono text-center text-lg tracking-widest"
                maxLength={6}
              />
              {codeError && <p className="text-xs text-destructive">{codeError}</p>}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setView("list")}>
                  {language.match({
                    english: () => "Back",
                    german: () => "Zurück",
                  })}
                </Button>
                <Button onClick={handleJoin} disabled={joining}>
                  {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {language.match({
                    english: () => "Join",
                    german: () => "Beitreten",
                  })}
                </Button>
              </div>
            </motion.div>
          )}

          {view === "detail" && active && (
            <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="flex gap-1 p-1 rounded-lg bg-secondary/60 w-fit">
                <button
                  onClick={() => setTab("info")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === "info" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                >
                  {language.match({
                    english: () => "Info",
                    german: () => "Info",
                  })}
                </button>
                <button
                  onClick={() => setTab("files")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium inline-flex items-center gap-1.5 ${tab === "files" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                >
                  <Upload className="h-3.5 w-3.5" />{" "}
                  {language.match({
                    english: () => "Files",
                    german: () => "Dateien",
                  })}
                </button>
                <button
                  onClick={() => setTab("whiteboard")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium inline-flex items-center gap-1.5 ${tab === "whiteboard" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                >
                  <Presentation className="h-3.5 w-3.5" />{" "}
                  {language.match({
                    english: () => "Whiteboard",
                    german: () => "Whiteboard",
                  })}
                </button>
              </div>

              {tab === "info" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-heading font-bold text-xl">{active.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {active.description ||
                        language.match({
                          english: () => "No description",
                          german: () => "Keine Beschreibung",
                        })}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-primary/5 p-4">
                    <p className="text-xs text-muted-foreground mb-2 inline-flex items-center gap-1.5">
                      <Crown className="h-3 w-3 text-primary" />{" "}
                      {language.match({
                        english: () => "Invite People",
                        german: () => "Leute einladen",
                      })}
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 font-mono text-lg tracking-widest text-center py-2 rounded bg-background border">
                        {active.inviteCode}
                      </code>
                      <Button size="icon" variant="outline" onClick={() => handleCopy(active.inviteCode)}>
                        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {language.match({
                        english: () => "Share this code so others can join your group.",
                        german: () => "Teile diesen Code mit anderen, damit sie deiner Gruppe beitreten können.",
                      })}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {language.match({
                        english: () => "Members",
                        german: () => "Mitglieder",
                      })} ({active.members.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {active.members.map((m) => (
                        <span key={m.userId} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-sm">
                          <span className="h-5 w-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                            {m.displayName[0]}
                          </span>
                          {m.displayName}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-between pt-2">
                    <Button variant="outline" onClick={() => setView("list")}>
                      {language.match({
                        english: () => "Back",
                        german: () => "Zurück",
                      })}
                    </Button>
                    <div className="flex gap-2">
                      {user && active.ownerId === user.id && (
                        active.archived ? (
                          <Button variant="outline" onClick={async () => { try { await unarchiveGroupMut({ groupId: active._id }); toast.success(language.match({ english: () => "Group restored", german: () => "Gruppe wiederhergestellt" })); } catch { toast.error(language.match({ english: () => "Error", german: () => "Fehler" })); } }} className="gap-2">
                            <Archive className="h-4 w-4" />{" "}
                            {language.match({
                              english: () => "Undo",
                              german: () => "Rückgängig",
                            })}
                          </Button>
                        ) : (
                          <Button variant="outline" onClick={async () => { try { await archiveGroupMut({ groupId: active._id }); setView("list"); toast.success(language.match({ english: () => "Group archived", german: () => "Gruppe archiviert" })); } catch { toast.error(language.match({ english: () => "Error", german: () => "Fehler" })); } }} className="gap-2">
                            <Archive className="h-4 w-4" />{" "}
                            {language.match({
                              english: () => "Archive",
                              german: () => "Archivieren",
                            })}
                          </Button>
                        )
                      )}
                      {user && active.ownerId === user.id && (
                        <Button variant="ghost" onClick={() => handleDelete(active._id)} className="text-destructive gap-2">
                          <Trash2 className="h-4 w-4" />{" "}
                          {language.match({
                            english: () => "Delete",
                            german: () => "Löschen",
                          })}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {tab === "files" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {language.match({
                      english: () => "Files in this group",
                      german: () => "Dateien in dieser Gruppe",
                    })}
                  </p>
                  <input
                    ref={uploadInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => uploadInputRef.current?.click()} disabled={uploading}>
                    <Upload className="h-4 w-4" />{" "}
                    {uploading
                      ? language.match({
                          english: () => "Uploading...",
                          german: () => "Lädt...",
                        })
                      : language.match({
                          english: () => "Upload File",
                          german: () => "Datei hochladen",
                        })}
                  </Button>
                  {groupFiles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {language.match({
                        english: () => "No files",
                        german: () => "Keine Dateien",
                      })}
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {groupFiles.map((f) => (
                        <div key={f._id} className="flex items-center gap-2 p-2 rounded-lg border">
                          <FileIcon className="h-4 w-4 text-primary shrink-0" />
                          <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm truncate hover:text-primary">
                            {f.name}
                          </a>
                          <span className="text-[10px] text-muted-foreground">{(f.fileSize / 1024).toFixed(0)} KB</span>
                          {user && (f.uploadedBy === user.id || active.ownerId === user.id) && (
                            <button onClick={() => handleDeleteFile(f._id as Id<"groupFiles">)} className="text-destructive hover:text-destructive/80">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" onClick={() => setView("list")}>
                    {language.match({
                      english: () => "Back",
                      german: () => "Zurück",
                    })}
                  </Button>
                </div>
              )}

              {tab === "whiteboard" && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {language.match({
                      english: () => "Shared whiteboard for your group — saved locally.",
                      german: () => "Gemeinsames Whiteboard für deine Gruppe — wird lokal gespeichert.",
                    })}
                  </p>
                  <Whiteboard storageKey={`group-${active._id}`} height={420} />
                  <Button variant="outline" onClick={() => setView("list")} className="mt-3">
                    {language.match({
                      english: () => "Back",
                      german: () => "Zurück",
                    })}
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default GroupsPanel;
