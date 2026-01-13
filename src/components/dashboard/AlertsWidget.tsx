import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Check,
  Trash2,
  Clock,
  Activity,
  Loader2,
  ExternalLink,
  ChevronLeft,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function AlertsWidget() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();

    // האזנה להתראות חדשות
    const channel = supabase
      .channel("realtime-alerts-widget")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => fetchNotifications() // טעינה מחדש כדי לקבל את פרטי היולדת (Join)
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*, profiles:mother_id(full_name)")
        .eq("doula_id", user.id)
        .eq("is_read", false) // בדאשבורד נציג רק מה שלא נקרא
        .order("created_at", { ascending: false })
        .limit(5); // נציג רק את ה-5 האחרונות כדי לא להעמיס

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  return (
    <div className="bg-card rounded-3xl p-6 shadow-card animate-fade-in border border-border/40">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">התראות אחרונות</h2>
          {notifications.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white animate-pulse">
              {notifications.length}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-primary"
          onClick={() => navigate("/doula/notifications")}
        >
          לכל ההתראות <ChevronLeft className="w-3 h-3 mr-1" />
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary/30" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10 opacity-60">
            <p className="text-sm text-muted-foreground italic">
              אין הודעות חדשות שממתינות לטיפול
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                "group relative flex items-start gap-3 p-3 rounded-2xl transition-all border border-transparent hover:border-border/60 hover:bg-muted/30",
                notif.type === "contraction" ? "bg-red-50/50" : "bg-muted/20"
              )}
            >
              <div className="mt-1">
                {notif.type === "contraction" ? (
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                    <Activity className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                    <Bell className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 text-right">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-bold text-foreground truncate">
                    {notif.profiles?.full_name || "מערכת"}
                  </p>
                  <span className="text-[9px] text-muted-foreground whitespace-nowrap bg-white/50 px-1.5 py-0.5 rounded-full border">
                    {formatDistanceToNow(new Date(notif.created_at), {
                      addSuffix: true,
                      locale: he,
                    })}
                  </span>
                </div>
                <p className="text-xs text-foreground/80 mt-1 line-clamp-2 leading-relaxed">
                  {notif.message}
                </p>

                {notif.type === "contraction" && notif.pregnancy_id && (
                  <button
                    onClick={() =>
                      navigate(`/doula/live-monitor/${notif.pregnancy_id}`)
                    }
                    className="text-[10px] text-primary font-bold mt-2 flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> מעבר למוניטור
                  </button>
                )}
              </div>

              <button
                onClick={() => markAsRead(notif.id)}
                className="opacity-0 group-hover:opacity-100 absolute -left-1 top-1/2 -translate-y-1/2 bg-white shadow-sm border rounded-full p-1 text-green-600 hover:bg-green-50 transition-all"
                title="סמן כנקרא"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
