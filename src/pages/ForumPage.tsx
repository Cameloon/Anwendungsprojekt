import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Archive,
  MessageSquare,
  Plus,
  ThumbsUp,
  MessageCircle,
  Search,
  Clock,
  Users,
  Lock,
  Presentation,
  X,
  Hash,
  LogIn,
  Copy,
  TrendingUp,
  Globe,
  ExternalLink,
  FileText,
  Flag,
  Trash2,
  Shield,
  Upload,
  Calendar,
  CalendarDays,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Whiteboard from "@/components/Whiteboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { DHBW_STANDORTE } from "@/lib/dhbw";
import { KURSE } from "@/lib/kurs";
import { ReportDialog } from "@/components/ReportDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/hooks/useLanguage";

const tagStyles: Record<string, string> = {
  frage: "bg-info/15 text-info border-info/20",
  material: "bg-success/15 text-success border-success/20",
  diskussion: "bg-accent/15 text-accent border-accent/20",
};
const tTagLabels: Record<string, string> = {
  frage: "Frage",
  material: "Material",
  diskussion: "Diskussion",
};

const avatarColors = [
  "bg-primary/15 text-primary",
  "bg-info/15 text-info",
  "bg-success/15 text-success",
  "bg-accent/15 text-accent",
  "bg-destructive/15 text-destructive",
];

type Sort = "neu" | "beliebt";

// ── Shared types ──

interface FPostItem {
  id: string;
  _creationTime: number;
  authorName: string;
  authorId: string;
  title: string;
  content: string;
  tag: string;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  sketch?: string;
  linkedScriptIds?: string[];
  linkedDeadlineIds?: string[];
  updatedAt?: number;
  standort?: string;
  studiengang?: string;
  kurs?: string;
  vorlesung?: string;
  professor?: string;
}

interface FForumItem {
  id: string;
  name: string;
  visibility: "public" | "private";
  description: string;
  members: { userId: string; displayName: string }[];
  ownerId?: string;
  inviteCode: string;
  kurs?: string;
  vorlesung?: string;
  professor?: string;
  standort?: string;
  sectionId?: string;
  archivedByMe?: boolean;
  deadlineId?: string;
}

interface FSectionItem {
  _id: string;
  name: string;
  description: string;
  accessRule?: string;
  displayOrder: number;
}

interface FScriptItem {
  id: string;
  title: string;
  subject: string;
}

// ── Convex production path ──

function ForumPage() {
  
  const { language } = useLanguage();
  const { user } = useAuth();
  const profile = useProfile();
  const me = user?.id || "";
  const displayName = profile?.display_name || language.match({ english: () => "Unknown", german: () => "Unbekannt" });
  const myKurs = profile?.kurs || undefined;
  const isAdmin = profile?.role === "admin";
  const navigate = useNavigate();
  

  const forumsQuery = useQuery(api.forums.getAllAccessible);
  const allScriptsQuery = useQuery(api.scripts.listPublic);
  const allDeadlinesQuery = useQuery(api.deadlines.listForUser);
  const sectionsQuery = useQuery(api.sections.list);

  const createForumMutation = useMutation(api.forums.create);
  const createPostMutation = useMutation(api.posts.create);
  const toggleLikeMutation = useMutation(api.posts.toggleLike);
  const joinByCodeMutation = useMutation(api.forums.joinByCode);
  const joinMutation = useMutation(api.forums.join);
  const leaveMutation = useMutation(api.forums.leave);
  const inviteMutation = useMutation(api.notifications.inviteToForum);
  const inviteKursMutation = useMutation(api.notifications.inviteKursToForum);
  const deletePostMutation = useMutation(api.posts.deletePost);
  const archiveForumMutation = useMutation(api.forums.archive);
  const unarchiveForumMutation = useMutation(api.forums.unarchive);
  const deleteForumMutation = useMutation(api.forums.deleteForum);
  const seedSectionsMutation = useMutation(api.sections.seedDefaultSections);
  const ensureDefaultForumsMutation = useMutation(api.forums.ensureDefaultSZIAndConnectForums);
  const seedAllKursForumsMutation = useMutation(api.semesterLectures.seedAllKursForums);
  const archiveOldLectureForumsMutation = useMutation(api.forums.archiveOldLectureForums);
  const myLecturesQuery = useQuery(api.semesterLectures.getLecturesForMyKurs);
  const kursPeopleQuery = useQuery(api.profiles.listSameKurs);

  const [adminViewKurs, setAdminViewKurs] = useState<string>("");

  // Seed sections, default forums, ALL kurs lecture forums, and auto-archive old ones
  useEffect(() => {
    (async () => {
      try { await seedSectionsMutation(); } catch { }
      try { await ensureDefaultForumsMutation(); } catch { }
      try { await seedAllKursForumsMutation(); } catch { }
      try { await archiveOldLectureForumsMutation(); } catch { }
    })();
  }, [seedSectionsMutation, ensureDefaultForumsMutation, seedAllKursForumsMutation, archiveOldLectureForumsMutation]);

  const [searchParams, setSearchParams] = useSearchParams();
  const urlForumId = searchParams.get("forumId") || "";
  const [activeForumId, setActiveForumId_] = useState<string>(urlForumId);
  const setActiveForumId = (id: string) => {
    setActiveForumId_(id);
    if (id) {
      setSearchParams({ forumId: id }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };
  const activeForumIdRef = useRef(activeForumId);
  activeForumIdRef.current = activeForumId;
  useEffect(() => {
    if (urlForumId && urlForumId !== activeForumIdRef.current) {
      setActiveForumId_(urlForumId);
    }
  }, [urlForumId]);
  const lastForumIdRef = useRef<string>("");
  const [showPostForm, setShowPostForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("frage");
  const [sketch, setSketch] = useState<string | undefined>(undefined);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);
  const [linkedScriptIds, setLinkedScriptIds] = useState<string[]>([]);
  const [scriptPickerOpen, setScriptPickerOpen] = useState(false);
  const [linkedDeadlineIds, setLinkedDeadlineIds] = useState<string[]>([]);
  const [deadlinePickerOpen, setDeadlinePickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string>("alle");
  const [sort, setSort] = useState<Sort>("neu");

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ postId: string; postTitle: string } | null>(null);
  const [fName, setFName] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fVorlesung, setFVorlesung] = useState("");
  const [fProfessor, setFProfessor] = useState("");
  const [fStandort, setFStandort] = useState<string>("");
  const [selectedInvitees, setSelectedInvitees] = useState<{ userId: string; displayName: string }[]>([]);
  const [inviteeSearch, setInviteeSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [fSectionId, setFSectionId] = useState<string>("");
  const [fVisibility, setFVisibility] = useState<"public" | "private">("public");
  const [postFiles, setPostFiles] = useState<{ name: string; storageId: string; fileType: string; fileSize: number }[]>([]);
  const [postDeadlineId, setPostDeadlineId] = useState<string>("");
  const [joinCode, setJoinCode] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawForums: any[] = useMemo(() => {
    let arr: any[] = (forumsQuery ?? []) as any[];
    if (isAdmin && adminViewKurs && adminViewKurs !== "ALL") {
      arr = arr.filter(
        (f: any) => f.kurs && f.kurs === adminViewKurs.toUpperCase()
      );
    }
    return arr;
  }, [forumsQuery, isAdmin, adminViewKurs]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pubScripts: FScriptItem[] = useMemo(
    () =>
      (allScriptsQuery ?? []).map((s: any) => ({
        id: s._id,
        title: s.title,
        subject: s.subject,
      })),
    [allScriptsQuery]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allDeadlines: { _id: string; title: string; date: string; category: string; done: boolean }[] = useMemo(
    () =>
      (allDeadlinesQuery ?? []).map((d: any) => ({
        _id: d._id,
        title: d.title,
        date: d.date,
        category: d.category,
        done: d.done,
      })),
    [allDeadlinesQuery]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sections: FSectionItem[] = useMemo(
    () => (sectionsQuery ?? []) as FSectionItem[],
    [sectionsQuery]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myLectures: { _id: string; lectureName: string }[] = useMemo(
    () => (myLecturesQuery ?? []).map((l: any) => ({ _id: l._id, lectureName: l.lectureName })),
    [myLecturesQuery]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const forums: FForumItem[] = useMemo(
    () =>
      rawForums.map((f: any) => ({
        id: f._id,
        name: f.name,
        visibility: f.visibility,
        description: f.description ?? "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        members: (f.members ?? []).map((m: any) => ({
          userId: m.userId ?? m,
          displayName: m.displayName ?? m,
        })),
        ownerId: f.ownerId,
        inviteCode: f.inviteCode,
        kurs: f.kurs,
        vorlesung: f.vorlesung,
        professor: f.professor,
        standort: f.standort,
        sectionId: f.sectionId,
        archivedByMe: f.archivedByMe,
        deadlineId: f.deadlineId,
      })),
    [rawForums]
  );

  const derivedForumId = activeForumId || (forums.length > 0 ? forums[0].id : "");
  const effectiveForumId = derivedForumId || lastForumIdRef.current;
  if (derivedForumId) lastForumIdRef.current = derivedForumId;

  const activeForum = useMemo(
    () => forums.find((f) => f.id === effectiveForumId),
    [forums, effectiveForumId]
  );

  // Posts for active forum
  const postsQuery = useQuery(
    api.posts.listByForum,
    effectiveForumId ? { forumId: effectiveForumId as Id<"forums"> } : "skip"
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawPosts: any[] = (postsQuery ?? []) as any[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allPosts: FPostItem[] = useMemo(
    () =>
      rawPosts.map((p: any) => ({
        id: p._id,
        _creationTime: p._creationTime,
        authorName: p.authorName,
        authorId: p.authorId,
        title: p.title,
        content: p.content,
        tag: p.tag,
        liked: p.liked ?? false,
        likeCount: p.likeCount ?? 0,
        commentCount: (p.comments ?? []).length,
        sketch: p.sketch,
        linkedScriptIds: p.linkedScriptIds,
        linkedDeadlineIds: p.linkedDeadlineIds,
        updatedAt: p.updatedAt,
        standort: p.standort,
        studiengang: p.studiengang,
        kurs: p.kurs,
        vorlesung: p.vorlesung,
        professor: p.professor,
      })),
    [rawPosts]
  );

  const publicForums = useMemo(() => forums.filter((f) => f.visibility === "public"), [forums]);
  const privateForums = useMemo(() => forums.filter((f) => f.visibility === "private"), [forums]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allPosts
      .filter((p) => {
        if (!myKurs) return true;
        return true;
      })
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          (p.kurs ?? "").toLowerCase().includes(q) ||
          (p.standort ?? "").toLowerCase().includes(q)
      )
      .filter((p) => activeTag === "alle" || p.tag === activeTag)
      .sort((a, b) => (sort === "beliebt" ? b.likeCount - a.likeCount : b._creationTime - a._creationTime));
  }, [allPosts, search, activeTag, sort, myKurs]);

  const isMember = activeForum?.members?.some((m) => m.userId === me) ?? false;
  const isOwner = !!activeForum?.ownerId && activeForum.ownerId === me;

  const postTitleError = title.trim().length > 0 && title.trim().length < 5 ? language.match({ english: () => "At least 5 characters.", german: () => "Mindestens 5 Zeichen." }) : "";
  const postContentError = content.trim().length > 0 && content.trim().length < 10 ? language.match({ english: () => "At least 10 characters.", german: () => "Mindestens 10 Zeichen." }) : "";
  const forumNameError = fName.trim().length > 0 && fName.trim().length < 3 ? language.match({ english: () => "At least 3 characters.", german: () => "Mindestens 3 Zeichen." }) : "";
  const joinCodeError = joinCode.trim().length > 0 && joinCode.trim().length !== 6 ? language.match({ english: () => "The invitation code has 6 characters.", german: () => "Der Einladungscode hat 6 Zeichen." }) : "";

  const addPost = async () => {
    if (title.trim().length < 5 || content.trim().length < 10) return;
    if (!activeForum) return;
    try {
      await createPostMutation({
        forumId: activeForum.id as Id<"forums">,
        title: title.trim(),
        content: content.trim(),
        tag: tag as "frage" | "material" | "diskussion",
        sketch,
        linkedScriptIds: linkedScriptIds.length ? (linkedScriptIds as Id<"scripts">[]) : undefined,
        linkedDeadlineIds: linkedDeadlineIds.length ? (linkedDeadlineIds as Id<"deadlines">[]) : undefined,
      });
      setTitle("");
      setContent("");
      setSketch(undefined);
      setLinkedScriptIds([]);
      setLinkedDeadlineIds([]);
      setShowPostForm(false);
    } catch {
      toast.error(language.match({ english: () => "Error publishing", german: () => "Fehler beim Veröffentlichen" }));
    }
  };

  const toggleLike = async (id: string) => {
    if (!me) return;
    try {
      await toggleLikeMutation({ postId: id as Id<"posts"> });
    } catch {
      // Convex auto-revalidates, nothing extra needed
    }
  };

  const handleCreateForum = async () => {
    if (fName.trim().length < 3) {
      toast.error(language.match({ english: () => "Please choose a longer forum name", german: () => "Bitte einen längeren Forum-Namen vergeben" }));
      return;
    }
    if (!fSectionId) {
      toast.error(language.match({ english: () => "Please select a section", german: () => "Bitte eine Sektion auswählen" }));
      return;
    }
    const selectedSection = sections.find((s) => s._id === fSectionId);
    const isDeinKurs = selectedSection?.name === "Dein Jahrgang";
    try {
      const result = await createForumMutation({
        name: fName,
        description: fDesc,
        visibility: fVisibility,
        vorlesung: fVorlesung || undefined,
        professor: fProfessor || undefined,
        standort: fStandort || profile?.hochschule || undefined,
        kurs: isDeinKurs ? myKurs : undefined,
        sectionId: fSectionId as any,
      });
      if (fVisibility === "public" && isDeinKurs && myKurs) {
        await inviteKursMutation({
          forumId: result.forumId as Id<"forums">,
          forumName: fName,
          kurs: myKurs,
          fromName: displayName,
        });
      } else if (fVisibility === "private" && selectedInvitees.length > 0) {
        await inviteMutation({
          forumId: result.forumId as Id<"forums">,
          forumName: fName,
          recipientIds: selectedInvitees.map((p) => p.userId),
          recipientNames: selectedInvitees.map((p) => p.displayName),
          fromName: displayName,
        });
      }
      const inviteCount = fVisibility === "public" && isDeinKurs
        ? language.match({ english: () => "all members of your course", german: () => "alle Mitglieder deines Kurses" })
        : `${selectedInvitees.length} ${language.match({ english: () => "invitation(s)", german: () => "Einladung(en)" })}`;
      toast.success(`${language.match({ english: () => "Forum", german: () => "Forum" })} „${fName}" ${language.match({ english: () => "created", german: () => "erstellt" })} · ${inviteCount} ${language.match({ english: () => "sent", german: () => "versendet" })}`);
      resetForumForm();
      setCreateOpen(false);
      setActiveForumId(result.forumId);
    } catch {
      toast.error(language.match({ english: () => "Error creating forum", german: () => "Fehler beim Erstellen des Forums" }));
    }
  };

  const handleJoinByCode = async () => {
    if (joinCode.trim().length !== 6) return;
    try {
      const result = await joinByCodeMutation({ code: joinCode.trim() });
      toast.success(language.match({ english: () => "Joined", german: () => "Beigetreten" }));
      setJoinCode("");
      setJoinOpen(false);
      setActiveForumId(result.forumId);
    } catch {
      toast.error(language.match({ english: () => "Invalid code", german: () => "Code ungültig" }));
    }
  };

  const handleJoinPublic = async (id: string) => {
    try {
      await joinMutation({ forumId: id as Id<"forums"> });
      toast.success(language.match({ english: () => "Joined", german: () => "Beigetreten" }));
    } catch {
      toast.error(language.match({ english: () => "Error joining", german: () => "Fehler beim Beitreten" }));
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm(language.match({ english: () => "Really delete post?", german: () => "Beitrag wirklich löschen?" }))) return;
    try {
      await deletePostMutation({ postId: postId as Id<"posts"> });
      toast.success(language.match({ english: () => "Post deleted", german: () => "Beitrag gelöscht" }));
    } catch {
      toast.error(language.match({ english: () => "Error deleting", german: () => "Fehler beim Löschen" }));
    }
  };

  const handleLeave = async (id: string) => {
    try {
      await leaveMutation({ forumId: id as Id<"forums"> });
      setActiveForumId("");
    } catch {
      toast.error(language.match({ english: () => "Error leaving", german: () => "Fehler beim Verlassen" }));
    }
  };

  const resetForumForm = () => {
    setFName("");
    setFDesc("");
    setFVorlesung("");
    setFProfessor("");
    setFStandort("");
    setFVisibility("public");
    setSelectedInvitees([]);
    setInviteeSearch("");
    setHighlightIndex(0);
    setFSectionId("");
  };

  const selectInvitee = (p: { userId: string; displayName: string }) => {
    setSelectedInvitees((prev) => [...prev, p]);
    setInviteeSearch("");
    setHighlightIndex(0);
  };

  const removeInvitee = (userId: string) => {
    setSelectedInvitees((prev) => prev.filter((s) => s.userId !== userId));
  };

  const getFilteredInvitees = () =>
    ((kursPeopleQuery as { userId: string; displayName: string }[]) ?? []).filter(
      (p) =>
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

  const tags = [
    { id: "alle" as const, label: language.match({ english: () => "All", german: () => "Alle" }) },
    { id: "frage" as const, label: language.match({ english: () => "Questions", german: () => "Fragen" }) },
    { id: "material" as const, label: language.match({ english: () => "Material", german: () => "Material" }) },
    { id: "diskussion" as const, label: language.match({ english: () => "Discussions", german: () => "Diskussionen" }) },
  ];

  return (
    <ForumPageLayout
      forums={forums}
      sections={sections}
      activeForum={activeForum}
      activeForumId={activeForumId}
      setActiveForumId={setActiveForumId}
      publicForums={publicForums}
      privateForums={privateForums}
      isMember={isMember}
      isOwner={isOwner}
      me={me}
      navigate={navigate}
      createOpen={createOpen}
      setCreateOpen={setCreateOpen}
      joinOpen={joinOpen}
      setJoinOpen={setJoinOpen}
      fName={fName}
      setFName={setFName}
      fDesc={fDesc}
      setFDesc={setFDesc}
      fVorlesung={fVorlesung}
      setFVorlesung={setFVorlesung}
      fProfessor={fProfessor}
      setFProfessor={setFProfessor}
      fStandort={fStandort}
      setFStandort={setFStandort}
      selectedInvitees={selectedInvitees}
      inviteeSearch={inviteeSearch}
      setInviteeSearch={setInviteeSearch}
      highlightIndex={highlightIndex}
      setHighlightIndex={setHighlightIndex}
      selectInvitee={selectInvitee}
      removeInvitee={removeInvitee}
      getFilteredInvitees={getFilteredInvitees}
      handleInviteeKeyDown={handleInviteeKeyDown}
      fSectionId={fSectionId}
      setFSectionId={setFSectionId}
      fVisibility={fVisibility}
      setFVisibility={setFVisibility}
      forumNameError={forumNameError}
      myLectures={myLectures}
      handleCreateForum={handleCreateForum}
      resetForumForm={resetForumForm}
      joinCode={joinCode}
      setJoinCode={setJoinCode}
      joinCodeError={joinCodeError}
      handleJoinByCode={handleJoinByCode}
      handleJoinPublic={handleJoinPublic}
      handleLeave={handleLeave}
      showPostForm={showPostForm}
      setShowPostForm={setShowPostForm}
      title={title}
      setTitle={setTitle}
      content={content}
      setContent={setContent}
      tag={tag}
      setTag={setTag}
      sketch={sketch}
      setSketch={setSketch}
      whiteboardOpen={whiteboardOpen}
      setWhiteboardOpen={setWhiteboardOpen}
      linkedScriptIds={linkedScriptIds}
      setLinkedScriptIds={setLinkedScriptIds}
      scriptPickerOpen={scriptPickerOpen}
      setScriptPickerOpen={setScriptPickerOpen}
      pubScripts={pubScripts}
      allDeadlines={allDeadlines}
      linkedDeadlineIds={linkedDeadlineIds}
      setLinkedDeadlineIds={setLinkedDeadlineIds}
      deadlinePickerOpen={deadlinePickerOpen}
      setDeadlinePickerOpen={setDeadlinePickerOpen}
      postTitleError={postTitleError}
      postContentError={postContentError}
      addPost={addPost}
      filtered={filtered}
      search={search}
      setSearch={setSearch}
      sort={sort}
      setSort={setSort}
      activeTag={activeTag}
      setActiveTag={setActiveTag}
      tags={tags}
      toggleLike={toggleLike}
      myKurs={myKurs}
      reportTarget={reportTarget}
      setReportTarget={setReportTarget}
      reportedBy={displayName}
      isAdmin={isAdmin}
      adminViewKurs={adminViewKurs}
      setAdminViewKurs={setAdminViewKurs}
      handleDeletePost={handleDeletePost}
      archiveForum={async (forumId: string) => { try { await archiveForumMutation({ forumId: forumId as any }); toast.success(language.match({ english: () => "Forum archived", german: () => "Forum archiviert" })); } catch { toast.error(language.match({ english: () => "Error archiving", german: () => "Fehler beim Archivieren" })); } }}
      unarchiveForum={async (forumId: string) => { try { await unarchiveForumMutation({ forumId: forumId as any }); toast.success(language.match({ english: () => "Forum restored", german: () => "Forum rückgängig" })); } catch { toast.error(language.match({ english: () => "Error restoring", german: () => "Fehler beim Rückgängig" })); } }}
      postsQuery={postsQuery}
      deleteForumMutation={deleteForumMutation}
    />
  );
}

// ── Shared layout ──

const ForumItem = ({
  f,
  activeForumId,
  setActiveForumId,
}: {
  f: FForumItem;
  activeForumId: string;
  setActiveForumId: (id: string) => void;
}) => {
  const { language } = useLanguage();
  const Icon = f.visibility === "public" ? Hash : Lock;
  const active = f.id === activeForumId;
  return (
    <div
      className={`group flex items-center rounded-lg transition-colors ${active ? "bg-primary/10" : "hover:bg-secondary/60"
        }`}
    >
      <button
        onClick={() => setActiveForumId(f.id)}
        className={`flex-1 text-left px-3 py-2 flex items-center gap-2 min-w-0 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          }`}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="text-sm font-medium truncate flex-1">{f.name}</span>
        <span className="text-[10px] text-muted-foreground/70 shrink-0">{f.members.length}</span>
      </button>
      <Link
        to={`/forum/${f.id}`}
        className="px-2 py-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"
        title={language.match({ english: () => "Open details", german: () => "Detailansicht öffnen" })}
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
};

function ForumPageLayout({
  forums,
  sections,
  activeForum,
  activeForumId,
  setActiveForumId,
  publicForums,
  privateForums,
  isMember,
  isOwner,
  me,
  navigate,
  createOpen,
  setCreateOpen,
  joinOpen,
  setJoinOpen,
  fName,
  setFName,
  fDesc,
  setFDesc,
  fVorlesung,
  setFVorlesung,
  fProfessor,
  setFProfessor,
  fStandort,
  setFStandort,
  selectedInvitees,
  inviteeSearch,
  setInviteeSearch,
  highlightIndex,
  setHighlightIndex,
  selectInvitee,
  removeInvitee,
  getFilteredInvitees,
  handleInviteeKeyDown,
  fSectionId,
  setFSectionId,
  fVisibility,
  setFVisibility,
  forumNameError,
  handleCreateForum,
  resetForumForm,
  joinCode,
  setJoinCode,
  joinCodeError,
  handleJoinByCode,
  handleJoinPublic,
  handleLeave,
  showPostForm,
  setShowPostForm,
  title,
  setTitle,
  content,
  setContent,
  tag,
  setTag,
  sketch,
  setSketch,
  whiteboardOpen,
  setWhiteboardOpen,
  linkedScriptIds,
  setLinkedScriptIds,
  scriptPickerOpen,
  setScriptPickerOpen,
  pubScripts,
  allDeadlines,
  linkedDeadlineIds,
  setLinkedDeadlineIds,
  deadlinePickerOpen,
  setDeadlinePickerOpen,
  postTitleError,
  postContentError,
  addPost,
  filtered,
  search,
  setSearch,
  sort,
  setSort,
  activeTag,
  setActiveTag,
  tags,
  toggleLike,
  myKurs,
  reportTarget,
  setReportTarget,
  reportedBy,
  isAdmin,
  adminViewKurs,
  setAdminViewKurs,
  handleDeletePost,
  archiveForum,
  unarchiveForum,
  postsQuery,
  myLectures,
  deleteForumMutation,
}: {
  forums: FForumItem[];
  sections: FSectionItem[];
  activeForum: FForumItem | undefined;
  activeForumId: string;
  setActiveForumId: (id: string) => void;
  publicForums: FForumItem[];
  privateForums: FForumItem[];
  isMember: boolean;
  isOwner: boolean;
  me: string;
  navigate: ReturnType<typeof useNavigate>;
  createOpen: boolean;
  setCreateOpen: (v: boolean) => void;
  joinOpen: boolean;
  setJoinOpen: (v: boolean) => void;
  fName: string;
  setFName: (v: string) => void;
  fDesc: string;
  setFDesc: (v: string) => void;
  fVorlesung: string;
  setFVorlesung: (v: string) => void;
  fProfessor: string;
  setFProfessor: (v: string) => void;
  fStandort: string;
  setFStandort: (v: string) => void;
  selectedInvitees: { userId: string; displayName: string }[];
  inviteeSearch: string;
  setInviteeSearch: (v: string) => void;
  highlightIndex: number;
  setHighlightIndex: (v: number) => void;
  selectInvitee: (p: { userId: string; displayName: string }) => void;
  removeInvitee: (userId: string) => void;
  getFilteredInvitees: () => { userId: string; displayName: string }[];
  handleInviteeKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  fSectionId: string;
  setFSectionId: (v: string) => void;
  fVisibility: "public" | "private";
  setFVisibility: (v: "public" | "private") => void;
  forumNameError: string;
  handleCreateForum: () => void;
  resetForumForm: () => void;
  joinCode: string;
  setJoinCode: (v: string) => void;
  joinCodeError: string;
  handleJoinByCode: () => void;
  handleJoinPublic: (id: string) => void;
  handleLeave: (id: string) => void;
  showPostForm: boolean;
  setShowPostForm: (v: boolean) => void;
  title: string;
  setTitle: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  tag: string;
  setTag: (v: any) => void;
  sketch?: string;
  setSketch: (v: string | undefined) => void;
  whiteboardOpen: boolean;
  setWhiteboardOpen: (v: boolean) => void;
  linkedScriptIds: string[];
  setLinkedScriptIds: (v: string[]) => void;
  scriptPickerOpen: boolean;
  setScriptPickerOpen: (v: boolean) => void;
  pubScripts: FScriptItem[];
  allDeadlines: { _id: string; title: string; date: string; category: string; done: boolean }[];
  linkedDeadlineIds: string[];
  setLinkedDeadlineIds: (v: string[]) => void;
  deadlinePickerOpen: boolean;
  setDeadlinePickerOpen: (v: boolean) => void;
  postTitleError: string;
  postContentError: string;
  addPost: () => void;
  filtered: FPostItem[];
  search: string;
  setSearch: (v: string) => void;
  sort: Sort;
  setSort: (v: Sort) => void;
  activeTag: string;
  setActiveTag: (v: any) => void;
  tags: { id: string; label: string }[];
  toggleLike: (id: string) => void;
  myKurs?: string;
  reportTarget: { postId: string; postTitle: string } | null;
  setReportTarget: (v: { postId: string; postTitle: string } | null) => void;
  reportedBy: string;
  isAdmin: boolean;
  adminViewKurs: string;
  setAdminViewKurs: (v: string) => void;
  handleDeletePost: (postId: string) => void;
  archiveForum: (forumId: string) => Promise<void>;
  unarchiveForum: (forumId: string) => Promise<void>;
  postsQuery: any;
  myLectures: { _id: string; lectureName: string }[];
  deleteForumMutation: (args: any) => any;
}) {
  const { language } = useLanguage();
  const tTagLabels: Record<string, string> = {
    frage: language.match({ english: () => "Question", german: () => "Frage" }),
    material: language.match({ english: () => "Material", german: () => "Material" }),
    diskussion: language.match({ english: () => "Discussion", german: () => "Diskussion" }),
  };
  const [archiveOpen, setArchiveOpen] = useState(true);
  const SectionCard = ({ title, icon, forums: secForums, activeForumId, setActiveForumId, me }: {
    title: string;
    icon: React.ReactNode;
    forums: FForumItem[];
    activeForumId: string;
    setActiveForumId: (id: string) => void;
    me: string;
  }) => {
    const [expanded, setExpanded] = useState(false);
    const [secSearch, setSecSearch] = useState("");
    const filteredSec = secForums.filter((f) =>
      f.name.toLowerCase().includes(secSearch.toLowerCase())
    );
    const visibleSec = expanded ? filteredSec : filteredSec.slice(0, 4);

    return (
      <>
        {title && (
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1">
              {icon} {title}
            </p>
          </div>
        )}
        {secForums.length > 4 && (
          <div className="relative mb-2">
            <Search className="h-3 w-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={language.match({ english: () => "Search forum…", german: () => "Forum suchen…" })}
              value={secSearch}
              onChange={(e) => setSecSearch(e.target.value)}
              className="h-7 pl-7 text-xs"
            />
          </div>
        )}
        <div className="space-y-0.5">
          {visibleSec.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1 py-2">{language.match({ english: () => "No forums", german: () => "Keine Foren" })}</p>
          ) : (
            visibleSec.map((f) => (
              <div
                key={f.id}
                className={`group flex items-center rounded-lg transition-colors ${f.id === activeForumId ? "bg-primary/10" : "hover:bg-secondary/60"
                  }`}
              >
                <button
                  onClick={() => setActiveForumId(f.id)}
                  className={`flex-1 text-left px-3 py-2 flex items-center gap-2 min-w-0 ${f.id === activeForumId ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                >
                  <Hash className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-sm font-medium truncate flex-1">{f.name}</span>
                  <span className="text-[10px] text-muted-foreground/70 shrink-0">{f.members.length}</span>
                </button>
                <Link
                  to={`/forum/${f.id}`}
                  className="px-2 py-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"
                  title={language.match({ english: () => "Open details", german: () => "Detailansicht öffnen" })}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))
          )}
        </div>
        {filteredSec.length > 4 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-xs text-muted-foreground hover:text-foreground mt-1.5 py-1 transition-colors"
          >
            {expanded ? language.match({ english: () => "Show less", german: () => "Weniger anzeigen" }) : `${filteredSec.length - 4} ${language.match({ english: () => "more", german: () => "weitere" })} ${language.match({ english: () => "show", german: () => "anzeigen" })}`}
          </button>
        )}
      </>
    );
  };

  const formatDate = (ts: number) => {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return language.match({ english: () => "just now", german: () => "gerade eben" });
    if (m < 60) return language.match({ english: () => `${m} min ago`, german: () => `vor ${m} Min` });
    const h = Math.floor(m / 60);
    if (h < 24) return language.match({ english: () => `${h} hrs ago`, german: () => `vor ${h} Std` });
    return new Date(ts).toLocaleDateString("de-DE");
  };

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success(language.match({ english: () => "Code copied", german: () => "Code kopiert" }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 md:pt-24 pb-16 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
              {(() => {
                const sectionMap = new Map<string, FForumItem[]>();
                const noSection: FForumItem[] = [];

                for (const f of forums) {
                  if (f.archivedByMe) continue;
                  if (f.sectionId) {
                    const arr = sectionMap.get(f.sectionId) || [];
                    arr.push(f);
                    sectionMap.set(f.sectionId, arr);
                  } else {
                    noSection.push(f);
                  }
                }

                const myKursSection = sections.find((s) => s.name === "Dein Jahrgang");
                const sziSection = sections.find((s) => s.name === "SZI");
                const connectSection = sections.find((s) => s.name === "Campus");

                // Collect orphaned forums whose sectionId doesn't match any existing section
                const validSectionIds = new Set(sections.map(s => s._id));
                for (const f of forums) {
                  if (f.archivedByMe) continue;
                  if (f.sectionId && !validSectionIds.has(f.sectionId)) {
                    const arr = sectionMap.get(f.sectionId) || [];
                    if (arr.includes(f)) {
                      sectionMap.set(f.sectionId, arr.filter(x => x !== f));
                    }
                    noSection.push(f);
                  }
                }

                // Private forums visible to user (exclude ones already in a section to avoid duplicates)
                const userPrivateForums = privateForums.filter(
                  (f) => (f.members.some((m) => m.userId === me) || isAdmin) && !f.sectionId
                );

                const sectionTitle = isAdmin && adminViewKurs && adminViewKurs !== "ALL"
                  ? `${language.match({ english: () => "Course", german: () => "Kurs" })} ${adminViewKurs}`
                  : myKurs
                    ? `${language.match({ english: () => "Course", german: () => "Kurs" })} ${myKurs}`
                    : language.match({ english: () => "Your Year", german: () => "Dein Jahrgang" });
                const sectionsDef = [
                  { title: sectionTitle, icon: <Hash className="h-3.5 w-3.5" />, sectionId: myKursSection?._id, extra: userPrivateForums },
                  { title: language.match({ english: () => "SZI", german: () => "SZI" }), icon: <Hash className="h-3.5 w-3.5" />, sectionId: sziSection?._id },
                  { title: language.match({ english: () => "Campus", german: () => "Campus" }), icon: <Hash className="h-3.5 w-3.5" />, sectionId: connectSection?._id },
                ];

                return (
                  <div className="glass-card p-4 space-y-0">
                    {/* Header: actions */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-heading font-semibold text-sm">{language.match({ english: () => "Forums", german: () => "Foren" })}</h3>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setJoinOpen(true)} title={language.match({ english: () => "Join private forum", german: () => "Privatem Forum beitreten" })}>
                          <LogIn className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCreateOpen(true)} title={language.match({ english: () => "Create new forum", german: () => "Neues Forum erstellen" })}>
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="mb-3">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 px-1 flex items-center gap-1">
                          <Shield className="h-3 w-3" /> {language.match({ english: () => "Admin: Filter course", german: () => "Admin: Kurs filtern" })}
                        </p>
                        <Select value={adminViewKurs} onValueChange={setAdminViewKurs}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder={language.match({ english: () => "All courses", german: () => "Alle Kurse" })} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">{language.match({ english: () => "All courses", german: () => "Alle Kurse" })}</SelectItem>
                            {KURSE.map((jg) => (
                              <SelectItem key={jg} value={jg}>{jg}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {sectionsDef.map((s, i) => (
                      <div key={s.title} className={i === 0 ? "mt-10" : ""}>
                        {i > 0 && <hr className="border-t border-border my-3" />}
                        <SectionCard title={s.title} icon={s.icon} forums={[...(s.sectionId ? sectionMap.get(s.sectionId) || [] : []), ...(s.extra || [])]} activeForumId={activeForumId} setActiveForumId={setActiveForumId} me={me} />
                      </div>
                    ))}
                    {noSection.length > 0 && (
                      <div>
                        <hr className="border-t border-border my-3" />
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 px-1">{language.match({ english: () => "More", german: () => "Weitere" })}</p>
                        <div className="space-y-0.5">
                          {noSection.map((f) => (<ForumItem key={f.id} f={f} activeForumId={activeForumId} setActiveForumId={setActiveForumId} />))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Archive section */}
              {(() => {
                if (isAdmin) return null;
                const archivedForums = forums.filter(
                  (f) => f.archivedByMe
                );
                if (archivedForums.length === 0) return null;
                return (
                  <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <button onClick={() => setArchiveOpen(!archiveOpen)} className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary transition-colors">
                        <Archive className="h-3.5 w-3.5" /> {language.match({ english: () => "Archive", german: () => "Archiv" })}
                      </button>
                      <button onClick={() => setArchiveOpen(!archiveOpen)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        {archiveOpen ? language.match({ english: () => "Hide", german: () => "Ausblenden" }) : language.match({ english: () => "Show", german: () => "Einblenden" })}
                      </button>
                    </div>
                    {archiveOpen && (
                      <SectionCard title="" icon={null} forums={archivedForums} activeForumId={activeForumId} setActiveForumId={setActiveForumId} me={me} />
                    )}
                  </div>
                );
              })()}

              {activeForum && (
                <div className="glass-card p-4 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{language.match({ english: () => "Active forum", german: () => "Aktives Forum" })}</p>
                    <p className="font-semibold text-sm truncate">{activeForum.name}</p>
                    {activeForum.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{activeForum.description}</p>
                    )}
                  </div>
                  {(activeForum.kurs || activeForum.vorlesung || activeForum.professor || activeForum.standort) && (
                    <div className="flex flex-wrap gap-1">
                      {activeForum.standort && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{activeForum.standort}</span>)}
                      {activeForum.kurs && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent">{activeForum.kurs}</span>)}
                      {activeForum.vorlesung && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/80">{activeForum.vorlesung}</span>)}
                      {activeForum.professor && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/80">Prof. {activeForum.professor}</span>)}
                    </div>
                  )}
                  {activeForum.visibility === "private" && (
                    <div className="rounded-lg border bg-primary/5 p-2">
                      <p className="text-[10px] text-muted-foreground mb-1">{language.match({ english: () => "Invitation code", german: () => "Einladungscode" })}</p>
                      <div className="flex items-center gap-1">
                        <code className="flex-1 font-mono text-sm tracking-widest text-center py-1 rounded bg-background border">{activeForum.inviteCode}</code>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleCopy(activeForum.inviteCode)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" /> {activeForum.members.length} {language.match({ english: () => "Members", german: () => "Mitglieder" })}
                  </div>
                  <Link to={`/forum/${activeForum.id}`} className="block">
                    <Button size="sm" variant="outline" className="w-full gap-1.5">
                      <ExternalLink className="h-3.5 w-3.5" /> {language.match({ english: () => "Open details", german: () => "Detailansicht öffnen" })}
                    </Button>
                  </Link>
                  <div className="flex gap-2">
                    {isMember && (activeForum.visibility === "private" || (!isAdmin && !isOwner)) && (
                      <Button size="sm" variant="outline" className="w-full" onClick={() => handleLeave(activeForum.id)}>{language.match({ english: () => "Leave", german: () => "Verlassen" })}</Button>
                    )}
                    {isMember && (
                      activeForum.archivedByMe ? (
                        <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => unarchiveForum(activeForum.id)}>
                          <Archive className="h-3.5 w-3.5" /> {language.match({ english: () => "Restore", german: () => "Rückgängig" })}
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="w-full gap-1.5 text-destructive" onClick={() => archiveForum(activeForum.id)}>
                          <Archive className="h-3.5 w-3.5" /> {language.match({ english: () => "Archive", german: () => "Archivieren" })}
                        </Button>
                      )
                    )}
                    {isAdmin && (
                      <Button size="sm" variant="outline" className="w-full gap-1.5 text-destructive" onClick={async () => {
                        if (!window.confirm(language.match({ english: () => `Really delete forum "${activeForum.name}"? All posts, comments and files will be permanently deleted.`, german: () => `Forum „${activeForum.name}" wirklich löschen? Alle Beiträge, Kommentare und Dateien werden unwiderruflich gelöscht.` }))) return;
                        try { await deleteForumMutation({ forumId: activeForum.id as any }); toast.success(language.match({ english: () => "Forum deleted", german: () => "Forum gelöscht" })); setActiveForumId(""); } catch { toast.error(language.match({ english: () => "Error deleting", german: () => "Fehler beim Löschen" })); }
                      }}>
                        <Trash2 className="h-3.5 w-3.5" /> {language.match({ english: () => "Delete", german: () => "Löschen" })}
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
                    <span className="text-sm text-muted-foreground">{language.match({ english: () => "Community", german: () => "Community" })}</span>
                    {activeForum?.visibility === "private" && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        <Lock className="h-3 w-3" /> {language.match({ english: () => "Private", german: () => "Privat" })}
                      </span>
                    )}
                  </div>
                  <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight truncate">
                    {activeForum?.name || language.match({ english: () => "Forum", german: () => "Forum" })} <span className="text-gradient">{language.match({ english: () => "Forum", german: () => "Forum" })}</span>
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {activeForum?.description || language.match({ english: () => "Discussion in this forum", german: () => "Diskussion in diesem Forum" })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {isMember || isAdmin ? (
                    <Button onClick={() => setShowPostForm((v) => !v)} className="gap-2">
                      <Plus className="h-4 w-4" /> {language.match({ english: () => "New post", german: () => "Neuer Beitrag" })}
                    </Button>
                  ) : activeForum?.visibility === "public" ? (
                    <Button onClick={() => handleJoinPublic(activeForum.id)} className="gap-2">
                      <Users className="h-4 w-4" /> {language.match({ english: () => "Join", german: () => "Beitreten" })}
                    </Button>
                  ) : null}
                </div>
              </motion.div>

              {/* Post form */}
              <AnimatePresence>
                {showPostForm && (isAdmin || isMember) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="glass-card p-5 space-y-4">
                      <Input placeholder={language.match({ english: () => "Title of your post", german: () => "Titel deines Beitrags" })} value={title} onChange={(e) => setTitle(e.target.value)} />
                      {postTitleError && <p className="text-xs text-destructive">{postTitleError}</p>}
                      <Textarea placeholder={language.match({ english: () => "What do you want to share?", german: () => "Was möchtest du teilen?" })} value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="resize-none" />
                      {postContentError && <p className="text-xs text-destructive">{postContentError}</p>}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">{language.match({ english: () => "Category", german: () => "Kategorie" })}</p>
                        <div className="flex flex-wrap gap-2">
                          {(["frage", "material", "diskussion"] as const).map((t) => (
                            <button
                              key={t}
                              onClick={() => setTag(t)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${tag === t ? tagStyles[t] : "text-muted-foreground bg-secondary border-transparent"
                                }`}
                            >
                              {tTagLabels[t]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">{language.match({ english: () => "Whiteboard sketch", german: () => "Whiteboard-Skizze" })}</p>
                        {sketch ? (
                          <div className="relative inline-block">
                            <img src={sketch} alt={language.match({ english: () => "Sketch", german: () => "Skizze" })} className="max-h-40 rounded-lg border border-border bg-white" />
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" variant="outline" onClick={() => setWhiteboardOpen(true)}>{language.match({ english: () => "Edit", german: () => "Bearbeiten" })}</Button>
                              <Button size="sm" variant="ghost" onClick={() => setSketch(undefined)} className="gap-1">
                                <X className="h-3.5 w-3.5" /> {language.match({ english: () => "Remove", german: () => "Entfernen" })}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button type="button" variant="outline" size="sm" onClick={() => setWhiteboardOpen(true)} className="gap-2">
                            <Presentation className="h-4 w-4" /> {language.match({ english: () => "Add whiteboard sketch", german: () => "Whiteboard-Skizze hinzufügen" })}
                          </Button>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs text-muted-foreground">{language.match({ english: () => "Link scripts (public only)", german: () => "Skripte verlinken (nur öffentliche)" })}</p>
                          <Button type="button" size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setScriptPickerOpen(true)}>
                            <FileText className="h-3.5 w-3.5" /> {language.match({ english: () => "Select", german: () => "Auswählen" })}
                          </Button>
                        </div>
                        {linkedScriptIds.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground">{language.match({ english: () => "No scripts linked", german: () => "Keine Skripte verlinkt" })}</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {linkedScriptIds.map((id) => {
                              const s = pubScripts.find((x) => x.id === id);
                              if (!s) return null;
                              return (
                                <span key={id} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-success/10 text-success">
                                  <FileText className="h-3 w-3" />
                                  {s.title}
                                  <button type="button" onClick={() => setLinkedScriptIds((prev) => prev.filter((x) => x !== id))} className="ml-0.5 hover:text-destructive">
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs text-muted-foreground">{language.match({ english: () => "Link deadlines", german: () => "Deadlines verlinken" })}</p>
                          <Button type="button" size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setDeadlinePickerOpen(true)}>
                            <CalendarDays className="h-3.5 w-3.5" /> {language.match({ english: () => "Select", german: () => "Auswählen" })}
                          </Button>
                        </div>
                        {linkedDeadlineIds.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground">{language.match({ english: () => "No deadlines linked", german: () => "Keine Deadlines verlinkt" })}</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {linkedDeadlineIds.map((id) => {
                              const d = allDeadlines.find((x) => x._id === id);
                              if (!d) return null;
                              return (
                                <span key={id} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                                  <CalendarDays className="h-3 w-3" />
                                  {d.title}
                                  <button type="button" onClick={() => setLinkedDeadlineIds((prev) => prev.filter((x) => x !== id))} className="ml-0.5 hover:text-destructive">
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowPostForm(false)}>{language.match({ english: () => "Cancel", german: () => "Abbrechen" })}</Button>
                        <Button onClick={addPost}>{language.match({ english: () => "Publish", german: () => "Veröffentlichen" })}</Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search + Sort */}
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder={language.match({ english: () => "Search posts…", german: () => "Beiträge durchsuchen…" })} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <div className="flex gap-1 p-1 rounded-lg bg-secondary/60 w-fit">
                  <button
                    onClick={() => setSort("neu")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${sort === "neu" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                  >
                    <Clock className="h-3.5 w-3.5" /> {language.match({ english: () => "New", german: () => "Neu" })}
                  </button>
                  <button
                    onClick={() => setSort("beliebt")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${sort === "beliebt" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5" /> {language.match({ english: () => "Popular", german: () => "Beliebt" })}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {tags.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTag(t.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${activeTag === t.id
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
                {postsQuery === undefined && (
                  <div className="glass-card p-10 text-center">
                    <div className="animate-pulse h-10 w-10 bg-muted-foreground/20 rounded-full mx-auto mb-3" />
                    <p className="text-muted-foreground">{language.match({ english: () => "Loading…", german: () => "Laden…" })}</p>
                  </div>
                )}
                {postsQuery !== undefined && filtered.length === 0 && (
                  <div className="glass-card p-10 text-center">
                    <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">{language.match({ english: () => "No posts found", german: () => "Keine Beiträge gefunden" })}</p>
                  </div>
                )}
                {filtered.map((post) => {
                  const avatarColor = avatarColors[post.authorName.charCodeAt(0) % avatarColors.length];
                  return (
                    <article
                      key={post.id}
                      onClick={() => navigate(`/forum/${activeForum?.id}/post/${post.id}`)}
                      className="glass-card p-5 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`h-10 w-10 rounded-full ${avatarColor} flex items-center justify-center font-bold text-sm shrink-0`}>
                          {post.authorName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="text-sm font-semibold">{post.authorName}</span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(post._creationTime)}
                              {post.updatedAt && post.updatedAt > post._creationTime + 1000 && (
                                <> · <span className="italic">{language.match({ english: () => "edited", german: () => "bearbeitet" })}</span></>
                              )}
                            </span>
                            <Badge variant="outline" className={`${tagStyles[post.tag]} text-[10px] py-0 h-5 ml-auto`}>
                              {tTagLabels[post.tag]}
                            </Badge>
                          </div>
                          <h3 className="font-heading font-semibold text-base mb-1">{post.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                          {post.sketch && (
                            <img src={post.sketch} alt={language.match({ english: () => "Whiteboard sketch", german: () => "Whiteboard-Skizze" })} className="mt-3 max-h-64 rounded-lg border border-border bg-white" />
                          )}
                          {post.linkedScriptIds && post.linkedScriptIds.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {post.linkedScriptIds.map((id) => {
                                const s = pubScripts.find((x) => x.id === id);
                                if (!s) return null;
                                return (
                                  <Link key={id} to="/skripte" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success hover:bg-success/20">
                                    <FileText className="h-3 w-3" />
                                    {s.title}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                          {post.linkedDeadlineIds && post.linkedDeadlineIds.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {post.linkedDeadlineIds.map((id) => {
                                const d = allDeadlines.find((x) => x._id === id);
                                if (!d) return null;
                                return (
                                  <Link key={id} to="/planner" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning hover:bg-warning/20">
                                    <CalendarDays className="h-3 w-3" />
                                    {d.title}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                          {(post.standort || post.studiengang || post.kurs || post.vorlesung || post.professor) && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {post.standort && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{post.standort}</span>)}
                              {post.studiengang && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/80 font-medium">{post.studiengang}</span>)}
                              {post.kurs && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-medium">{post.kurs}</span>)}
                              {post.vorlesung && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/80 font-medium">{post.vorlesung}</span>)}
                              {post.professor && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/80 font-medium">Prof. {post.professor}</span>)}
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleLike(post.id); }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${post.liked ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                                }`}
                            >
                              <ThumbsUp className={`h-3.5 w-3.5 ${post.liked ? "fill-primary" : ""}`} />
                              {post.likeCount}
                            </button>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground">
                              <MessageCircle className="h-3.5 w-3.5" />
                              {post.commentCount}
                            </span>
                            {isAdmin && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePost(post.id);
                                }}
                                title={language.match({ english: () => "Delete post (Admin)", german: () => "Beitrag löschen (Admin)" })}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReportTarget({ postId: post.id, postTitle: post.title });
                              }}
                              title={language.match({ english: () => "Report post", german: () => "Beitrag melden" })}
                              className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                              <Flag className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </main>
          </div>
        </div>
      </div>

      <ReportDialog
        open={reportTarget !== null}
        onOpenChange={(open) => { if (!open) setReportTarget(null); }}
        postId={reportTarget?.postId ?? ""}
        postTitle={reportTarget?.postTitle ?? ""}
        forumName={activeForum?.name ?? language.match({ english: () => "Forum", german: () => "Forum" })}
        reportedBy={reportedBy}
      />

      {/* Create-forum dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> {language.match({ english: () => "Create new forum", german: () => "Neues Forum erstellen" })}</DialogTitle>
            <DialogDescription>
              {language.match({ english: () => "Choose a section and whether all course members are invited (public) or you invite people individually (private).", german: () => "Wähle eine Sektion und ob alle Kursmitglieder eingeladen werden (öffentlich) oder du Personen gezielt einlädst (privat)." })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder={language.match({ english: () => "Name of the forum (e.g. Math 2 – Prof. Müller)", german: () => "Name des Forums (z. B. Mathe 2 – Prof. Müller)" })} value={fName} onChange={(e) => setFName(e.target.value)} />
            {forumNameError && <p className="text-xs text-destructive">{forumNameError}</p>}
            <Textarea placeholder={language.match({ english: () => "Short description (optional)", german: () => "Kurzbeschreibung (optional)" })} value={fDesc} onChange={(e) => setFDesc(e.target.value)} rows={2} />

            <div>
              <p className="text-xs text-muted-foreground mb-2">{language.match({ english: () => "Section *", german: () => "Sektion *" })}</p>
              <select
                value={fSectionId}
                onChange={(e) => { setFSectionId(e.target.value); setFVorlesung(""); }}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{language.match({ english: () => "Select section", german: () => "Sektion auswählen" })}</option>
                {sections.filter((s) => ["Dein Jahrgang", "SZI", "Campus"].includes(s.name)).map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              {fSectionId && (() => {
                const sec = sections.find((s) => s._id === fSectionId);
                return sec?.name === "Dein Jahrgang" ? (
                  <select value={fVorlesung} onChange={(e) => setFVorlesung(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">{language.match({ english: () => "Lecture (optional)", german: () => "Vorlesung (optional)" })}</option>
                    {myLectures.map((l) => (<option key={l._id} value={l.lectureName}>{l.lectureName}</option>))
                    }
                  </select>
                ) : (
                  <Input placeholder={language.match({ english: () => "Lecture (optional)", german: () => "Vorlesung (optional)" })} value={fVorlesung} onChange={(e) => setFVorlesung(e.target.value)} />
                );
              })()}
              <Input placeholder={language.match({ english: () => "Professor (optional)", german: () => "Professor (optional)" })} value={fProfessor} onChange={(e) => setFProfessor(e.target.value)} />
              <select value={fStandort} onChange={(e) => setFStandort(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">{language.match({ english: () => "Location (optional)", german: () => "Standort (optional)" })}</option>
                {DHBW_STANDORTE.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">{language.match({ english: () => "Visibility & Invitations", german: () => "Sichtbarkeit & Einladungen" })}</p>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setFVisibility("public")}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${fVisibility === "public" ? "bg-primary/10 text-primary border-primary/30" : "text-muted-foreground bg-secondary border-transparent"
                    }`}
                >
                  <Globe className="h-4 w-4" /> {language.match({ english: () => "Public", german: () => "Öffentlich" })}
                </button>
                <button
                  onClick={() => setFVisibility("private")}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${fVisibility === "private" ? "bg-primary/10 text-primary border-primary/30" : "text-muted-foreground bg-secondary border-transparent"
                    }`}
                >
                  <Lock className="h-4 w-4" /> {language.match({ english: () => "Private", german: () => "Privat" })}
                </button>
              </div>
              {(() => {
                const sec = sections.find((s) => s._id === fSectionId);
                const isDeinKurs = sec?.name === "Dein Jahrgang";
                if (fVisibility === "public") {
                  return (
                    <p className="text-xs text-muted-foreground italic">
                      {isDeinKurs
                        ? language.match({ english: () => "All members of your course will be invited automatically.", german: () => "Alle Mitglieder deines Kurses werden automatisch eingeladen." })
                        : language.match({ english: () => "The forum is publicly visible and can be shared via invitation code.", german: () => "Das Forum ist öffentlich sichtbar und kann über den Einladungscode geteilt werden." })}
                    </p>
                  );
                }
                return (
                  <>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {selectedInvitees.map((s) => (
                        <Badge key={s.userId} variant="secondary" className="gap-1 pr-1 text-xs">
                          {s.displayName}
                          <button onClick={() => removeInvitee(s.userId)} className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5">
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
                        onFocus={() => { }}
                        onBlur={() => setTimeout(() => setInviteeSearch(""), 200)}
                        onKeyDown={handleInviteeKeyDown}
                        autoComplete="off"
                      />
                      {inviteeSearch && (() => {
                        const filtered = getFilteredInvitees().slice(0, 8);
                        const safeIndex = Math.min(highlightIndex, filtered.length - 1);
                        return (
                          <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-36 overflow-y-auto">
                            {filtered.length === 0 ? (
                              <p className="px-3 py-2 text-xs text-muted-foreground">{language.match({ english: () => "No people found", german: () => "Keine Personen gefunden" })}</p>
                            ) : (
                              filtered.map((p, i) => (
                                <button
                                  key={p.userId}
                                  type="button"
                                  className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${i === safeIndex ? "bg-accent" : "hover:bg-accent"}`}
                                  onMouseDown={(e) => { e.preventDefault(); selectInvitee(p); }}
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
                    <p className="text-[11px] text-muted-foreground mt-1">{language.match({ english: () => "Invited people will receive a notification and can accept or decline.", german: () => "Eingeladene Personen erhalten eine Benachrichtigung und können annehmen oder ablehnen." })}</p>
                  </>
                );
              })()}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => { resetForumForm(); setCreateOpen(false); }}>{language.match({ english: () => "Cancel", german: () => "Abbrechen" })}</Button>
              <Button onClick={handleCreateForum}>{language.match({ english: () => "Create forum", german: () => "Forum erstellen" })}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join dialog */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><LogIn className="h-5 w-5 text-primary" /> {language.match({ english: () => "Join forum", german: () => "Forum beitreten" })}</DialogTitle>
            <DialogDescription>{language.match({ english: () => "Enter the invitation code you received.", german: () => "Gib den Einladungscode ein, den du erhalten hast." })}</DialogDescription>
          </DialogHeader>
          <Input placeholder={language.match({ english: () => "e.g. AB12CD", german: () => "z. B. AB12CD" })} value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} className="font-mono text-center text-lg tracking-widest" maxLength={6} />
          {joinCodeError && <p className="text-xs text-destructive">{joinCodeError}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setJoinOpen(false)}>{language.match({ english: () => "Cancel", german: () => "Abbrechen" })}</Button>
            <Button onClick={handleJoinByCode}>{language.match({ english: () => "Join", german: () => "Beitreten" })}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={whiteboardOpen} onOpenChange={setWhiteboardOpen}>
        <DialogContent className="max-w-4xl h-[min(680px,90vh)] flex flex-col overflow-hidden">
          <DialogHeader><DialogTitle>{language.match({ english: () => "Whiteboard sketch", german: () => "Whiteboard-Skizze" })}</DialogTitle></DialogHeader>
          <Whiteboard fillHeight saveLabel={language.match({ english: () => "Apply sketch", german: () => "Skizze übernehmen" })} onSave={(dataUrl) => { setSketch(dataUrl); setWhiteboardOpen(false); }} />
        </DialogContent>
      </Dialog>

      {/* Deadline picker */}
      <Dialog open={deadlinePickerOpen} onOpenChange={setDeadlinePickerOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-warning" /> {language.match({ english: () => "Link deadlines", german: () => "Deadlines verlinken" })}
            </DialogTitle>
            <DialogDescription>{language.match({ english: () => "Select deadlines to be linked in this post.", german: () => "Wähle Deadlines aus, die in diesem Beitrag verlinkt werden sollen." })}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-1.5">
            {allDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{language.match({ english: () => "No deadlines available", german: () => "Keine Deadlines verfügbar" })}</p>
            ) : (
              allDeadlines.map((d) => {
                const checked = linkedDeadlineIds.includes(d._id);
                return (
                  <button
                    key={d._id}
                    onClick={() => setLinkedDeadlineIds((prev) => prev.includes(d._id) ? prev.filter((x) => x !== d._id) : [...prev, d._id])}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${checked ? "bg-warning/5 border-warning/40" : "border-border hover:bg-secondary/40"
                      } ${d.done ? "opacity-50" : ""}`}
                  >
                    <CalendarDays className="h-4 w-4 text-warning shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.title}</p>
                      <p className="text-xs text-muted-foreground">{d.date} · {d.category}</p>
                    </div>
                    {checked && <span className="text-xs text-warning font-medium">{language.match({ english: () => "Linked", german: () => "Verlinkt" })}</span>}
                  </button>
                );
              })
            )}
          </div>
          <div className="flex justify-end pt-2 border-t">
            <Button onClick={() => setDeadlinePickerOpen(false)}>{language.match({ english: () => "Done", german: () => "Fertig" })}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Script picker */}
      <Dialog open={scriptPickerOpen} onOpenChange={setScriptPickerOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> {language.match({ english: () => "Link scripts", german: () => "Skripte verlinken" })}</DialogTitle>
            <DialogDescription>{language.match({ english: () => "Only public scripts from the library can be linked.", german: () => "Nur öffentliche Skripte aus der Bibliothek können verlinkt werden." })}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-1.5">
            {pubScripts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{language.match({ english: () => "No public scripts available", german: () => "Keine öffentlichen Skripte verfügbar" })}</p>
            ) : (
              pubScripts.map((s) => {
                const sid = s.id;
                const checked = linkedScriptIds.includes(sid);
                return (
                  <button
                    key={sid}
                    onClick={() => setLinkedScriptIds((prev) => prev.includes(sid) ? prev.filter((x: string) => x !== sid) : [...prev, sid])}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${checked ? "bg-primary/5 border-primary/40" : "border-border hover:bg-secondary/40"
                      }`}
                  >
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.subject}</p>
                    </div>
                    {checked && <span className="text-xs text-primary font-medium">{language.match({ english: () => "Linked", german: () => "Verlinkt" })}</span>}
                  </button>
                );
              })
            )}
          </div>
          <div className="flex justify-end pt-2 border-t">
            <Button onClick={() => setScriptPickerOpen(false)}>{language.match({ english: () => "Done", german: () => "Fertig" })}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ForumPage;
