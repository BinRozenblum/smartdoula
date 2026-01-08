import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/layout/Sidebar";
import { DoulaDashboard } from "@/components/dashboard/DoulaDashboard";
import { MotherDashboard } from "@/components/dashboard/MotherDashboard";
import { Loader2 } from "lucide-react";

export default function Index() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState("/");

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
    <div className="min-h-screen bg-background">
      {/* ה-Sidebar יקבל את פרטי הפרופיל כדי להציג שם/תפקיד נכון */}
      <Sidebar
        activeItem={activeNav}
        onNavigate={setActiveNav}
        profile={profile}
      />

      <main className="mr-64 min-h-screen">
        {profile?.role === "doula" ? (
          <DoulaDashboard profile={profile} />
        ) : (
          <MotherDashboard profile={profile} />
        )}
      </main>
    </div>
  );
}
