import { useState } from "react";
import { Users, Plus, Copy, Check, LogIn, Trash2, Crown, Presentation, Loader2 } from "lucide-react";
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
import Whiteboard from "@/components/Whiteboard";

interface GroupsPanelProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const GroupsPanel = ({ open, onOpenChange }: GroupsPanelProps) => {
  const { user } = useAuth();
  const rawGroups = useQuery(api.groups.listForUser);
  const createGroupMut = useMutation(api.groups.create);
  const joinByCodeMut = useMutation(api.groups.joinByCode);
  const deleteGroupMut = useMutation(api.groups.deleteGroup);

  const groups = rawGroups ?? [];
  const [view, setView] = useState<"list" | "create" | "join" | "detail">("list");
  const [activeId, setActiveId] = useState<Id<"groups"> | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"info" | "whiteboard">("info");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const active = activeId ? groups.find((g) => g._id === activeId) ?? null : null;

  const nameError = name.trim().length > 0 && name.trim().length < 3 ? "Mindestens 3 Zeichen." : "";
  const codeError = code.trim().length > 0 && code.trim().length !== 6 ? "Der Einladungscode hat 6 Zeichen." : "";

  const handleCreate = async () => {
    if (name.trim().length < 3) return;
    setCreating(true);
    try {
      const result = await createGroupMut({ name: name.trim(), description: desc.trim() });
      setName("");
      setDesc("");
      setActiveId(result.groupId as Id<"groups">);
      setView("detail");
      toast.success("Gruppe erstellt!");
    } catch {
      toast.error("Fehler beim Erstellen der Gruppe.");
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
        toast.error("Code ungültig");
        return;
      }
      setActiveId(result.groupId as Id<"groups">);
      setCode("");
      setView("detail");
      toast.success(`Beigetreten: ${result.name}`);
    } catch {
      toast.error("Fehler beim Beitreten.");
    } finally {
      setJoining(false);
    }
  };

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDelete = async (id: Id<"groups">) => {
    if (!window.confirm("Gruppe wirklich löschen?")) return;
    try {
      await deleteGroupMut({ groupId: id });
      setView("list");
      setActiveId(null);
      toast.success("Gruppe gelöscht.");
    } catch {
      toast.error("Fehler beim Löschen.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Lerngruppen
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {view === "list" && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="flex gap-2">
                <Button onClick={() => setView("create")} className="gap-2 flex-1">
                  <Plus className="h-4 w-4" /> Neue Gruppe
                </Button>
                <Button onClick={() => setView("join")} variant="outline" className="gap-2 flex-1">
                  <LogIn className="h-4 w-4" /> Beitreten
                </Button>
              </div>

              {!rawGroups ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-xl">
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">Noch keine Gruppen</p>
                  <p className="text-xs text-muted-foreground mt-1">Erstelle eine oder tritt bei mit einem Code</p>
                </div>
              ) : (
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
                          <p className="text-xs text-muted-foreground line-clamp-1">{g.description || "Keine Beschreibung"}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{g.members.length}</span>
                            <span className="font-mono px-1.5 py-0.5 rounded bg-secondary text-foreground/80">{g.inviteCode}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}

          {view === "create" && (
            <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <Input placeholder="Name (z.B. Mathe-Lerngruppe)" value={name} onChange={(e) => setName(e.target.value)} />
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
              <Textarea placeholder="Worum geht's? (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setView("list")}>Zurück</Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Erstellen
                </Button>
              </div>
            </motion.div>
          )}

          {view === "join" && (
            <motion.div key="join" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <p className="text-sm text-muted-foreground">Gib den Einladungscode ein, den du erhalten hast.</p>
              <Input
                placeholder="z.B. AB12CD"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono text-center text-lg tracking-widest"
                maxLength={6}
              />
              {codeError && <p className="text-xs text-destructive">{codeError}</p>}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setView("list")}>Zurück</Button>
                <Button onClick={handleJoin} disabled={joining}>
                  {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Beitreten
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
                  Info
                </button>
                <button
                  onClick={() => setTab("whiteboard")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium inline-flex items-center gap-1.5 ${tab === "whiteboard" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                >
                  <Presentation className="h-3.5 w-3.5" /> Whiteboard
                </button>
              </div>

              {tab === "info" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-heading font-bold text-xl">{active.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{active.description || "Keine Beschreibung"}</p>
                  </div>

                  <div className="rounded-xl border bg-primary/5 p-4">
                    <p className="text-xs text-muted-foreground mb-2 inline-flex items-center gap-1.5">
                      <Crown className="h-3 w-3 text-primary" /> Leute einladen
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
                      Teile diesen Code mit anderen, damit sie deiner Gruppe beitreten können.
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Mitglieder ({active.members.length})</p>
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
                    <Button variant="outline" onClick={() => setView("list")}>Zurück</Button>
                    {user && active.ownerId === user.id && (
                      <Button variant="ghost" onClick={() => handleDelete(active._id)} className="text-destructive gap-2">
                        <Trash2 className="h-4 w-4" /> Löschen
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {tab === "whiteboard" && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Gemeinsames Whiteboard für deine Gruppe — wird lokal gespeichert.</p>
                  <Whiteboard storageKey={`group-${active._id}`} height={420} />
                  <Button variant="outline" onClick={() => setView("list")} className="mt-3">Zurück</Button>
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
