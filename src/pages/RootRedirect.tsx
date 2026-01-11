import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function RootRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    async function redirect() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (data?.role === "doula") {
        navigate("/doula");
      } else {
        navigate("/mother");
      }
    }
    redirect();
  }, [navigate]);

  return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin" />
    </div>
  );
}
