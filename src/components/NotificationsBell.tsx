import { useEffect, useState } from "react";
import { Bell, Check, X, CalendarDays, MessageSquare, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  loadNotifications,
  subscribeNotifications,
  acceptNotification,
  declineNotification,
  removeNotification,
  type InviteNotification,
} from "@/lib/notificationsStore";
import { toast } from "sonner";

const formatTime = (ts: number) => {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "gerade eben";
  if (m < 60) return `vor ${m} Min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std`;
  return new Date(ts).toLocaleDateString("de-DE");
};

const NotificationsBell = () => {
  const [items, setItems] = useState<InviteNotification[]>(() => loadNotifications());
  const [open, setOpen] = useState(false);

  useEffect(() => subscribeNotifications(() => setItems(loadNotifications())), []);

  const pending = items.filter((n) => n.status === "pending").length;

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
      <PopoverContent align="end" className="w-80 p-0 max-h-[28rem] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b">
          <p className="font-heading font-semibold text-sm">Benachrichtigungen</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Einladungen zu Foren und Terminen
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Keine Benachrichtigungen</p>
            </div>
          )}
          {items.map((n) => {
            const Icon = n.type === "forum_invite" ? MessageSquare : CalendarDays;
            return (
              <div key={n.id} className="px-3 py-3 border-b last:border-b-0 hover:bg-secondary/40">
                <div className="flex items-start gap-2">
                  <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug">
                      <span className="font-semibold">{n.from}</span>
                      {" lädt "}
                      <span className="font-semibold">{n.recipient}</span>
                      {n.type === "forum_invite" ? " ins Forum " : " zum Termin "}
                      <span className="font-semibold">„{n.title}"</span>
                      {" ein."}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatTime(n.createdAt)}
                    </p>
                    {n.status === "pending" ? (
                      <div className="flex gap-1 mt-2">
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1 flex-1"
                          onClick={() => {
                            acceptNotification(n.id);
                            toast.success("Einladung angenommen");
                          }}
                        >
                          <Check className="h-3 w-3" /> Annehmen
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 flex-1"
                          onClick={() => {
                            declineNotification(n.id);
                            toast("Abgelehnt");
                          }}
                        >
                          <X className="h-3 w-3" /> Ablehnen
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
                          {n.status === "accepted" ? "Angenommen" : "Abgelehnt"}
                        </span>
                        <button
                          onClick={() => removeNotification(n.id)}
                          className="text-[10px] text-muted-foreground hover:text-destructive"
                        >
                          Entfernen
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
