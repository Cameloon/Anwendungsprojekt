import { useEffect, useState } from "react";
import {
  MessageCircleHeart,
  Send,
  Loader2,
  CheckCircle2,
  X,
  Bug,
  Lightbulb,
  Palette,
  Zap,
  Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

type Category = "bug" | "idee" | "lob" | "sonstiges";

const ratings = [
  { emoji: "😞", label: "Schlecht", value: 1 },
  { emoji: "😐", label: "Okay", value: 2 },
  { emoji: "🙂", label: "Gut", value: 3 },
  { emoji: "😍", label: "Super", value: 4 },
];

const categories: {
  id: Category;
  label: string;
  icon: typeof Bug;
  color: string;
}[] = [
  {
    id: "bug",
    label: "Fehler",
    icon: Bug,
    color: "text-destructive bg-destructive/10 border-destructive/20",
  },
  {
    id: "idee",
    label: "Funktion",
    icon: Lightbulb,
    color: "text-info bg-info/10 border-info/20",
  },
  {
    id: "lob",
    label: "Design",
    icon: Palette,
    color: "text-success bg-success/10 border-success/20",
  },
  {
    id: "sonstiges",
    label: "Performance",
    icon: Zap,
    color: "text-primary bg-primary/10 border-primary/20",
  },
];

const FeedbackButton = () => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const existingFeedback = useQuery(api.feedback.getMyFeedback);
  const submitFeedback = useMutation(api.feedback.submit);

  const hasExisting = existingFeedback != null;

  useEffect(() => {
    if (open && existingFeedback) {
      setRating(existingFeedback.rating);
      setCategory(existingFeedback.category as Category);
      setMessage(existingFeedback.message);
    }
  }, [open, existingFeedback]);

  const reset = () => {
    setRating(null);
    setCategory(null);
    setMessage("");
    setDone(false);
    setSending(false);
  };

  const handleClose = (value: boolean) => {
    setOpen(value);
    if (!value) setTimeout(reset, 300);
  };

  const submit = async () => {
    if (message.trim().length < 5) {
      toast.error("Bitte schreibe mindestens 5 Zeichen.");
      return;
    }
    if (rating === null || category === null) return;

    setSending(true);
    try {
      await submitFeedback({ rating, category, message });
      setDone(true);
      toast.success(
        hasExisting
          ? "Dein Feedback wurde aktualisiert."
          : "Danke! Deine Rückmeldung wurde gespeichert."
      );
      setTimeout(() => handleClose(false), 1800);
    } catch {
      toast.error("Fehler beim Speichern. Bitte versuche es erneut.");
    } finally {
      setSending(false);
    }
  };

  const selectedRating = ratings.find((item) => item.value === rating);

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
        aria-label="Feedback geben"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          {hasExisting ? (
            <Pencil className="h-5 w-5" />
          ) : (
            <MessageCircleHeart className="h-5 w-5" />
          )}
        </span>
        <span className="hidden sm:block text-left">
          <span className="block leading-tight">
            {hasExisting ? "Feedback bearbeiten" : "Feedback"}
          </span>
          <span className="block text-xs font-normal text-muted-foreground">
            Idee, Fehler oder Lob
          </span>
        </span>
      </motion.button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          hideCloseButton
          className="overflow-hidden gap-0 p-0 sm:max-w-lg"
        >
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-10 text-center"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <h3 className="mb-1 font-heading text-xl font-bold">
                  Vielen Dank!
                </h3>
                <p className="text-sm text-muted-foreground">
                  {hasExisting
                    ? "Dein Feedback wurde aktualisiert."
                    : "Danke! Deine Rückmeldung wurde gespeichert."}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="relative border-b border-border bg-gradient-to-br from-primary/10 via-accent/5 to-transparent px-6 pb-5 pt-6">
                  <button
                    onClick={() => handleClose(false)}
                    className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
                    aria-label="Schließen"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                      <MessageCircleHeart className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {hasExisting ? "Feedback bearbeiten" : "Feedback"}
                    </span>
                  </div>
                  <h3 className="font-heading text-xl font-bold">
                    Was möchtest du uns sagen?
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Teile kurz deine Idee, einen Fehler oder allgemeines Feedback.
                  </p>
                </div>

                <div className="space-y-5 p-6">
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      1. Bewertung
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {ratings.map((item) => (
                        <motion.button
                          key={item.value}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setRating(item.value)}
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
                  </div>

                  <AnimatePresence>
                    {rating !== null && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          2. Thema
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {categories.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => setCategory(item.id)}
                              className={`flex flex-col items-center gap-1.5 rounded-lg border py-2.5 transition-all ${
                                category === item.id
                                  ? item.color
                                  : "border-transparent bg-secondary/60 text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <item.icon className="h-4 w-4" />
                              <span className="text-[11px] font-medium">
                                {item.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {rating !== null && category !== null && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden"
                      >
                        <div>
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            3. Nachricht
                          </p>
                          <Textarea
                            placeholder={
                              selectedRating && selectedRating.value <= 2
                                ? "Was läuft schief? Wie können wir das verbessern?"
                                : "Was gefällt dir oder was wünschst du dir?"
                            }
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            rows={4}
                            disabled={sending}
                            className="resize-none"
                            maxLength={500}
                          />
                          {message.trim().length > 0 &&
                            message.trim().length < 5 && (
                              <p className="mt-1 text-xs font-medium text-destructive">
                                Bitte schreibe mindestens 5 Zeichen.
                              </p>
                            )}
                          <p className="mt-1 text-right text-[10px] text-muted-foreground">
                            {message.length}/500
                          </p>
                        </div>

                        <Button
                          onClick={submit}
                          disabled={sending}
                          className="w-full gap-2"
                          size="lg"
                        >
                          {sending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Wird gesendet…
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              {hasExisting
                                ? "Feedback aktualisieren"
                                : "Feedback senden"}
                            </>
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FeedbackButton;
