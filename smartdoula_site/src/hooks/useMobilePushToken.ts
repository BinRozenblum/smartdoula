import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useMobilePushToken() {
  // פונקציה שמנסה לשמור את הטוקן בשרת
  // היא קוראת את הטוקן מה-LocalStorage או מקבלת אותו ישירות
  const syncTokenToDatabase = async (tokenToSync?: string) => {
    try {
      // 1. השגת הטוקן (מהפרמטר או מהזיכרון)
      const token =
        tokenToSync || window.localStorage.getItem("expo_push_token_buffer");

      if (!token) {
        console.log("📱 [Push Token] No token found to sync.");
        return;
      }

      // 2. בדיקה אם המשתמש מחובר
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log(
          "📱 [Push Token] Received token but user NOT logged in yet. Waiting for auth..."
        );
        // אנחנו לא עושים כלום כי שמרנו ב-localStorage,
        // וה-AuthStateChange יתפוס את זה כשהמשתמש יתחבר.
        return;
      }

      console.log("📱 [Push Token] User is logged in. Syncing token:", token);

      // 3. עדכון בבסיס הנתונים
      const { error } = await supabase
        .from("profiles")
        .update({ expo_push_token: token })
        .eq("id", user.id);

      if (error) {
        console.error("🔴 [Push Token] Database update failed:", error);
      } else {
        console.log("🟢 [Push Token] Successfully saved to DB!");
        // ניקוי ה-buffer כדי שלא נעדכן סתם שוב ושוב (אופציונלי, אפשר להשאיר)
        // window.localStorage.removeItem('expo_push_token_buffer');
      }
    } catch (err) {
      console.error("🔴 [Push Token] Error during sync:", err);
    }
  };

  useEffect(() => {
    // --- 1. האזנה להודעות מהאפליקציה (PostMessage) ---
    const handleMessage = (event: any) => {
      try {
        // סינון הודעות לא רלוונטיות
        if (!event.data || typeof event.data !== "string") return;

        // נסיון פירסור
        let parsedData;
        try {
          parsedData = JSON.parse(event.data);
        } catch (e) {
          return;
        } // לא JSON

        if (parsedData?.type === "EXPO_PUSH_TOKEN" && parsedData?.token) {
          console.log(
            "📱 [Push Token] Received from Native App:",
            parsedData.token
          );

          // שמירה מיידית ב-Local Storage של הדפדפן כגיבוי
          window.localStorage.setItem(
            "expo_push_token_buffer",
            parsedData.token
          );

          // נסיון סנכרון מיידי (יעבוד אם המשתמש כבר מחובר)
          syncTokenToDatabase(parsedData.token);
        }
      } catch (e) {
        console.error("Error parsing message", e);
      }
    };

    // תמיכה גם ב-window וגם ב-document (ליתר ביטחון באנדרואיד)
    window.addEventListener("message", handleMessage);
    document.addEventListener("message", handleMessage as any);

    // --- 2. האזנה לשינויי התחברות (Auth) ---
    // זה החלק שפותר את הבעיה: ברגע שהמשתמש מזוהה, אנחנו בודקים אם חיכה לו טוקן
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔐 [Auth Change]", event);
        if (session?.user) {
          // המשתמש התחבר - בוא נבדוק אם יש טוקן שמחכה בזיכרון
          await syncTokenToDatabase();
        }
      }
    );

    // --- 3. בדיקה יזומה בעלייה (למקרה שהטוקן כבר בזיכרון והמשתמש כבר מחובר) ---
    syncTokenToDatabase();

    return () => {
      window.removeEventListener("message", handleMessage);
      document.removeEventListener("message", handleMessage as any);
      authListener.subscription.unsubscribe();
    };
  }, []);
}
