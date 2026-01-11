import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/layout/Sidebar";
import { DoulaDashboard } from "@/components/dashboard/DoulaDashboard";
import { MotherDashboard } from "@/components/dashboard/MotherDashboard";
import { Loader2, Menu, X, Baby } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Index() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState("/");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    async function getProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    }
    getProfile();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-warm flex items-center justify-center">
            <Baby className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-foreground">SmartDoula</span>
        </div>
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

      <Sidebar
        activeItem={activeNav}
        onNavigate={setActiveNav}
        profile={profile}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 lg:mr-64 min-h-screen">
        {profile?.role === "doula" ? (
          <DoulaDashboard profile={profile} />
        ) : (
          <MotherDashboard profile={profile} />
        )}
      </main>
    </div>
  );
}
