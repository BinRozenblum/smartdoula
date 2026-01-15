import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DoulaSidebar } from "./DoulaSidebar";
import { Loader2, Menu, X, Baby, Bell } from "lucide-react"; // הוספת Bell
import { Button } from "@/components/ui/button";

export default function DoulaLayout() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // סטייט למספר התראות

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [navigate]);

  async function checkAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (!data || data.role !== "doula") {
      navigate("/mother");
      return;
    }

    setProfile(data);
    setLoading(false);
    fetchUnreadCount(user.id); // טעינה ראשונית של מספר התראות
    subscribeToNotifications(user.id); // האזנה לשינויים
  }

  // פונקציה לשליפת מספר ההתראות שלא נקראו
  async function fetchUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("doula_id", userId)
      .eq("is_read", false);

    if (!error) setUnreadCount(count || 0);
  }

  // האזנה לשינויים בשידור חי
  function subscribeToNotifications(userId: string) {
    const channel = supabase
      .channel("mobile-nav-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `doula_id=eq.${userId}`,
        },
        () => fetchUnreadCount(userId) // רענון המספר בכל שינוי (הוספה/עריכה)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile Header - המקום בו הוספנו את הפעמון */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b sticky top-0 z-40">
        <div className="flex items-center gap-2 font-bold text-primary">
          <div className="w-8 h-8 rounded-lg gradient-warm flex items-center justify-center shadow-sm">
            <Baby className="w-5 h-5 text-white" />
          </div>
          <span className="tracking-tight">Smart Doula</span>
        </div>

        <div className="flex items-center gap-1">
          {/* אייקון התראות לנייד */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate("/doula/notifications")}
          >
            <Bell className="w-6 h-6 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
                {unreadCount > 9 ? "+9" : unreadCount}
              </span>
            )}
          </Button>

          {/* המבורגר */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </Button>
        </div>
      </div>

      <DoulaSidebar
        activeItem={location.pathname}
        onNavigate={(path: string) => {
          navigate(path);
          setIsSidebarOpen(false);
        }}
        profile={profile}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 lg:mr-64 min-h-screen bg-background p-4">
        <Outlet context={{ profile }} />
      </main>
    </div>
  );
}
