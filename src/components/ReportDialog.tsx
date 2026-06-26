import { useState } from "react";
import { Flag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const REASONS = [
  "Spam oder Werbung",
  "Unangemessener Inhalt",
  "Verstoß gegen Netiquette",
  "Fehlinformationen",
  "Doppelter Inhalt",
  "Sonstiges",
];

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postTitle: string;
  forumName: string;
  reportedBy: string;
}

export function ReportDialog({
  open,
  onOpenChange,
  postId,
  postTitle,
  forumName,
  reportedBy,
}: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submitReport = useMutation(api.postReports.submit);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setSubmitting(true);

    const reason = details.trim()
      ? `${selectedReason}: ${details.trim()}`
      : selectedReason;

    try {
      await submitReport({ postId, postTitle, forumName, reason, reportedBy });

      toast.success("Beitrag gemeldet", {
        description: "Der Beitrag wurde dem Admin zur Prüfung gemeldet.",
      });

      setSelectedReason("");
      setDetails("");
      onOpenChange(false);
    } catch (err) {
      toast.error("Fehler beim Melden", {
        description: err instanceof Error ? err.message : "Meldung fehlgeschlagen.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-destructive" />
            Beitrag melden
          </DialogTitle>
          <DialogDescription>
            Wähle einen Grund aus und beschreibe optional das Problem. Der Beitrag wird dem Admin zur Prüfung gemeldet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Grund der Meldung</p>
          <div className="flex flex-col gap-1.5">
            {REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => setSelectedReason(reason)}
                className={`text-left text-sm px-3 py-2 rounded-md border transition-colors ${
                  selectedReason === reason
                    ? "border-destructive/50 bg-destructive/10 text-destructive font-medium"
                    : "border-border hover:bg-secondary"
                }`}
              >
                {reason}
              </button>
            ))}
          </div>

          <Textarea
            placeholder="Weitere Details (optional)…"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            className="resize-none text-sm"
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={!selectedReason || submitting}
            >
              Melden
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
