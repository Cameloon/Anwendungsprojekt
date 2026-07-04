import { useState } from "react";
import { Flag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useLanguage } from "@/hooks/useLanguage";

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
  const { language } = useLanguage();

  const REASONS = language.match({
    english: () => [
      "Spam or advertising",
      "Inappropriate content",
      "Violation of netiquette",
      "Misinformation",
      "Duplicate content",
      "Other",
    ],
    german: () => [
      "Spam oder Werbung",
      "Unangemessener Inhalt",
      "Verstoß gegen Netiquette",
      "Fehlinformationen",
      "Doppelter Inhalt",
      "Sonstiges",
    ],
  });

  const strings = language.match({
    english: () => ({
      title: "Report Post",
      description: "Select a reason and optionally describe the issue. The post will be reported to the admin for review.",
      reasonLabel: "Reason for report",
      placeholder: "Additional details (optional)\u2026",
      cancel: "Cancel",
      report: "Report",
      toastSuccess: "Post reported",
      toastSuccessDesc: "The post has been reported to the admin for review.",
      toastError: "Error reporting",
      toastErrorDesc: "Report failed.",
    }),
    german: () => ({
      title: "Beitrag melden",
      description: "Wähle einen Grund aus und beschreibe optional das Problem. Der Beitrag wird dem Admin zur Prüfung gemeldet.",
      reasonLabel: "Grund der Meldung",
      placeholder: "Weitere Details (optional)\u2026",
      cancel: "Abbrechen",
      report: "Melden",
      toastSuccess: "Beitrag gemeldet",
      toastSuccessDesc: "Der Beitrag wurde dem Admin zur Prüfung gemeldet.",
      toastError: "Fehler beim Melden",
      toastErrorDesc: "Meldung fehlgeschlagen.",
    }),
  });

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

      toast.success(strings.toastSuccess, {
        description: strings.toastSuccessDesc,
      });

      setSelectedReason("");
      setDetails("");
      onOpenChange(false);
    } catch (err) {
      toast.error(strings.toastError, {
        description: err instanceof Error ? err.message : strings.toastErrorDesc,
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
            {strings.title}
          </DialogTitle>
          <DialogDescription>
            {strings.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{strings.reasonLabel}</p>
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
            placeholder={strings.placeholder}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            className="resize-none text-sm"
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {strings.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={!selectedReason || submitting}
            >
              {strings.report}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
