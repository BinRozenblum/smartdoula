import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DoulaSidebar } from "./DoulaSidebar";
import { Loader2, Menu, X, Baby, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DoulaLayout() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function checkAuth() {
      console.log("[DoulaLayout] Init checkAuth");

      // 1. קבלת סשן מהיר
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.log("[DoulaLayout] No session, ejecting to auth");
        navigate("/auth");
        return;
      }

      // 2. יצירת פרופיל זמני מה-Metadata כדי לשחרר את ה-UI מיד
      const tempProfile = {
        id: session.user.id,
        full_name: session.user.user_metadata?.full_name || "דולה",
        role: "doula",
      };

      setProfile(tempProfile);
      setLoading(false); // <--- משחרר את הטעינה כאן!
      console.log("[DoulaLayout] Loading released with temp profile");

      // 3. טעינת נתונים משלימים מה-DB בשקט ברקע
      try {
        const { data: dbData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (dbData) {
          console.log("[DoulaLayout] Real profile fetched from DB");
          setProfile(dbData);
          fetchUnreadCount(session.user.id);
          subscribeToNotifications(session.user.id);
        }
      } catch (e) {
        console.error(
          "[DoulaLayout] Background fetch failed (non-critical):",
          e
        );
      }
    }

    checkAuth();
  }, [navigate]);

  async function fetchUnreadCount(userId: string) {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("doula_id", userId)
      .eq("is_read", false);
    setUnreadCount(count || 0);
  }

  function subscribeToNotifications(userId: string) {
    const channel = supabase
      .channel("nav-notifs")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `doula_id=eq.${userId}`,
        },
        () => fetchUnreadCount(userId)
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <div className="lg:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b sticky top-0 z-40">
        <div className="flex items-center gap-2 font-bold text-primary">
          <div className="w-8 h-8 rounded-lg gradient-warm flex items-center justify-center">
            <Baby className="w-5 h-5 text-white" />
          </div>
          <span>Smart Doula</span>
        </div>
        <div className="flex items-center gap-1">
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X /> : <Menu />}
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
