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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom"; // הוספת ניווט

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Hook לניווט

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          // טעינה מחדש כדי לקבל את שם האמא (כי ה-Realtime שולח רק את השורה החדשה בלי ה-Join)
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*, profiles:mother_id(full_name)") // שימי לב שאנחנו שולפים עכשיו גם את pregnancy_id
        .eq("doula_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);
    if (!error) setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in" dir="rtl">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Bell className="w-6 h-6 text-primary" /> מרכז ההתראות
      </h1>

      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl">
            <p className="text-muted-foreground">אין התראות חדשות</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`transition-all ${
                notif.is_read
                  ? "opacity-60 bg-muted/10"
                  : "bg-white border-r-4 border-r-primary"
              }`}
            >
              <CardContent className="p-4 flex items-start gap-4">
                {/* אייקון סוג התראה */}
                <div className="mt-1">
                  {notif.type === "contraction" ? (
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                      <Activity className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                      <Bell className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {/* תוכן ההתראה */}
                <div className="flex-1 text-right">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold">{notif.title}</h4>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {formatDistanceToNow(new Date(notif.created_at), {
                        addSuffix: true,
                        locale: he,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 mt-1">
                    {notif.message}
                  </p>

                  {/* כפתור מעבר למוניטור - מוצג רק אם זו התראת צירים ויש pregnancy_id */}
                  {notif.type === "contraction" && notif.pregnancy_id && (
                    <Button
                      variant="link"
                      className="p-0 h-auto text-primary text-xs mt-2 font-bold gap-1"
                      onClick={() =>
                        navigate(`/doula/live-monitor/${notif.pregnancy_id}`)
                      }
                    >
                      <ExternalLink className="w-3 h-3" /> לצפייה במוניטור החי
                      של {notif.profiles?.full_name}
                    </Button>
                  )}

                  {!notif.profiles?.full_name &&
                    notif.type !== "contraction" && (
                      <p className="text-[10px] text-muted-foreground mt-2">
                        מערכת
                      </p>
                    )}
                </div>

                {/* פעולות */}
                <div className="flex flex-col gap-2">
                  {!notif.is_read && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => markAsRead(notif.id)}
                    >
                      <Check className="w-4 h-4 text-green-600" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteNotification(notif.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
