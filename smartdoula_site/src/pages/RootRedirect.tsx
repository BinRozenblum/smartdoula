import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function RootRedirect() {
  const navigate = useNavigate();
  const [debugLog, setDebugLog] = useState("מתחיל בדיקה...");

  useEffect(() => {
    let isMounted = true;

    async function redirectWithTimeout() {
      // יצירת מרוץ: או ש-Supabase עונה, או שהטיימר נגמר
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), 3000)
      );

      try {
        setDebugLog("בודק סשן...");

        // מרוץ נגד הזמן
        const sessionPromise = supabase.auth.getSession();
        const {
          data: { session },
        } = (await Promise.race([sessionPromise, timeoutPromise])) as any;

        if (!session) {
          setDebugLog("אין סשן, עובר להתחברות");
          if (isMounted) navigate("/auth");
          return;
        }

        setDebugLog("סשן נמצא, בודק תפקיד...");
        const role = session.user.user_metadata?.role;

        if (role === "doula") {
          navigate("/doula");
        } else if (role === "mother") {
          navigate("/mother");
        } else {
          // אם אין metadata, ננסה לבדוק ב-DB אבל עם הגנת זמן
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .maybeSingle();
          if (profile?.role === "doula") navigate("/doula");
          else navigate("/mother");
        }
      } catch (err: any) {
        console.error("Redirect Error:", err);
        setDebugLog(
          err.message === "TIMEOUT"
            ? "שרת לא עונה, מנסה להתחבר מחדש..."
            : "שגיאה במערכת"
        );

        // אם נתקענו (Timeout), הכי בטוח לשלוח ל-Auth שינקה את הסשן התקוע
        if (isMounted) navigate("/auth");
      }
    }

    redirectWithTimeout();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin w-12 h-12 text-primary mx-auto" />
        <div className="space-y-2">
          <p className="font-bold text-foreground">Smart Doula</p>
          <p className="text-xs text-muted-foreground">{debugLog}</p>
        </div>
      </div>
    </div>
  );
}
