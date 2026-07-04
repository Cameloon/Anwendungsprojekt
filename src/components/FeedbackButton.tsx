import { useEffect, useState } from "react";
import {
  MessageCircleHeart,
  Send,
  Loader2,
  X,
  Bug,
  Lightbulb,
  ChevronDown,
  Check,
  Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useLanguage } from "@/hooks/useLanguage";

const FeedbackButton = () => {
  const { language } = useLanguage();

  const [open, setOpen] = useState(false);

  const ratings = language.match({
    english: () => [
      { emoji: "😞", label: "Bad", value: 1 },
      { emoji: "😐", label: "Okay", value: 2 },
      { emoji: "🙂", label: "Good", value: 3 },
      { emoji: "😍", label: "Great", value: 4 },
    ],
    german: () => [
      { emoji: "😞", label: "Schlecht", value: 1 },
      { emoji: "😐", label: "Okay", value: 2 },
      { emoji: "🙂", label: "Gut", value: 3 },
      { emoji: "😍", label: "Super", value: 4 },
    ],
  });

  const [rating, setRating] = useState<number | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  const [reportExpanded, setReportExpanded] = useState(false);
  const [reportType, setReportType] = useState<"bug" | "feature" | null>(null);
  const [reportMsg, setReportMsg] = useState("");
  const [sendingReport, setSendingReport] = useState(false);

  const existingFeedback = useQuery(api.feedback.getMyFeedback);
  const submitFeedback = useMutation(api.feedback.submit);
  const submitReport = useMutation(api.userReports.submit);

  const strings = language.match({
    english: () => ({
      feedbackButtonAria: "Give feedback",
      closeAria: "Close",
      feedbackLabel: "Feedback",
      feedbackSubtitle: "Idea, bug, or criticism",
      heading: "What would you like to tell us?",
      subheading: "Share your rating or report an issue.",
      sectionTitle: "General Feedback",
      feedbackPlaceholder: "Optional message\u2026",
      saving: "Saving\u2026",
      saved: "Saved",
      update: "Update",
      save: "Save",
      bugLabel: "Bug",
      featureLabel: "Feature Request",
      bugPlaceholder: "What went wrong? How can it be reproduced?",
      featurePlaceholder: "What would you like to see improved?",
      validationText: "At least 10 characters.",
      sending: "Sending\u2026",
      send: "Send",
      reportSection: "Report a bug or suggest an improvement",
      errorSaving: "Error saving.",
      errorNoType: "Please select a type.",
      errorShortMsg: "Please write at least 10 characters.",
      successReport: "Thank you for your feedback!",
      errorSending: "Error sending.",
    }),
    german: () => ({
      feedbackButtonAria: "Feedback geben",
      closeAria: "Schlie\u00dfen",
      feedbackLabel: "Feedback",
      feedbackSubtitle: "Idee, Fehler oder Kritik",
      heading: "Was m\u00f6chtest du uns sagen?",
      subheading: "Teile deine Einsch\u00e4tzung oder melde einen Fehler.",
      sectionTitle: "Allgemeines Feedback",
      feedbackPlaceholder: "Optionale Nachricht\u2026",
      saving: "Wird gespeichert\u2026",
      saved: "Gespeichert",
      update: "Aktualisieren",
      save: "Speichern",
      bugLabel: "Fehler",
      featureLabel: "Optimierungsvorschlag",
      bugPlaceholder:
        "Was ist schiefgelaufen? Wie l\u00e4sst sich das reproduzieren?",
      featurePlaceholder:
        "Was w\u00fcrdest du dir w\u00fcnschen oder verbessern?",
      validationText: "Mindestens 10 Zeichen.",
      sending: "Wird gesendet\u2026",
      send: "Senden",
      reportSection: "Fehler oder Optimierungsvorschlag mitteilen",
      errorSaving: "Fehler beim Speichern.",
      errorNoType: "Bitte w\u00e4hle einen Typ aus.",
      errorShortMsg: "Bitte schreibe mindestens 10 Zeichen.",
      successReport: "Danke f\u00fcr deinen Hinweis!",
      errorSending: "Fehler beim Senden.",
    }),
  });

  const reportTypeOptions = language.match({
    english: () =>
      [
        {
          value: "bug",
          label: "Bug",
          icon: Bug,
          activeClass:
            "border-destructive/50 bg-destructive/10 text-destructive",
          dotClass: "border-destructive",
          fillClass: "bg-destructive",
        },
        {
          value: "feature",
          label: "Feature Request",
          icon: Lightbulb,
          activeClass: "border-primary/50 bg-primary/10 text-primary",
          dotClass: "border-primary",
          fillClass: "bg-primary",
        },
      ] as const,
    german: () =>
      [
        {
          value: "bug",
          label: "Fehler",
          icon: Bug,
          activeClass:
            "border-destructive/50 bg-destructive/10 text-destructive",
          dotClass: "border-destructive",
          fillClass: "bg-destructive",
        },
        {
          value: "feature",
          label: "Optimierungsvorschlag",
          icon: Lightbulb,
          activeClass: "border-primary/50 bg-primary/10 text-primary",
          dotClass: "border-primary",
          fillClass: "bg-primary",
        },
      ] as const,
  });

  const hasExisting = existingFeedback != null;

  useEffect(() => {
    if (open && existingFeedback) {
      setRating(existingFeedback.rating);
      setFeedbackMsg(existingFeedback.message ?? "");
    }
  }, [open, existingFeedback]);

  const reset = () => {
    setRating(null);
    setFeedbackMsg("");
    setFeedbackSaved(false);
    setSavingFeedback(false);
    setReportExpanded(false);
    setReportType(null);
    setReportMsg("");
    setSendingReport(false);
  };

  const handleClose = (value: boolean) => {
    setOpen(value);
    if (!value) setTimeout(reset, 300);
  };

  const saveFeedback = async () => {
    if (rating === null) return;
    setSavingFeedback(true);
    try {
      await submitFeedback({
        rating,
        message: feedbackMsg.trim() || undefined,
      });
      setFeedbackSaved(true);
      setTimeout(() => setFeedbackSaved(false), 2000);
    } catch {
      toast.error(strings.errorSaving);
    } finally {
      setSavingFeedback(false);
    }
  };

  const sendReport = async () => {
    if (!reportType) {
      toast.error(strings.errorNoType);
      return;
    }
    if (reportMsg.trim().length < 10) {
      toast.error(strings.errorShortMsg);
      return;
    }
    setSendingReport(true);
    try {
      await submitReport({ type: reportType, message: reportMsg.trim() });
      toast.success(strings.successReport);
      handleClose(false);
    } catch {
      toast.error(strings.errorSending);
    } finally {
      setSendingReport(false);
    }
  };

  return (
    <>
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.35 }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full border border-border/70 bg-card/95 text-sm font-medium text-foreground shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80 hover:shadow-xl sm:h-auto sm:w-auto sm:gap-3 sm:px-4 sm:py-3 ${open ? "pointer-events-none opacity-0" : ""}`}
        aria-label={strings.feedbackButtonAria}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          {hasExisting ? (
            <Pencil className="h-5 w-5" />
          ) : (
            <MessageCircleHeart className="h-5 w-5" />
          )}
        </span>
        <span className="hidden sm:block text-left">
          <span className="block leading-tight">{strings.feedbackLabel}</span>
          <span className="block text-xs font-normal text-muted-foreground">
            {strings.feedbackSubtitle}
          </span>
        </span>
      </motion.button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          hideCloseButton
          className="overflow-hidden gap-0 p-0 sm:max-w-lg"
        >
          {/* Header */}
          <div className="relative border-b border-border bg-gradient-to-br from-primary/10 via-accent/5 to-transparent px-6 pb-5 pt-6">
            <button
              onClick={() => handleClose(false)}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
              aria-label={strings.closeAria}
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                <MessageCircleHeart className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {strings.feedbackLabel}
              </span>
            </div>
            <h3 className="font-heading text-xl font-bold">
              {strings.heading}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {strings.subheading}
            </p>
          </div>

          <div className="p-6">
            {/* Section 1: General Feedback */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {strings.sectionTitle}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {ratings.map((item) => (
                  <motion.button
                    key={item.value}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setRating(item.value);
                      setFeedbackSaved(false);
                    }}
                    className={`rounded-xl border-2 py-3 transition-all ${
                      rating === item.value
                        ? "scale-[1.03] border-primary bg-primary/5"
                        : "border-transparent bg-secondary/60 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <span className="block text-2xl">{item.emoji}</span>
                    <span
                      className={`mt-1 block text-[10px] font-medium ${
                        rating === item.value
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                  </motion.button>
                ))}
              </div>

              <AnimatePresence>
                {rating !== null && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-3">
                      <Textarea
                        placeholder={strings.feedbackPlaceholder}
                        value={feedbackMsg}
                        onChange={(e) => {
                          setFeedbackMsg(e.target.value);
                          setFeedbackSaved(false);
                        }}
                        rows={3}
                        disabled={savingFeedback}
                        className="resize-none"
                        maxLength={500}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          {feedbackMsg.length}/500
                        </span>
                        <Button
                          size="sm"
                          variant={feedbackSaved ? "outline" : "default"}
                          className={`gap-1.5 transition-all ${
                            feedbackSaved
                              ? "border-success/40 text-success hover:text-success"
                              : ""
                          }`}
                          disabled={savingFeedback}
                          onClick={saveFeedback}
                        >
                          {savingFeedback ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              {strings.saving}
                            </>
                          ) : feedbackSaved ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              {strings.saved}
                            </>
                          ) : hasExisting ? (
                            strings.update
                          ) : (
                            strings.save
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Section 2: Bug / Feature Report */}
            <div className="mt-5 border-t border-border/60 pt-5">
              <button
                onClick={() => setReportExpanded((v) => !v)}
                className="flex w-full items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Bug className="h-4 w-4 shrink-0" />
                  {strings.reportSection}
                </span>
                <motion.span
                  animate={{ rotate: reportExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.span>
              </button>

              <AnimatePresence>
                {reportExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        {reportTypeOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setReportType(opt.value)}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all ${
                              reportType === opt.value
                                ? opt.activeClass
                                : "border-border/60 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                                reportType === opt.value
                                  ? opt.dotClass
                                  : "border-muted-foreground/40"
                              }`}
                            >
                              {reportType === opt.value && (
                                <span
                                  className={`h-2 w-2 rounded-full ${opt.fillClass}`}
                                />
                              )}
                            </span>
                            <opt.icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{opt.label}</span>
                          </button>
                        ))}
                      </div>

                      <div>
                        <Textarea
                          placeholder={
                            reportType === "bug"
                              ? strings.bugPlaceholder
                              : strings.featurePlaceholder
                          }
                          value={reportMsg}
                          onChange={(e) => setReportMsg(e.target.value)}
                          rows={4}
                          disabled={sendingReport}
                          className="resize-none"
                          maxLength={1000}
                        />
                        <div className="mt-1 flex items-center justify-between">
                          {reportMsg.trim().length > 0 &&
                          reportMsg.trim().length < 10 ? (
                            <p className="text-xs font-medium text-destructive">
                              {strings.validationText}
                            </p>
                          ) : (
                            <span />
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {reportMsg.length}/1000
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={sendReport}
                        disabled={
                          sendingReport ||
                          !reportType ||
                          reportMsg.trim().length < 10
                        }
                        className="w-full gap-2"
                        size="lg"
                      >
                        {sendingReport ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {strings.sending}
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            {strings.send}
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FeedbackButton;
