import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2, Clock, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetchNotifications();

    // האזנה להתראות חדשות בזמן אמת
    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*, profiles:mother_id(full_name)")
      .eq("doula_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setNotifications(data);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in" dir="rtl">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Bell className="w-6 h-6 text-primary" /> מרכז התראות
      </h1>

      <div className="space-y-3">
        {notifications.length === 0 && (
          <p className="text-center text-muted-foreground py-10">
            אין התראות חדשות
          </p>
        )}

        {notifications.map((notif) => (
          <Card
            key={notif.id}
            className={`transition-all ${
              notif.is_read
                ? "opacity-60 bg-muted/20"
                : "bg-white border-l-4 border-l-primary shadow-md"
            }`}
          >
            <CardContent className="p-4 flex items-start gap-4">
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

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold">{notif.title}</h4>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(notif.created_at), {
                      addSuffix: true,
                      locale: he,
                    })}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mt-1">
                  {notif.message}
                </p>
                <p className="text-xs text-primary font-medium mt-1">
                  מאת: {notif.profiles?.full_name}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {!notif.is_read && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-green-600 hover:bg-green-50"
                    onClick={() => markAsRead(notif.id)}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:bg-red-50"
                  onClick={() => deleteNotification(notif.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
