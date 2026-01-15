import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MotherSidebar } from "./MotherSidebar";
import { Loader2, Menu, X, Baby } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MotherLayout() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
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

      if (!data) {
        console.error("No profile found for user");
        navigate("/auth");
        return;
      }

      // בדיקת אבטחה: אם המשתמש הוא דולה - תעביר אותו לאזור הדולה
      if (data.role === "doula") {
        navigate("/doula");
        return;
      }

      setProfile(data);
      setLoading(false);
    }
    checkAuth();
  }, [navigate]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile Header - זהה לקודם */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b sticky top-0 z-40">
        <div className="flex items-center gap-2 font-bold">
          <Baby className="w-5 h-5" />
          SmartDoula
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X /> : <Menu />}
        </Button>
      </div>

      <MotherSidebar
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