import { useState } from "react";
import { Bell, Check, X, CalendarDays, MessageSquare, Inbox, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface NotificationItem {
  id: string;
  type: "forum_invite" | "deadline_invite" | "account_banned";
  fromName: string;
  recipientName: string;
  title: string;
  message?: string;
  status: "pending" | "accepted" | "declined";
  createdAt: number;
}

const NotificationsBell = () => {
  const { language } = useLanguage();
  const notificationsQuery = useQuery(api.notifications.listForUser);
  const acceptMutation = useMutation(api.notifications.accept);
  const declineMutation = useMutation(api.notifications.decline);
  const removeMutation = useMutation(api.notifications.remove);

  const [open, setOpen] = useState(false);

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return language.match({ english: () => "Just now", german: () => "gerade eben" });
    if (m < 60) return language.match({ english: () => `${m} min ago`, german: () => `vor ${m} Min` });
    const h = Math.floor(m / 60);
    if (h < 24) return language.match({ english: () => `${h} hr ago`, german: () => `vor ${h} Std` });
    return new Date(ts).toLocaleDateString("de-DE");
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: any[] = (notificationsQuery ?? []) as any[];

  const items: NotificationItem[] = raw.map((n: any) => ({
    id: n._id,
    type: n.type,
    fromName: n.fromName,
    recipientName: n.recipientName,
    title: n.title,
    message: n.message,
    status: n.status,
    createdAt: n.createdAt,
  }));

  const pending = items.filter((n) => n.status === "pending").length;

  const acceptNotification = async (id: string) => {
    try {
      await acceptMutation({ notificationId: id as Id<"notifications"> });
      toast.success(language.match({ english: () => "Invitation accepted", german: () => "Einladung angenommen" }));
    } catch {
      toast.error(language.match({ english: () => "Error", german: () => "Fehler" }));
    }
  };

  const declineNotification = async (id: string) => {
    try {
      await declineMutation({ notificationId: id as Id<"notifications"> });
      toast(language.match({ english: () => "Declined", german: () => "Abgelehnt" }));
    } catch {
      toast.error(language.match({ english: () => "Error", german: () => "Fehler" }));
    }
  };

  const removeNotification = async (id: string) => {
    try {
      await removeMutation({ notificationId: id as Id<"notifications"> });
    } catch {
      toast.error(language.match({ english: () => "Error", german: () => "Fehler" }));
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {pending > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {pending}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="flex max-h-[28rem] w-[min(20rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] flex-col overflow-hidden p-0"
      >
        <div className="px-4 py-3 border-b">
          <p className="font-heading font-semibold text-sm">{language.match({ english: () => "Notifications", german: () => "Benachrichtigungen" })}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {language.match({ english: () => "Invitations to forums and deadlines", german: () => "Einladungen zu Foren und Terminen" })}
          </p>
        </div>
        <div className="notifications-scroll flex-1 overflow-x-hidden overflow-y-auto">
          {items.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">{language.match({ english: () => "No notifications", german: () => "Keine Benachrichtigungen" })}</p>
            </div>
          )}
          {items.map((n) => {
            if (n.type === "account_banned") {
              return (
                <div key={n.id} className="px-3 py-3 border-b last:border-b-0 hover:bg-secondary/40">
                  <div className="flex items-start gap-2">
                    <div className="h-7 w-7 rounded-md bg-destructive/10 flex items-center justify-center shrink-0">
                      <Ban className="h-3.5 w-3.5 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="break-words text-xs font-semibold leading-snug">{n.title}</p>
                      {n.message && (
                        <p className="mt-0.5 break-words text-xs leading-snug text-muted-foreground">
                          {n.message}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-[10px] text-muted-foreground">{formatTime(n.createdAt)}</p>
                        <button
                          onClick={() => removeNotification(n.id)}
                          className="text-[10px] text-muted-foreground hover:text-destructive"
                        >
                          {language.match({ english: () => "Remove", german: () => "Entfernen" })}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            const Icon = n.type === "forum_invite" ? MessageSquare : CalendarDays;
            return (
              <div key={n.id} className="px-3 py-3 border-b last:border-b-0 hover:bg-secondary/40">
                <div className="flex items-start gap-2">
                  <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="break-words text-xs leading-snug">
                      <span className="font-semibold">{n.fromName}</span>
                      {language.match({ english: () => " invites ", german: () => " lädt " })}
                      <span className="font-semibold">{n.recipientName}</span>
                      {n.type === "forum_invite"
                        ? language.match({ english: () => " to forum ", german: () => " ins Forum " })
                        : language.match({ english: () => " to deadline ", german: () => " zum Termin " })}
                      <span className="font-semibold">
                        {language.match({ english: () => '"', german: () => '„' })}
                        {n.title}"
                      </span>
                      {language.match({ english: () => ".", german: () => " ein." })}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatTime(n.createdAt)}
                    </p>
                    {n.status === "pending" ? (
                      <div className="flex gap-1 mt-2">
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1 flex-1"
                          onClick={() => acceptNotification(n.id)}
                        >
                          <Check className="h-3 w-3" /> {language.match({ english: () => "Accept", german: () => "Annehmen" })}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 flex-1"
                          onClick={() => declineNotification(n.id)}
                        >
                          <X className="h-3 w-3" /> {language.match({ english: () => "Decline", german: () => "Ablehnen" })}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-1.5">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                            n.status === "accepted"
                              ? "bg-success/15 text-success"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {n.status === "accepted"
                            ? language.match({ english: () => "Accepted", german: () => "Angenommen" })
                            : language.match({ english: () => "Declined", german: () => "Abgelehnt" })}
                        </span>
                        <button
                          onClick={() => removeNotification(n.id)}
                          className="text-[10px] text-muted-foreground hover:text-destructive"
                        >
                          {language.match({ english: () => "Remove", german: () => "Entfernen" })}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;
