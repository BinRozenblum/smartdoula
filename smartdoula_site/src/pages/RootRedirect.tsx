import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function RootRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    async function redirect() {
      // 1. קבלת הסשן מהזיכרון המקומי
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      // 2. קריאת התפקיד מה-Metadata (נמצא בתוך האובייקט של היוזר, לא דורש קריאת DB)
      const role = session.user.user_metadata?.role;

      if (role === "doula") {
        navigate("/doula");
      } else if (role === "mother") {
        navigate("/mother");
      } else {
        // אם משום מה אין רול ב-metadata, ננסה בכל זאת קריאת DB מהירה כגיבוי
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile?.role === "doula") navigate("/doula");
        else navigate("/mother");
      }
    }
    redirect();
  }, [navigate]);

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <Loader2 className="animate-spin w-10 h-10 text-primary" />
    </div>
  );
}
