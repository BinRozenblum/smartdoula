import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function RootRedirect() {
  const navigate = useNavigate();
  const [debugLog, setDebugLog] = useState("מאתחל...");

  useEffect(() => {
    let isMounted = true;

    const checkUser = async (user: any) => {
      if (!isMounted) return;
      setDebugLog("בודק תפקיד משתמש...");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role === "doula") navigate("/doula");
      else if (profile?.role === "mother") navigate("/mother");
      else navigate("/complete-profile");
    };

    const init = async () => {
      // בדיקה: האם יש טוקן ב-URL? (חזרה מגוגל)
      const hash = window.location.hash;
      const hasToken =
        hash && (hash.includes("access_token") || hash.includes("error"));

      if (hasToken) {
        setDebugLog("מעבד התחברות מגוגל... נא לא לרענן");
        // מחכים ל-onAuthStateChange שיקרה אוטומטית כשהספרייה תסיים לעבד את ה-Hash
        return;
      }

      // בדיקה רגילה: האם יש סשן קיים?
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        checkUser(session.user);
      } else {
        // אם אין סשן ואין טוקן ב-URL - רק אז עוברים ל-Auth
        setDebugLog("אין משתמש מחובר, עובר להתחברות...");
        setTimeout(() => {
          if (isMounted) navigate("/auth");
        }, 500); // השהייה קלה ליתר ביטחון
      }
    };

    init();

    // מאזין לשינויים - כאן נתפסת החזרה מגוגל
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event In Redirect:", event, !!session);

      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        checkUser(session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin w-12 h-12 text-primary mx-auto" />
        <p className="text-sm font-mono text-primary">{debugLog}</p>
      </div>
    </div>
  );
}
