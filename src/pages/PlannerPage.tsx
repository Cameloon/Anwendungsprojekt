import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Check,
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
  GraduationCap,
  Archive,
  ChevronDown,
  MoreVertical,
  Users,
  Bell,
  Filter as FilterIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { TITLE_MAX } from "@/lib/validation";

import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const categoryColors: Record<string, string> = {
  abgabe: "bg-info/15 text-info border-info/20",
  pruefung: "bg-destructive/15 text-destructive border-destructive/20",
  sonstiges: "bg-primary/15 text-primary border-primary/20",
};
const tCategoryLabels: Record<string, string> = { abgabe: "Abgabe", pruefung: "Prüfung", sonstiges: "Sonstiges" };

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground border-border",
  med: "bg-warning/15 text-warning border-warning/20",
  high: "bg-destructive/15 text-destructive border-destructive/20",
};
const tPriorityLabels: Record<string, string> = { low: "Niedrig", med: "Mittel", high: "Hoch" };

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy?: string;
}

interface DeadlineMessage {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

import { useLanguage } from "@/hooks/useLanguage";

interface DeadlineItem {
  id: string;
  title: string;
  date: string;
  time?: string;
  remindBefore?: number[];
  category: "abgabe" | "pruefung" | "sonstiges";
  done: boolean;
  note?: string;
  vorlesung?: string;
  priority: "low" | "med" | "high";
  attachments: Attachment[];
  messageCount: number;
  visibility: "public" | "private";
  invitees: string[];
  allowedKurse: string[];
  linkedScriptIds?: string[];
  linkedGroupIds?: string[];
  ownerId: string;
}

type Filter = "alle" | "offen" | "erledigt" | "dringend" | "ueberfaellig";

const URGENT_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

const endOfDay = (dateStr: string) => new Date(dateStr + "T23:59:59").getTime();

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
  const { language } = useLanguage();
  const navigate = useNavigate();
  const displayName = profile?.display_name || language.match({ english: () => "Unknown", german: () => "Unbekannt" });

  const deadlinesQuery = useQuery(api.deadlines.listForUser);
  const lecturesQuery = useQuery(api.semesterLectures.getLecturesForMyKurs, {});
  const kursPeopleQuery = useQuery(api.profiles.listSameKurs, {});
  const scriptsQuery = useQuery(api.scripts.listVisible);
  const groupsQuery = useQuery(api.forums.getPrivateForumsForUser, {});

  const createMutation = useMutation(api.deadlines.create);
  const updateMutation = useMutation(api.deadlines.update);
  const toggleDoneMutation = useMutation(api.deadlines.toggleDone);
  const acceptDeadlineMutation = useMutation(api.deadlines.acceptDeadline);
  const declineDeadlineMutation = useMutation(api.deadlines.declineDeadline);
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
  const [time, setTime] = useState("");
  const [remindBefore, setRemindBefore] = useState<number[]>([]);
  const [category, setCategory] = useState<"abgabe" | "pruefung" | "sonstiges">("abgabe");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("alle");
  const [activeVorlesung, setActiveVorlesung] = useState<string>("alle");
  const [activePriority, setActivePriority] = useState<string>("alle");
  const [openId, setOpenId] = useState<string | null>(null);
  const openAttachmentsQuery = useQuery(
    api.deadlines.getAttachments,
    openId ? { deadlineId: openId as Id<"deadlines"> } : "skip"
  );
  const openAttachments: Attachment[] = (openAttachmentsQuery ?? []).map((a) => ({
    id: a._id,
    name: a.name,
    size: a.size,
    type: a.type,
    url: a.url ?? "",
    uploadedBy: a.uploadedBy,
  }));
  const openMessagesQuery = useQuery(
    api.deadlines.getMessages,
    openId ? { deadlineId: openId as Id<"deadlines"> } : "skip"
  );
  const openMessages: DeadlineMessage[] = (openMessagesQuery ?? []).map((m) => ({
    id: m._id,
    author: m.authorName,
    text: m.text,
    createdAt: new Date(m._creationTime).toLocaleDateString("de-DE"),
  }));
  const [doneOpen, setDoneOpen] = useState(true);
  const [archiveOpen, setArchiveOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"files" | "forum" | "discussion">("files");
  const deadlineForumQuery = useQuery(
    api.forums.getForDeadline,
    openId ? { deadlineId: openId as Id<"deadlines"> } : "skip"
  );
  const deadlineForum = deadlineForumQuery ?? null;
  const deadlineForumPostsQuery = useQuery(
    api.posts.listByForum,
    deadlineForum ? { forumId: deadlineForum._id } : "skip"
  );
  const deadlineForumPosts = deadlineForumPostsQuery ?? [];
  const [showCreateForum, setShowCreateForum] = useState(false);
  const createForumForDeadline = useMutation(api.forums.createForDeadline);
  const [newMessage, setNewMessage] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [linkedScriptIds, setLinkedScriptIds] = useState<string[]>([]);
  const [linkedGroupIds, setLinkedGroupIds] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [vorlesung, setVorlesung] = useState("");
  const [priority, setPriority] = useState<"low" | "med" | "high">("med");
  const [inviteeSearch, setInviteeSearch] = useState("");
  const [selectedInvitees, setSelectedInvitees] = useState<{ userId: string; displayName: string }[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [showPastWarning, setShowPastWarning] = useState(false);
  const pastDateConfirmed = useRef(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deadlines: DeadlineItem[] = rawDeadlines.map((d: any) => ({
    id: d._id,
    title: d.title,
    date: d.date,
    time: d.time,
    remindBefore: Array.isArray(d.remindBefore) ? d.remindBefore : d.remindBefore != null ? [d.remindBefore] : [],
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
    messageCount: d.messageCount ?? 0,
    visibility: d.visibility,
    vorlesung: d.vorlesung,
    priority: d.priority ?? "med",
    invitees: d.invitees ?? [],
    allowedKurse: d.allowedKurse ?? [],
    linkedScriptIds: d.linkedScriptIds ?? [],
    linkedGroupIds: d.linkedGroupIds ?? [],
    ownerId: d.ownerId,
  }));

  const resetForm = () => {
    setTitle("");
    setDate("");
    setTime("");
    setRemindBefore([]);
    setCategory("abgabe");
    setNote("");
    setPendingAttachments([]);
    setLinkedScriptIds([]);
    setLinkedGroupIds([]);
    setVisibility("private");
    setVorlesung("");
    setPriority("med");
    setInviteeSearch("");
    setSelectedInvitees([]);
    setEditingId(null);
    setShowForm(false);
    pastDateConfirmed.current = false;
    setShowPastWarning(false);
  };

  const selectInvitee = (p: { userId: string; displayName: string }) => {
    setSelectedInvitees((prev) => [...prev, p]);
    setInviteeSearch("");
    setHighlightIndex(0);
  };

  const getFilteredInvitees = () =>
    (kursPeopleQuery ?? []).filter(
      (p: { userId: string; displayName: string }) =>
        p.displayName.toLowerCase().includes(inviteeSearch.toLowerCase()) &&
        !selectedInvitees.some((s) => s.userId === p.userId),
    );

  const handleInviteeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const filtered = getFilteredInvitees().slice(0, 8);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length > 0) {
        const idx = Math.min(highlightIndex, filtered.length - 1);
        selectInvitee(filtered[idx]);
      }
    } else if (e.key === "Escape") {
      setInviteeSearch("");
      setHighlightIndex(0);
    }
  };

  const submitDeadline = async () => {
    if (isSubmitting) return;
    if (!title.trim() || !date || (!vorlesung && category !== "sonstiges")) {
      //"Bitte ein Datum wählen"
      if (!date) toast.error(
        language.match({
          english: () => "please choose a date",
          german: () => "Bitte ein Datum wählen",
        })
      );
      else if (!vorlesung && category !== "sonstiges") toast.error(language.match({ english: () => "Please select a lecture", german: () => "Bitte eine Vorlesung auswählen" }));
      else toast.error(language.match({ english: () => "Please enter a title", german: () => "Bitte einen Titel eingeben" }));
      return;
    }
    if (title.trim().length > TITLE_MAX) {
      return;
    }
    let inviteeIds = visibility === "private" ? selectedInvitees.map((s) => s.userId) : [];
    const inviteeNames = visibility === "private" ? selectedInvitees.map((s) => s.displayName) : [];

    if (editingId && visibility === "private") {
      const existing = deadlines.find((d) => d.id === editingId);
      if (existing) {
        inviteeIds = [...new Set([...(existing.invitees ?? []), ...inviteeIds])];
      }
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const selectedDate = new Date(date + "T23:59:59");
    if (selectedDate < today && !pastDateConfirmed.current) {
      setShowPastWarning(true);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateMutation({
          deadlineId: editingId as Id<"deadlines">,
          title: title.trim(),
          date,
          time: time || undefined,
          remindBefore: remindBefore.length ? remindBefore : undefined,
          category: category as "abgabe" | "pruefung" | "sonstiges",
          note: note.trim() || undefined,
          vorlesung: vorlesung || undefined,
          priority,
          visibility,
          invitees: inviteeIds.length ? inviteeIds : undefined,
          linkedScriptIds: linkedScriptIds.length ? (linkedScriptIds as Id<"scripts">[]) : undefined,
          linkedGroupIds: linkedGroupIds.length ? (linkedGroupIds as Id<"forums">[]) : undefined,
        });
        if (inviteeIds.length) {
          const existingInvitees = (deadlines.find((d) => d.id === editingId)?.invitees ?? []);
          const newIds = inviteeIds.filter((id) => !existingInvitees.includes(id));
          if (newIds.length) {
            const newNames = newIds.map((id) => selectedInvitees.find((s) => s.userId === id)?.displayName ?? id);
            await inviteMutation({
              deadlineId: editingId as Id<"deadlines">,
              deadlineTitle: title.trim(),
              recipientIds: newIds,
              recipientNames: newNames,
              fromName: displayName,
            });
          }
        }
        toast.success(language.match({ english: () => "Deadline updated", german: () => "Termin aktualisiert" }));
      } else {
        const result = await createMutation({
          title: title.trim(),
          date,
          time: time || undefined,
          remindBefore: remindBefore.length ? remindBefore : undefined,
          category: category as "abgabe" | "pruefung" | "sonstiges",
          note: note.trim() || undefined,
          vorlesung: vorlesung || undefined,
          priority,
          visibility,
          invitees: inviteeIds.length ? inviteeIds : undefined,
          linkedScriptIds: linkedScriptIds.length ? (linkedScriptIds as Id<"scripts">[]) : undefined,
          linkedGroupIds: linkedGroupIds.length ? (linkedGroupIds as Id<"forums">[]) : undefined,
        });
        if (inviteeIds.length) {
          await inviteMutation({
            deadlineId: result as Id<"deadlines">,
            deadlineTitle: title.trim(),
            recipientIds: inviteeIds,
            recipientNames: inviteeNames,
            fromName: displayName,
          });
        }
        toast.success(language.match({ english: () => "Deadline created", german: () => "Termin erstellt" }));
      }
      resetForm();
    } catch {
      toast.error(language.match({ english: () => "Error saving", german: () => "Fehler beim Speichern" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (d: DeadlineItem) => {
    setTitle(d.title);
    setDate(d.date);
    setTime(d.time ?? "");
    setRemindBefore(Array.isArray(d.remindBefore) ? d.remindBefore : []);
    setCategory(d.category);
    setNote(d.note ?? "");
    setLinkedScriptIds(d.linkedScriptIds ?? []);
    setLinkedGroupIds(d.linkedGroupIds ?? []);
    setVorlesung(d.vorlesung ?? "");
    setVisibility(d.visibility);
    setPriority(d.priority ?? "med");
    const people = kursPeopleQuery ?? [];
    setSelectedInvitees(
      (d.invitees ?? []).map((id: string) => ({
        userId: id,
        displayName: people.find((p: { userId: string; displayName: string }) => p.userId === id)?.displayName ?? id,
      })),
    );
    setEditingId(d.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleDone = async (id: string) => {
    try {
      await toggleDoneMutation({ deadlineId: id as Id<"deadlines"> });
    } catch {
      toast.error(language.match({ english: () => "Error updating", german: () => "Fehler beim Aktualisieren" }));
    }
  };

  const removeDeadline = async (id: string) => {
    if (!window.confirm(language.match({ english: () => "Really delete deadline?", german: () => "Termin wirklich löschen?" }))) return;
    try {
      await deleteMutation({ deadlineId: id as Id<"deadlines"> });
      if (openId === id) setOpenId(null);
      toast.success(language.match({ english: () => "Deadline deleted", german: () => "Termin gelöscht" }));
    } catch {
      toast.error(language.match({ english: () => "Error deleting", german: () => "Fehler beim Löschen" }));
    }
  };

  const declineInvite = async (id: string) => {
    try {
      await declineDeadlineMutation({ deadlineId: id as Id<"deadlines"> });
      toast.success(language.match({ english: () => "Declined", german: () => "Abgelehnt" }));
    } catch {
      toast.error(language.match({ english: () => "Error", german: () => "Fehler" }));
    }
  };

  const acceptInvite = async (id: string) => {
    try {
      await acceptDeadlineMutation({ deadlineId: id as Id<"deadlines"> });
      toast.success(language.match({ english: () => "Deadline accepted — own copy created", german: () => "Termin angenommen — eigene Kopie erstellt" }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : language.match({ english: () => "Error accepting", german: () => "Fehler beim Annehmen" }));
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
      toast.error(language.match({ english: () => "Error sending", german: () => "Fehler beim Senden" }));
    }
  };

  const handleAttachFiles = async (files: FileList | null) => {
    if (!files || !openId) return;
    for (const file of Array.from(files)) {
      try {
        const uploadUrl = await generateUploadUrlMutation();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!result.ok) throw new Error("Upload fehlgeschlagen");
        const { storageId } = (await result.json()) as { storageId: Id<"_storage"> };
        await attachFileMutation({
          deadlineId: openId as Id<"deadlines">,
          name: file.name,
          size: file.size,
          type: file.type,
          storageId,
        });
      } catch (e) {
        toast.error(
          e instanceof Error
            ? e.message
            : language.match({ english: () => "Error uploading", german: () => "Fehler beim Hochladen" })
        );
      }
    }
  };

  const removeAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachmentMutation({ attachmentId: attachmentId as Id<"deadlineAttachments"> });
    } catch {
      toast.error(language.match({ english: () => "Error deleting", german: () => "Fehler beim Löschen" }));
    }
  };

  const vorlesungen = useMemo(() => {
    const set = new Set(deadlines.map((d) => d.vorlesung).filter(Boolean) as string[]);
    return ["alle", ...Array.from(set)];
  }, [deadlines]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return deadlines
      .filter((d) => d.title.toLowerCase().includes(q))
      .filter((d) => activeVorlesung === "alle" || d.vorlesung === activeVorlesung)
      .filter((d) => activePriority === "alle" || d.priority === activePriority)
      .filter((d) => {
        if (filter === "offen") return !d.done;
        if (filter === "erledigt") return d.done;
        if (filter === "dringend") {
          const diff = endOfDay(d.date) - Date.now();
          return !d.done && diff >= 0 && diff < URGENT_WINDOW_MS;
        }
        if (filter === "ueberfaellig") {
          const diff = endOfDay(d.date) - Date.now();
          return !d.done && diff < 0;
        }
        return true;
      });
  }, [deadlines, search, filter, activeVorlesung, activePriority]);

  const stats = useMemo(
    () => ({
      offen: deadlines.filter((d) => !d.done).length,
      dringend: deadlines.filter((d) => {
        const diff = endOfDay(d.date) - Date.now();
        return !d.done && diff >= 0 && diff < URGENT_WINDOW_MS;
      }).length,
      ueberfaellig: deadlines.filter((d) => {
        const diff = endOfDay(d.date) - Date.now();
        return !d.done && diff < 0;
      }).length,
      erledigt: deadlines.filter((d) => d.done).length,
    }),
    [deadlines]
  );

  const openDeadline = openId ? deadlines.find((d) => d.id === openId) : null;

  useEffect(() => {
    const deadlineFromQuery = searchParams.get("deadline");
    if (!deadlineFromQuery || deadlines.length === 0) return;

    const matchingDeadline = deadlines.find((deadline) => deadline.id === deadlineFromQuery);
    if (!matchingDeadline) return;

    setOpenId((current) => (current === deadlineFromQuery ? current : deadlineFromQuery));
  }, [deadlines, searchParams]);

  const closeDeadlineDetails = () => {
    setOpenId(null);

    if (!searchParams.get("deadline")) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("deadline");
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <>
    <PlannerLayout
      deadlines={deadlines}
      filtered={filtered}
      stats={stats}
      title={title}
      setTitle={setTitle}
      date={date}
      setDate={(v) => { setDate(v); pastDateConfirmed.current = false; setShowPastWarning(false); }}
      time={time}
      setTime={setTime}
      remindBefore={remindBefore}
      setRemindBefore={setRemindBefore}
      category={category}
      setCategory={setCategory}
      note={note}
      setNote={setNote}
      editingId={editingId}
      showForm={showForm}
      setShowForm={setShowForm}
      resetForm={resetForm}
      submitDeadline={submitDeadline}
      isSubmitting={isSubmitting}
      startEdit={startEdit}
      toggleDone={toggleDone}
      removeDeadline={removeDeadline}
      declineInvite={declineInvite}
      acceptInvite={acceptInvite}
      search={search}
      setSearch={setSearch}
      filter={filter}
      setFilter={setFilter}
      vorlesungen={vorlesungen}
      activeVorlesung={activeVorlesung}
      setActiveVorlesung={setActiveVorlesung}
      activePriority={activePriority}
      setActivePriority={setActivePriority}
      openId={openId}
      setOpenId={setOpenId}
      closeDeadlineDetails={closeDeadlineDetails}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      addMessage={addMessage}
      openMessages={openMessages}
      openAttachments={openAttachments}
      handleAttachFiles={handleAttachFiles}
      removeAttachment={removeAttachment}
      pendingAttachments={pendingAttachments}
      setPendingAttachments={setPendingAttachments}
      visibility={visibility}
      setVisibility={setVisibility}
      vorlesung={vorlesung}
      setVorlesung={setVorlesung}
      priority={priority}
      setPriority={setPriority}
      lectures={lecturesQuery ?? []}
      inviteeSearch={inviteeSearch}
      setInviteeSearch={setInviteeSearch}
      selectedInvitees={selectedInvitees}
      setSelectedInvitees={setSelectedInvitees}
      kursPeople={kursPeopleQuery ?? []}
      handleInviteeKeyDown={handleInviteeKeyDown}
      selectInvitee={selectInvitee}
      highlightIndex={highlightIndex}
      setHighlightIndex={setHighlightIndex}
      openDeadline={openDeadline}
      displayName={displayName}
      me={me}
      scripts={scriptsQuery ?? []}
      groups={groupsQuery ?? []}
      linkedScriptIds={linkedScriptIds}
      setLinkedScriptIds={setLinkedScriptIds}
      linkedGroupIds={linkedGroupIds}
      setLinkedGroupIds={setLinkedGroupIds}
      doneOpen={doneOpen}
      setDoneOpen={setDoneOpen}
      archiveOpen={archiveOpen}
      setArchiveOpen={setArchiveOpen}
      deadlineForum={deadlineForum}
      deadlineForumPosts={deadlineForumPosts}
      showCreateForum={showCreateForum}
      setShowCreateForum={setShowCreateForum}
      createForumForDeadline={createForumForDeadline}
      navigate={navigate}
    />
      <AlertDialog open={showPastWarning} onOpenChange={setShowPastWarning}>
        <AlertDialogContent className="max-w-sm border-destructive/20 bg-destructive/5">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> {language.match({ english: () => "Date is in the past", german: () => "Datum liegt in der Vergangenheit" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language.match({ english: () => "The selected date is in the past. Do you still want to create the deadline?", german: () => "Das gewählte Datum liegt in der Vergangenheit. Möchtest du den Termin trotzdem erstellen?" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowPastWarning(false)}>{language.match({ english: () => "Cancel", german: () => "Abbrechen" })}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { pastDateConfirmed.current = true; setShowPastWarning(false); submitDeadline(); }}>
              {language.match({ english: () => "Create anyway", german: () => "Trotzdem erstellen" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
  time,
  setTime,
  remindBefore,
  setRemindBefore,
  category,
  setCategory,
  note,
  setNote,
  editingId,
  showForm,
  setShowForm,
  resetForm,
  submitDeadline,
  isSubmitting,
  startEdit,
  toggleDone,
  removeDeadline,
  declineInvite,
  acceptInvite,
  search,
  setSearch,
  filter,
  setFilter,
  vorlesungen,
  activeVorlesung,
  setActiveVorlesung,
  activePriority,
  setActivePriority,
  openId,
  setOpenId,
  closeDeadlineDetails,
  activeTab,
  setActiveTab,
  newMessage,
  setNewMessage,
  addMessage,
  openMessages,
  openAttachments,
  handleAttachFiles,
  removeAttachment,
  pendingAttachments,
  setPendingAttachments,
  visibility,
  setVisibility,
  vorlesung,
  setVorlesung,
  priority,
  setPriority,
  lectures,
  inviteeSearch,
  setInviteeSearch,
  selectedInvitees,
  setSelectedInvitees,
  kursPeople,
  handleInviteeKeyDown,
  selectInvitee,
  highlightIndex,
  setHighlightIndex,
  openDeadline,
  displayName,
  me,
  scripts,
  groups,
  linkedScriptIds,
  setLinkedScriptIds,
  linkedGroupIds,
  setLinkedGroupIds,
  doneOpen,
  setDoneOpen,
   archiveOpen,
   setArchiveOpen,
   deadlineForum,
   deadlineForumPosts,
   showCreateForum,
   setShowCreateForum,
   createForumForDeadline,
   navigate,
}: {
   deadlines: DeadlineItem[];
  filtered: DeadlineItem[];
  stats: { offen: number; dringend: number; ueberfaellig: number; erledigt: number };
  title: string;
  setTitle: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  remindBefore: number[];
  setRemindBefore: (v: number[]) => void;
  category: string;
  setCategory: (v: any) => void;
  note: string;
  setNote: (v: string) => void;
  editingId: string | null;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  resetForm: () => void;
  submitDeadline: () => void;
  isSubmitting: boolean;
  startEdit: (d: DeadlineItem) => void;
  toggleDone: (id: string) => void;
  removeDeadline: (id: string) => void;
  declineInvite: (id: string) => void;
  acceptInvite: (id: string) => void;
  search: string;
  setSearch: (v: string) => void;
  filter: Filter;
  setFilter: (v: Filter) => void;
  vorlesungen: string[];
  activeVorlesung: string;
  setActiveVorlesung: (v: string) => void;
  activePriority: string;
  setActivePriority: (v: string) => void;
  openId: string | null;
  setOpenId: (v: string | null) => void;
  closeDeadlineDetails: () => void;
  activeTab: "files" | "forum";
  setActiveTab: (v: "files" | "forum") => void;
  activeTab: "files" | "forum" | "discussion";
  setActiveTab: (v: "files" | "forum" | "discussion") => void;
  newMessage: string;
  setNewMessage: (v: string) => void;
  addMessage: () => void;
  openMessages: DeadlineMessage[];
  openAttachments: Attachment[];
  handleAttachFiles: (files: FileList | null) => void;
  removeAttachment: (attachmentId: string) => void;
  pendingAttachments: Attachment[];
  setPendingAttachments: (v: Attachment[]) => void;
  visibility: "public" | "private";
  setVisibility: (v: "public" | "private") => void;
  vorlesung: string;
  setVorlesung: (v: string) => void;
  priority: "low" | "med" | "high";
  setPriority: (v: "low" | "med" | "high") => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lectures: any[];
  inviteeSearch: string;
  setInviteeSearch: (v: string) => void;
  selectedInvitees: { userId: string; displayName: string }[];
  setSelectedInvitees: (v: { userId: string; displayName: string }[]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  kursPeople: any[];
  handleInviteeKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  selectInvitee: (p: { userId: string; displayName: string }) => void;
  highlightIndex: number;
  setHighlightIndex: (v: number) => void;
  openDeadline: DeadlineItem | null;
  displayName: string;
  me: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scripts: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  groups: any[];
  linkedScriptIds: string[];
  setLinkedScriptIds: (v: string[]) => void;
  linkedGroupIds: string[];
  setLinkedGroupIds: (v: string[]) => void;
  doneOpen: boolean;
  setDoneOpen: (v: boolean) => void;
  archiveOpen: boolean;
  setArchiveOpen: (v: boolean) => void;
  deadlineForum: any;
  deadlineForumPosts: any[];
  showCreateForum: boolean;
  setShowCreateForum: (v: boolean) => void;
  createForumForDeadline: any;
  navigate: (path: string) => void;
}) {
  const { language} = useLanguage();
  const tCategoryLabels: Record<string, string> = {
    abgabe: language.match({ english: () => "Assignment", german: () => "Abgabe" }),
    pruefung: language.match({ english: () => "Exam", german: () => "Prüfung" }),
    sonstiges: language.match({ english: () => "Other", german: () => "Sonstiges" }),
  };
  const tPriorityLabels: Record<string, string> = {
    low: language.match({ english: () => "Low", german: () => "Niedrig" }),
    med: language.match({ english: () => "Medium", german: () => "Mittel" }),
    high:language.match({ english: () => "High", german: () => "Hoch" }),
  };
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
                <span className="text-sm text-muted-foreground">{language.match({ english: () => "Planner", german: () => "Planer" })}</span>
              </div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
                <span className="text-gradient">{language.match({ english: () => "Deadlines", german: () => "Termine" })}</span> & {language.match({ english: () => "Submissions", german: () => "Abgaben" })}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language.match({ english: () => "Keep track of deadlines, exams and submissions.", german: () => "Behalte Fristen, Prüfungen und Abgaben im Blick." })}
              </p>
            </div>
            <Button onClick={() => { resetForm(); setShowForm((v) => !v); }} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" /> {language.match({ english: () => "New Deadline", german: () => "Neuer Termin" })}
            </Button>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: language.match({ english: () => "Open", german: () => "Offen" }), count: stats.offen, icon: ListTodo, color: "text-info" },
              { label: language.match({ english: () => "Urgent", german: () => "Dringend" }), count: stats.dringend, icon: Flame, color: "text-warning" },
              { label: language.match({ english: () => "Overdue", german: () => "Überfällig" }), count: stats.ueberfaellig, icon: AlertCircle, color: "text-destructive" },
              { label: language.match({ english: () => "Done", german: () => "Erledigt" }), count: stats.erledigt, icon: CheckCircle2, color: "text-success" },
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
                    <div className="space-y-1">
                      <Input placeholder={language.match({ english: () => "Title (e.g. Math assignment)", german: () => "Titel (z. B. Hausarbeit Mathe)" })} value={title} onChange={(e) => setTitle(e.target.value)} />
                      {title.trim().length > TITLE_MAX && (
                        <p className="text-xs text-destructive">{language.match({ english: () => "Title must not exceed 50 characters.", german: () => "Titel darf maximal 50 Zeichen lang sein." })}</p>
                      )}
                    </div>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{language.match({ english: () => "Time (optional)", german: () => "Uhrzeit (optional)" })}</p>
                      <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{language.match({ english: () => "Remind (optional)", german: () => "Erinnern (optional)" })}</p>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 5].map((d) => (
                          <button
                            key={d}
                            onClick={() =>
                              setRemindBefore((prev) =>
                                prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
                              )
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              remindBefore.includes(d)
                                ? "bg-primary/10 text-primary border-primary/30"
                                : "text-muted-foreground bg-secondary border-transparent"
                            }`}
                          >
                            {d} {language.match({ english: () => `day${d > 1 ? "s" : ""}`, german: () => `Tag${d > 1 ? "e" : ""}` })}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(["abgabe", "pruefung", "sonstiges"] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => { setCategory(c); if (c === "sonstiges") setVorlesung(""); }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${category === c ? categoryColors[c] : "text-muted-foreground bg-secondary border-transparent"
                          }`}
                      >
                        {tCategoryLabels[c]}
                      </button>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">{language.match({ english: () => "Priority", german: () => "Priorität" })}</p>
                    <div className="flex gap-2">
                      {(["low", "med", "high"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPriority(p)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${priority === p ? priorityColors[p] : "text-muted-foreground bg-secondary border-transparent"
                            }`}
                        >
                          {tPriorityLabels[p]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea placeholder={language.match({ english: () => "Note (optional)", german: () => "Notiz (optional)" })} value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="resize-none" />
                  {category !== "sonstiges" && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">{language.match({ english: () => "Lecture", german: () => "Vorlesung" })}</p>
                    <Select value={vorlesung} onValueChange={setVorlesung}>
                      <SelectTrigger>
                        <SelectValue placeholder={language.match({ english: () => "Select lecture", german: () => "Vorlesung wählen" })} />
                      </SelectTrigger>
                      <SelectContent>
                        {lectures.map((l: any) => (
                          <SelectItem key={l._id} value={l.lectureName}>{l.lectureName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">{language.match({ english: () => "Link scripts (optional)", german: () => "Skripte verlinken (optional)" })}</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {linkedScriptIds.map((id) => {
                        const s = scripts.find((x: any) => x._id === id);
                        if (!s) return null;
                        return (
                          <Badge key={id} variant="secondary" className="gap-1 pr-1">
                            <FileText className="h-3 w-3" />
                            {s.title}
                            <button onClick={() => setLinkedScriptIds((prev) => prev.filter((x) => x !== id))} className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                    <Select value="" onValueChange={(id) => { if (id && !linkedScriptIds.includes(id)) setLinkedScriptIds((prev) => [...prev, id]); }}>
                      <SelectTrigger>
                        <SelectValue placeholder={language.match({ english: () => "Select script", german: () => "Skript auswählen" })} />
                      </SelectTrigger>
                      <SelectContent>
                        {scripts
                          .filter((s: any) => !linkedScriptIds.includes(s._id))
                          .map((s: any) => (
                            <SelectItem key={s._id} value={s._id}>{s.title}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">{language.match({ english: () => "Link groups (optional)", german: () => "Gruppen verlinken (optional)" })}</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {linkedGroupIds.map((id) => {
                        const g = groups.find((x: any) => x._id === id);
                        if (!g) return null;
                        return (
                          <Badge key={id} variant="secondary" className="gap-1 pr-1">
                            <Users className="h-3 w-3" />
                            {g.name}
                            <button onClick={() => setLinkedGroupIds((prev) => prev.filter((x) => x !== id))} className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                    <Select value="" onValueChange={(id) => { if (id && !linkedGroupIds.includes(id)) setLinkedGroupIds((prev) => [...prev, id]); }}>
                      <SelectTrigger>
                        <SelectValue placeholder={language.match({ english: () => "Select group", german: () => "Gruppe auswählen" })} />
                      </SelectTrigger>
                      <SelectContent>
                        {groups
                          .filter((g: any) => !linkedGroupIds.includes(g._id))
                          .map((g: any) => (
                            <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">{language.match({ english: () => "Visibility", german: () => "Sichtbarkeit" })}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setVisibility("public")}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${visibility === "public" ? "bg-primary/10 text-primary border-primary/30" : "text-muted-foreground bg-secondary border-transparent"
                          }`}
                      >
                        <Globe className="h-4 w-4" /> {language.match({ english: () => "Public", german: () => "Öffentlich" })}
                      </button>
                      <button
                        onClick={() => setVisibility("private")}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${visibility === "private" ? "bg-primary/10 text-primary border-primary/30" : "text-muted-foreground bg-secondary border-transparent"
                          }`}
                      >
                        <Lock className="h-4 w-4" /> {language.match({ english: () => "Private", german: () => "Privat" })}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">{language.match({ english: () => "Invite people", german: () => "Personen einladen" })}</p>
                    {visibility === "public" ? (
                      <p className="text-xs text-muted-foreground italic">{language.match({ english: () => "All people in your course will be invited automatically.", german: () => "Alle Personen deines Kurses werden automatisch eingeladen." })}</p>
                    ) : (
                      <div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {selectedInvitees.map((s) => (
                            <Badge key={s.userId} variant="secondary" className="gap-1 pr-1">
                              {s.displayName}
                              <button
                                onClick={() => setSelectedInvitees((prev) => prev.filter((x) => x.userId !== s.userId))}
                                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="relative">
                          <Input
                            placeholder={language.match({ english: () => "Search names…", german: () => "Namen suchen…" })}
                            value={inviteeSearch}
                            onChange={(e) => { setInviteeSearch(e.target.value); setHighlightIndex(0); }}
                            onFocus={() => setInviteeSearch((v) => v)}
                            onBlur={() => setTimeout(() => setInviteeSearch(""), 200)}
                            onKeyDown={handleInviteeKeyDown}
                            autoComplete="off"
                          />
                          {inviteeSearch && (() => {
                            const filtered = (kursPeople).filter(
                              (p: { userId: string; displayName: string }) =>
                                p.displayName.toLowerCase().includes(inviteeSearch.toLowerCase()) &&
                                !selectedInvitees.some((s) => s.userId === p.userId),
                            );
                            const shown = filtered.slice(0, 8);
                            const safeIndex = Math.min(highlightIndex, shown.length - 1);
                            return (
                              <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-36 overflow-y-auto">
                                {shown.length === 0 ? (
                                  <p className="px-3 py-2 text-xs text-muted-foreground">{language.match({ english: () => "No people found", german: () => "Keine Personen gefunden" })}</p>
                                ) : (
                                  shown.map((p, i) => (
                                    <button
                                      key={p.userId}
                                      type="button"
                                      className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${i === safeIndex ? "bg-accent" : "hover:bg-accent"}`}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        selectInvitee(p);
                                      }}
                                      ref={i === safeIndex ? (el) => { if (el) el.scrollIntoView({ block: "nearest" }); } : undefined}
                                    >
                                      {p.displayName}
                                    </button>
                                  ))
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" onClick={resetForm}>{language.match({ english: () => "Cancel", german: () => "Abbrechen" })}</Button>
                    <Button onClick={submitDeadline} disabled={isSubmitting}>{editingId ? language.match({ english: () => "Update", german: () => "Aktualisieren" }) : language.match({ english: () => "Create", german: () => "Erstellen" })}</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search + Filter */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={language.match({ english: () => "Search deadlines…", german: () => "Termine durchsuchen…" })} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-1 p-1 rounded-lg bg-secondary/60 w-fit flex-wrap">
              {(["alle", "offen", "dringend", "ueberfaellig", "erledigt"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  title={f === "dringend" ? language.match({ english: () => "Within the next 3 days", german: () => "Innerhalb der nächsten 3 Tage" }) : undefined}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                >
                  {f === "dringend" ? language.match({ english: () => "Urgent", german: () => "Dringend" }) : f === "ueberfaellig" ? language.match({ english: () => "Overdue", german: () => "Überfällig" }) : f === "offen" ? language.match({ english: () => "Open", german: () => "Offen" }) : f === "erledigt" ? language.match({ english: () => "Done", german: () => "Erledigt" }) : language.match({ english: () => "All", german: () => "Alle" })}
                </button>
              ))}
            </div>
          </div>

          {/* Vorlesung filter */}
          {vorlesungen.length > 1 && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <FilterIcon className="h-4 w-4 text-muted-foreground" />
              {vorlesungen.map((v) => (
                <button
                  key={v}
                  onClick={() => setActiveVorlesung(v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    activeVorlesung === v
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/60 text-muted-foreground border-transparent hover:text-foreground"
                  }`}
                >
                  {v === "alle" ? language.match({ english: () => "All lectures", german: () => "Alle Vorlesungen" }) : v}
                </button>
              ))}
            </div>
          )}

          {/* Priority filter */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <FilterIcon className="h-4 w-4 text-muted-foreground" />
            {(["alle", "low", "med", "high"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setActivePriority(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activePriority === p
                    ? priorityColors[p] ?? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/60 text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                {p === "alle" ? language.match({ english: () => "All priorities", german: () => "Alle Prioritäten" }) : tPriorityLabels[p]}
              </button>
            ))}
          </div>

          {/* Deadline list */}
          <div className="space-y-2">
            {(() => {
              const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
              const activeFiltered = filtered
                .filter((d) => !d.done && new Date(d.date).getTime() > thirtyDaysAgo)
                .sort((a, b) => (a.date + (a.time ?? ""))?.localeCompare(b.date + (b.time ?? "")));
              const doneFiltered = filtered
                .filter((d) => d.done && new Date(d.date).getTime() > thirtyDaysAgo)
                .sort((a, b) => (a.date + (a.time ?? ""))?.localeCompare(b.date + (b.time ?? "")));
              const archivedFiltered = filtered
                .filter((d) => new Date(d.date).getTime() <= thirtyDaysAgo)
                .sort((a, b) => (a.date + (a.time ?? ""))?.localeCompare(b.date + (b.time ?? "")));
              return (
                <>
                  {activeFiltered.length === 0 && doneFiltered.length === 0 && archivedFiltered.length === 0 ? (
                    <div className="glass-card p-10 text-center">
                      <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground">{language.match({ english: () => "No deadlines found.", german: () => "Keine Termine gefunden." })}</p>
                    </div>
                  ) : null}
                  {activeFiltered.map((d) => {
                    const diff = endOfDay(d.date) - Date.now();
                    const overdue = diff < 0 && !d.done;
                    const urgent = diff >= 0 && diff < URGENT_WINDOW_MS && !d.done;
                    const messageCount = d.messageCount;
                    const fileCount = d.attachments?.length ?? 0;
                    const isOwn = d.ownerId === me;
                    return (
                      <motion.div
                        key={d.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`glass-card p-4 ${d.done ? "bg-muted/40 opacity-60" : ""}`}
                      >
                        <div className="flex flex-row items-center gap-2 sm:gap-3 w-full">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            {isOwn ? (
                              <button onClick={() => toggleDone(d.id)} className="shrink-0">
                                {d.done ? (
                                  <CheckCircle2 className="h-5 w-5 text-success" />
                                ) : (
                                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/40 hover:border-primary transition-colors" />
                                )}
                              </button>
                            ) : d.invitees?.includes(me) ? (
                              <div className="flex gap-1 shrink-0">
                                <Button size="icon" className="h-7 w-7" onClick={() => acceptInvite(d.id)} title={language.match({ english: () => "Accept", german: () => "Annehmen" })}>
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => declineInvite(d.id)} title={language.match({ english: () => "Decline", german: () => "Ablehnen" })}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <button onClick={() => toggleDone(d.id)} className="shrink-0">
                                {d.done ? (
                                  <CheckCircle2 className="h-5 w-5 text-success" />
                                ) : (
                                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/40 hover:border-primary transition-colors" />
                                )}
                              </button>
                            )}
                            <div className="hidden sm:flex flex-col items-start gap-0.5 shrink-0">
                              {d.vorlesung && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent/15 text-accent">
                                  <GraduationCap className="h-3 w-3 inline mr-0.5" />
                                  {d.vorlesung}
                                </span>
                              )}
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${categoryColors[d.category]}`}>
                                {tCategoryLabels[d.category]}
                              </span>
                            </div>
                              <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`font-medium truncate ${d.done ? "line-through" : ""}`}>
                                  {d.title}
                                </p>
                                {overdue && <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">{language.match({ english: () => "Overdue", german: () => "Überfällig" })}</Badge>}
                                {urgent && <Badge variant="outline" className="text-[10px] text-warning border-warning/30">{language.match({ english: () => "Soon", german: () => "Bald" })}</Badge>}
                              </div>
                              <div className="flex sm:hidden flex-row flex-wrap items-center gap-1.5 mt-1">
                                {d.vorlesung && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent/15 text-accent">
                                    <GraduationCap className="h-3 w-3 inline mr-0.5" />
                                    {d.vorlesung}
                                  </span>
                                )}
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${categoryColors[d.category]}`}>
                                  {tCategoryLabels[d.category]}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(d.date).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
                                  {d.time && `, ${d.time}`}
                                </span>
                        {d.remindBefore && d.remindBefore > 0 && (
                          <span className="inline-flex items-center gap-1 text-warning">
                            <Bell className="h-3 w-3" /> {d.remindBefore} {language.match({ english: () => `day${d.remindBefore > 1 ? "s" : ""} before`, german: () => `Tag${d.remindBefore > 1 ? "e" : ""} vorher` })}
                          </span>
                        )}
                              {d.visibility === "private" && (
                                <span className="inline-flex items-center gap-1">
                                  <Lock className="h-3 w-3" /> {language.match({ english: () => "Private", german: () => "Privat" })}
                                </span>
                              )}
                              {d.invitees.length > 0 && (
                                <span>{d.invitees.length} {language.match({ english: () => "Invited", german: () => "Eingeladene" })}</span>
                              )}
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${priorityColors[d.priority]}`}>
                                {language.match({ english: () => "Prio:", german: () => "Prio:" })} {tPriorityLabels[d.priority]}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="hidden sm:flex flex-col sm:flex-row items-center gap-1">
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
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setOpenId(d.id)} title={language.match({ english: () => "Details", german: () => "Details" })}>
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            {(isOwn || d.invitees.includes(me)) && (
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => startEdit(d)} title={language.match({ english: () => "Edit", german: () => "Bearbeiten" })}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {isOwn && (
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => removeDeadline(d.id)} title={language.match({ english: () => "Delete", german: () => "Löschen" })}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 p-0 flex sm:hidden">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-36">
                              {fileCount > 0 && (
                                <DropdownMenuItem disabled className="gap-2 text-xs">
                                  <Paperclip className="h-3.5 w-3.5" /> {fileCount} {language.match({ english: () => "file(s)", german: () => "Datei(en)" })}
                                </DropdownMenuItem>
                              )}
                              {messageCount > 0 && (
                                <DropdownMenuItem disabled className="gap-2 text-xs">
                                  <MessageSquare className="h-3.5 w-3.5" /> {messageCount} {language.match({ english: () => "post(s)", german: () => "Beitrag/Beträge" })}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setOpenId(d.id)} className="gap-2 text-xs">
                                <MessageSquare className="h-3.5 w-3.5" /> {language.match({ english: () => "Details", german: () => "Details" })}
                              </DropdownMenuItem>
                              {(isOwn || d.invitees.includes(me)) && (
                                <DropdownMenuItem onClick={() => startEdit(d)} className="gap-2 text-xs">
                                  <Pencil className="h-3.5 w-3.5" /> {language.match({ english: () => "Edit", german: () => "Bearbeiten" })}
                                </DropdownMenuItem>
                              )}
                              {isOwn && (
                                <DropdownMenuItem onClick={() => removeDeadline(d.id)} className="gap-2 text-xs text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" /> {language.match({ english: () => "Delete", german: () => "Löschen" })}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </motion.div>
                    );
                  })}
                  {doneFiltered.length > 0 && (
                    <>
                      <div className="relative flex items-center pt-6 pb-1">
                        <div className="flex-grow border-t border-border/30" />
                        <button onClick={() => setDoneOpen((v) => !v)} className="flex items-center gap-2 mx-3 group">
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                          <span className="text-[11px] uppercase tracking-widest text-muted-foreground/60 group-hover:text-foreground transition-colors font-normal">{language.match({ english: () => "Done", german: () => "Erledigt" })}</span>
                          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground transition-all ${doneOpen ? "" : "-rotate-90"}`} />
                        </button>
                        <div className="flex-grow border-t border-border/30" />
                      </div>
                      {doneOpen && doneFiltered.map((d) => {
                        const messageCount = d.messageCount;
                        const fileCount = d.attachments?.length ?? 0;
                        const isOwn = d.ownerId === me;
                        return (
                          <motion.div
                            key={d.id}
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass-card p-4 bg-muted/70 opacity-50"
                          >
                            <div className="flex flex-row items-center gap-2 sm:gap-3 w-full">
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                {isOwn ? (
                                  <button onClick={() => toggleDone(d.id)} className="shrink-0">
                                    <CheckCircle2 className="h-5 w-5 text-success" />
                                  </button>
                                ) : (
                                  <button onClick={() => toggleDone(d.id)} className="shrink-0">
                                    <CheckCircle2 className="h-5 w-5 text-success" />
                                  </button>
                                )}
                                <div className="hidden sm:flex flex-col items-start gap-0.5 shrink-0">
                                  {d.vorlesung && (
                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent/15 text-accent">
                                      <GraduationCap className="h-3 w-3 inline mr-0.5" />
                                      {d.vorlesung}
                                    </span>
                                  )}
                                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${categoryColors[d.category]}`}>
                                    {tCategoryLabels[d.category]}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium truncate line-through text-muted-foreground/70">{d.title}</p>
                                  </div>
                                  <div className="flex sm:hidden flex-row flex-wrap items-center gap-1.5 mt-1">
                                    {d.vorlesung && (
                                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent/15 text-accent">
                                        <GraduationCap className="h-3 w-3 inline mr-0.5" />
                                        {d.vorlesung}
                                      </span>
                                    )}
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${categoryColors[d.category]}`}>
                                      {tCategoryLabels[d.category]}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground/60 mt-0.5">
                                    <span className="inline-flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(d.date).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
                                      {d.time && `, ${d.time}`}
                                    </span>
                                    {d.remindBefore && d.remindBefore.length > 0 && (
                                      <span className="inline-flex items-center gap-1 text-warning">
                                        <Bell className="h-3 w-3" /> {d.remindBefore.sort((a, b) => a - b).map((r) => `${r} ${language.match({ english: () => `day${r > 1 ? "s" : ""}`, german: () => `Tag${r > 1 ? "e" : ""}` })}`).join(", ")} {language.match({ english: () => "before", german: () => "vorher" })}
                                      </span>
                                    )}
                                    {d.visibility === "private" && (
                                      <span className="inline-flex items-center gap-1">
                                        <Lock className="h-3 w-3" /> {language.match({ english: () => "Private", german: () => "Privat" })}
                                      </span>
                                    )}
                                    {d.invitees.length > 0 && (
                                      <span>{d.invitees.length} {language.match({ english: () => "Invited", german: () => "Eingeladene" })}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="hidden sm:flex flex-col sm:flex-row items-center gap-1">
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
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setOpenId(d.id)} title={language.match({ english: () => "Details", german: () => "Details" })}>
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                                {(isOwn || d.invitees.includes(me)) && (
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => startEdit(d)} title={language.match({ english: () => "Edit", german: () => "Bearbeiten" })}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                )}
                                {isOwn && (
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => removeDeadline(d.id)} title={language.match({ english: () => "Delete", german: () => "Löschen" })}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 p-0 flex sm:hidden">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-36">
                                  {fileCount > 0 && (
                                    <DropdownMenuItem disabled className="gap-2 text-xs">
                                      <Paperclip className="h-3.5 w-3.5" /> {fileCount} {language.match({ english: () => "file(s)", german: () => "Datei(en)" })}
                                    </DropdownMenuItem>
                                  )}
                                  {messageCount > 0 && (
                                    <DropdownMenuItem disabled className="gap-2 text-xs">
                                      <MessageSquare className="h-3.5 w-3.5" /> {messageCount} {language.match({ english: () => "post(s)", german: () => "Beitrag/Beträge" })}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => setOpenId(d.id)} className="gap-2 text-xs">
                                    <MessageSquare className="h-3.5 w-3.5" /> {language.match({ english: () => "Details", german: () => "Details" })}
                                  </DropdownMenuItem>
                                  {(isOwn || d.invitees.includes(me)) && (
                                    <DropdownMenuItem onClick={() => startEdit(d)} className="gap-2 text-xs">
                                      <Pencil className="h-3.5 w-3.5" /> {language.match({ english: () => "Edit", german: () => "Bearbeiten" })}
                                    </DropdownMenuItem>
                                  )}
                                  {isOwn && (
                                    <DropdownMenuItem onClick={() => removeDeadline(d.id)} className="gap-2 text-xs text-destructive">
                                      <Trash2 className="h-3.5 w-3.5" /> {language.match({ english: () => "Delete", german: () => "Löschen" })}
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </motion.div>
                        );
                      })}
                    </>
                  )}
                  {archivedFiltered.length > 0 && (
                    <>
                      <div className="relative flex items-center pt-6 pb-1">
                        <div className="flex-grow border-t border-border/30" />
                        <button onClick={() => setArchiveOpen((v) => !v)} className="flex items-center gap-2 mx-3 group">
                          <Archive className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                          <span className="text-[11px] uppercase tracking-widest text-muted-foreground/60 group-hover:text-foreground transition-colors font-normal">{language.match({ english: () => "Archive (> 30 days)", german: () => "Archiv (> 30 Tage)" })}</span>
                          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground transition-all ${archiveOpen ? "" : "-rotate-90"}`} />
                        </button>
                        <div className="flex-grow border-t border-border/30" />
                      </div>
                      {archiveOpen && archivedFiltered.map((d) => {
                        const diff = new Date(d.date).getTime() - Date.now();
                        const overdue = diff < 0 && !d.done;
                        const urgent = diff >= 0 && diff < 3 * 24 * 60 * 60 * 1000 && !d.done;
                        const messageCount = d.messageCount;
                        const fileCount = d.attachments?.length ?? 0;
                        const isOwn = d.ownerId === me;
                        return (
                          <motion.div
                            key={d.id}
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`glass-card p-4 ${d.done ? "bg-muted/70 opacity-50" : "opacity-60"}`}
                          >
                            <div className="flex flex-row items-center gap-2 sm:gap-3 w-full">
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                {isOwn ? (
                                  <button onClick={() => toggleDone(d.id)} className="shrink-0">
                                    {d.done ? (
                                      <CheckCircle2 className="h-5 w-5 text-success" />
                                    ) : (
                                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/40 hover:border-primary transition-colors" />
                                    )}
                                  </button>
                                ) : d.invitees?.includes(me) ? (
                                  <div className="flex gap-1 shrink-0">
                                    <Button size="icon" className="h-7 w-7" onClick={() => acceptInvite(d.id)} title={language.match({ english: () => "Accept", german: () => "Annehmen" })}>
                                      <Check className="h-3 w-3" />
                                    </Button>
                                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => declineInvite(d.id)} title={language.match({ english: () => "Decline", german: () => "Ablehnen" })}>
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <button onClick={() => toggleDone(d.id)} className="shrink-0">
                                    {d.done ? (
                                      <CheckCircle2 className="h-5 w-5 text-success" />
                                    ) : (
                                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/40 hover:border-primary transition-colors" />
                                    )}
                                  </button>
                                  )}
                                  <div className="hidden sm:flex flex-col items-start gap-0.5 shrink-0">
                                    {d.vorlesung && (
                                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent/15 text-accent">
                                        <GraduationCap className="h-3 w-3 inline mr-0.5" />
                                        {d.vorlesung}
                                      </span>
                                    )}
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${categoryColors[d.category]}`}>
                                      {tCategoryLabels[d.category]}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className={`font-medium truncate ${d.done ? "line-through text-muted-foreground/70" : ""}`}>
                                        {d.title}
                                      </p>
                                    </div>
                                    <div className="flex sm:hidden flex-row flex-wrap items-center gap-1.5 mt-1">
                                      {d.vorlesung && (
                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent/15 text-accent">
                                          <GraduationCap className="h-3 w-3 inline mr-0.5" />
                                          {d.vorlesung}
                                        </span>
                                      )}
                                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${categoryColors[d.category]}`}>
                                        {tCategoryLabels[d.category]}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                    <span className="inline-flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(d.date).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
                                      {d.time && `, ${d.time}`}
                                    </span>
                                    {d.remindBefore && d.remindBefore.length > 0 && (
                                      <span className="inline-flex items-center gap-1 text-warning">
                                        <Bell className="h-3 w-3" /> {d.remindBefore.sort((a, b) => a - b).map((r) => `${r} ${language.match({ english: () => `day${r > 1 ? "s" : ""}`, german: () => `Tag${r > 1 ? "e" : ""}` })}`).join(", ")} {language.match({ english: () => "before", german: () => "vorher" })}
                                      </span>
                                    )}
                                    {d.visibility === "private" && (
                                      <span className="inline-flex items-center gap-1">
                                        <Lock className="h-3 w-3" /> {language.match({ english: () => "Private", german: () => "Privat" })}
                                      </span>
                                    )}
                                    {d.invitees.length > 0 && (
                                      <span>{d.invitees.length} {language.match({ english: () => "Invited", german: () => "Eingeladene" })}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="hidden sm:flex flex-col sm:flex-row items-center gap-1">
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
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setOpenId(d.id)} title={language.match({ english: () => "Details", german: () => "Details" })}>
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                                {(isOwn || d.invitees.includes(me)) && (
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => startEdit(d)} title={language.match({ english: () => "Edit", german: () => "Bearbeiten" })}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                )}
                                {isOwn && (
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => removeDeadline(d.id)} title={language.match({ english: () => "Delete", german: () => "Löschen" })}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 p-0 flex sm:hidden">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-36">
                                  {fileCount > 0 && (
                                    <DropdownMenuItem disabled className="gap-2 text-xs">
                                      <Paperclip className="h-3.5 w-3.5" /> {fileCount} {language.match({ english: () => "file(s)", german: () => "Datei(en)" })}
                                    </DropdownMenuItem>
                                  )}
                                  {messageCount > 0 && (
                                    <DropdownMenuItem disabled className="gap-2 text-xs">
                                      <MessageSquare className="h-3.5 w-3.5" /> {messageCount} {language.match({ english: () => "post(s)", german: () => "Beitrag/Beträge" })}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => setOpenId(d.id)} className="gap-2 text-xs">
                                    <MessageSquare className="h-3.5 w-3.5" /> {language.match({ english: () => "Details", german: () => "Details" })}
                                  </DropdownMenuItem>
                                  {(isOwn || d.invitees.includes(me)) && (
                                    <DropdownMenuItem onClick={() => startEdit(d)} className="gap-2 text-xs">
                                      <Pencil className="h-3.5 w-3.5" /> {language.match({ english: () => "Edit", german: () => "Bearbeiten" })}
                                    </DropdownMenuItem>
                                  )}
                                  {isOwn && (
                                    <DropdownMenuItem onClick={() => removeDeadline(d.id)} className="gap-2 text-xs text-destructive">
                                      <Trash2 className="h-3.5 w-3.5" /> {language.match({ english: () => "Delete", german: () => "Löschen" })}
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </motion.div>
                        );
                      })}
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!openId} onOpenChange={(o) => { if (!o) closeDeadlineDetails(); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              {openDeadline?.title || language.match({ english: () => "Deadline", german: () => "Termin" })}
            </DialogTitle>
            <DialogDescription>
              {openDeadline && (
                <span className="inline-flex items-center gap-2">
                  <span>{new Date(openDeadline.date).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${categoryColors[openDeadline.category]}`}>
                    {tCategoryLabels[openDeadline.category]}
                  </span>
                  {openDeadline.vorlesung && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent/15 text-accent">
                      <GraduationCap className="h-3 w-3" /> {openDeadline.vorlesung}
                    </span>
                  )}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "files" | "forum" | "discussion")} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mb-3">
              <TabsTrigger value="files" className="gap-1.5">
                <Paperclip className="h-4 w-4" /> {language.match({ english: () => "Files", german: () => "Dateien" })} ({openAttachments.length})
              </TabsTrigger>
              <TabsTrigger value="discussion" className="gap-1.5">
                <MessageSquare className="h-4 w-4" /> {language.match({ english: () => "Discussion", german: () => "Diskussion" })}
              </TabsTrigger>
              <TabsTrigger value="forum" className="gap-1.5">
                <MessageSquare className="h-4 w-4" /> {language.match({ english: () => "Chat", german: () => "Chat" })} ({openMessages.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="flex-1 overflow-y-auto space-y-3">
              {openAttachments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">{language.match({ english: () => "No files attached.", german: () => "Keine Dateien angehängt." })}</p>
              )}
              {openAttachments.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(a.size)}</p>
                  </div>
                  <a href={a.url} download className="text-primary hover:underline text-xs inline-flex items-center gap-1">
                    <Download className="h-3.5 w-3.5" />
                  </a>
                  {(a.uploadedBy === me || openDeadline?.ownerId === me) && (
                    <button
                      onClick={() => removeAttachment(a.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title={language.match({ english: () => "Delete", german: () => "Löschen" })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">{language.match({ english: () => "Attach file", german: () => "Datei anhängen" })}</p>
                <label className="flex items-center justify-center gap-2 p-4 rounded-lg border border-dashed cursor-pointer hover:bg-secondary/40 transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{language.match({ english: () => "Click to upload", german: () => "Klicken zum Hochladen" })}</span>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={(e) => { handleAttachFiles(e.target.files); e.target.value = ""; }}
                  />
                </label>
              </div>
            </TabsContent>

            <TabsContent value="discussion" className="flex-1 overflow-y-auto space-y-3">
              {deadlineForum ? (
                <>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{deadlineForum.name}</p>
                      <p className="text-xs text-muted-foreground">{deadlineForum.description}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate("/forum/" + deadlineForum._id)}>
                      {language.match({ english: () => "Open", german: () => "Öffnen" })}
                    </Button>
                  </div>
                  {deadlineForumPosts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">{language.match({ english: () => "No posts yet.", german: () => "Noch keine Beiträge." })}</p>
                  ) : (
                    deadlineForumPosts.slice(0, 5).map((post: any) => (
                      <div key={post._id} className="p-3 rounded-lg border cursor-pointer hover:bg-secondary/40 transition-colors" onClick={() => navigate("/forum/" + deadlineForum._id)}>
                        <p className="text-sm font-medium">{post.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{post.authorName} · {new Date(post._creationTime).toLocaleDateString("de-DE")}</p>
                      </div>
                    ))
                  )}
                  {deadlineForumPosts.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground">
                      {language.match({ english: () => "and", german: () => "und" })} {deadlineForumPosts.length - 5} {language.match({ english: () => "more...", german: () => "weitere…" })}
                    </p>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground text-center">{language.match({ english: () => "No forum linked to this deadline.", german: () => "Kein Forum mit diesem Termin verknüpft." })}</p>
                  <Button onClick={() => setShowCreateForum(true)}>
                    {language.match({ english: () => "Create forum", german: () => "Forum erstellen" })}
                  </Button>
                  {showCreateForum && (
                    <div className="w-full space-y-3 p-4 rounded-lg border">
                      <p className="text-sm font-medium">{language.match({ english: () => "New forum for this deadline", german: () => "Neues Forum für diesen Termin" })}</p>
                      <Button size="sm" onClick={async () => {
                        try {
                          await createForumForDeadline({
                            deadlineId: openId as Id<"deadlines">,
                            name: openDeadline?.title || "Forum",
                            description: `Diskussionsforum zu "${openDeadline?.title || "Termin"}"`,
                            visibility: "public",
                          });
                          toast.success(language.match({ english: () => "Forum created!", german: () => "Forum erstellt!" }));
                          setShowCreateForum(false);
                        } catch {
                          toast.error(language.match({ english: () => "Failed to create forum", german: () => "Fehler beim Erstellen" }));
                        }
                      }}>
                        {language.match({ english: () => "Create", german: () => "Erstellen" })}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="forum" className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                {openMessages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">{language.match({ english: () => "No messages.", german: () => "Keine Nachrichten." })}</p>
                )}
                {openMessages.map((m) => (
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
                <Input placeholder={language.match({ english: () => "Write a message…", german: () => "Nachricht schreiben…" })} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") addMessage(); }} />
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
