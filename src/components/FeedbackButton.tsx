import { useState } from "react";
import { MessageCircleHeart, Send, Loader2, CheckCircle2, X, Bug, Lightbulb, Heart, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Category = "bug" | "idee" | "lob" | "sonstiges";

const ratings = [
  { emoji: "😞", label: "Schlecht", value: 1 },
  { emoji: "😐", label: "Okay", value: 2 },
  { emoji: "🙂", label: "Gut", value: 3 },
  { emoji: "😍", label: "Super", value: 4 },
];

const categories: { id: Category; label: string; icon: typeof Bug; color: string }[] = [
  { id: "bug", label: "Fehler", icon: Bug, color: "text-destructive bg-destructive/10 border-destructive/20" },
  { id: "idee", label: "Idee", icon: Lightbulb, color: "text-info bg-info/10 border-info/20" },
  { id: "lob", label: "Lob", icon: Heart, color: "text-success bg-success/10 border-success/20" },
  { id: "sonstiges", label: "Sonstiges", icon: MessageSquare, color: "text-primary bg-primary/10 border-primary/20" },
];

const FeedbackButton = () => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  // live validation: derive message error so it disappears when corrected

  const reset = () => {
    setRating(null);
    setCategory(null);
    setMessage("");
    setDone(false);
    setSending(false);
  };

  const handleClose = (val: boolean) => {
    setOpen(val);
    if (!val) setTimeout(reset, 300);
  };

  const submit = async () => {
    if (message.trim().length < 5) {
      toast.error("Bitte schreibe mindestens 5 Zeichen.");
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 700));
    setSending(false);
    setDone(true);
    toast.success("Danke für dein Feedback! 💜");
    setTimeout(() => handleClose(false), 1800);
  };

  const selectedRating = ratings.find((r) => r.value === rating);

  return (
    <>
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.8, type: "spring" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
        aria-label="Feedback geben"
      >
        <MessageCircleHeart className="h-6 w-6" />
      </motion.button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-10 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="h-16 w-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </motion.div>
                <h3 className="font-heading text-xl font-bold mb-1">Vielen Dank! 💜</h3>
                <p className="text-sm text-muted-foreground">
                  Dein Feedback macht StudentPlanner besser.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-transparent px-6 pt-6 pb-5 border-b border-border">
                  <button
                    onClick={() => handleClose(false)}
                    className="absolute top-4 right-4 h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground"
                    aria-label="Schließen"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <MessageCircleHeart className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      Feedback
                    </span>
                  </div>
                  <h3 className="font-heading text-xl font-bold">
                    Wie zufrieden bist du?
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Dein Feedback hilft uns wirklich weiter.
                  </p>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      1. Bewertung
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {ratings.map((r) => (
                        <motion.button
                          key={r.value}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => setRating(r.value)}
                          className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
                            rating === r.value
                              ? "border-primary bg-primary/5 scale-105"
                              : "border-transparent bg-secondary/60 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <span className="text-2xl">{r.emoji}</span>
                          <span
                            className={`text-[10px] font-medium ${
                              rating === r.value ? "text-primary" : "text-muted-foreground"
                            }`}
                          >
                            {r.label}
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
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          2. Worum geht es?
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {categories.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => setCategory(c.id)}
                              className={`flex flex-col items-center gap-1.5 py-2.5 rounded-lg border transition-all ${
                                category === c.id
                                  ? c.color
                                  : "border-transparent bg-secondary/60 text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <c.icon className="h-4 w-4" />
                              <span className="text-[11px] font-medium">{c.label}</span>
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
                        className="overflow-hidden space-y-3"
                      >
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                            3. Erzähl uns mehr
                          </p>
                          <Textarea
                            placeholder={
                              selectedRating && selectedRating.value <= 2
                                ? "Was läuft schief? Wie können wir das beheben?"
                                : "Was gefällt dir? Was würdest du dir wünschen?"
                            }
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            disabled={sending}
                            className="resize-none"
                            maxLength={500}
                          />
                          {message.trim().length > 0 && message.trim().length < 5 && (
                            <p className="mt-1 text-xs font-medium text-destructive">Bitte schreibe mindestens 5 Zeichen.</p>
                          )}
                          <p className="text-[10px] text-muted-foreground text-right mt-1">
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
                              <Loader2 className="h-4 w-4 animate-spin" /> Wird gesendet…
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" /> Feedback senden
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
