import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2, Clock, Activity, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // מצב טעינה ראשוני

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          // כשמגיעה התראה חדשה, נוסיף אותה לראש הרשימה
          setNotifications((prev) => [payload.new, ...prev]);
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
        .select("*, profiles:mother_id(full_name)")
        .eq("doula_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("שגיאה בטעינת התראות");
    } finally {
      setLoading(false); // סיום הטעינה בכל מקרה
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (error) {
      toast.error("שגיאה בעדכון");
    } else {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      toast.error("לא ניתן למחוק את ההתראה");
    } else {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("התראה נמחקה");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in" dir="rtl">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Bell className="w-6 h-6 text-primary" /> מרכז התראות
      </h1>

      <div className="space-y-3">
        {/* מצב טעינה */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary/40" />
            <p>בודק אם יש חדש...</p>
          </div>
        ) : notifications.length === 0 ? (
          /* מצב שאין התראות (רק אחרי שהטעינה הסתיימה) */
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-muted-foreground">אין התראות חדשות כרגע</p>
          </div>
        ) : (
          /* רשימת ההתראות */
          notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`transition-all duration-300 ${
                notif.is_read
                  ? "opacity-60 bg-muted/20"
                  : "bg-white border-r-4 border-r-primary shadow-md"
              }`}
            >
              <CardContent className="p-4 flex items-start gap-4">
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

                <div className="flex-1 text-right">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-foreground">{notif.title}</h4>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 whitespace-nowrap bg-muted px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(notif.created_at), {
                        addSuffix: true,
                        locale: he,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                  <p className="text-xs text-primary font-medium mt-2">
                    יולדת: {notif.profiles?.full_name || "מערכת"}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {!notif.is_read && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-green-600 hover:bg-green-50 rounded-full"
                      onClick={() => markAsRead(notif.id)}
                      title="סמן כנקרא"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:bg-red-50 rounded-full"
                    onClick={() => deleteNotification(notif.id)}
                    title="מחיקה"
                  >
                    <Trash2 className="w-4 h-4" />
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
