import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DoulaSidebar } from "./DoulaSidebar";
import { Loader2, Menu, X, Baby } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DoulaLayout() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function initAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      // אם הגענו לכאן ויש סשן, אנחנו כבר יכולים להציג את ה-Layout
      // נשתמש בנתונים מהסשן כברירת מחדל ראשונית
      setProfile({
        id: session.user.id,
        full_name: session.user.user_metadata?.full_name || "דולה",
        role: "doula",
      });

      // משחררים את הטעינה מיד כדי שהמסך הלבן ייעלם!
      setLoading(false);

      // עכשיו ננסה להביא את הפרופיל המלא מה-DB (תמונה, טלפון וכו') בשקט ברקע
      const { data: dbProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (dbProfile) {
        setProfile(dbProfile);
      }
    }

    initAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin w-10 h-10 text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
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
