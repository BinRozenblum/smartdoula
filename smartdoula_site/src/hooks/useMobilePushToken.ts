import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useMobilePushToken() {
  useEffect(() => {
    // פונקציה לטיפול בהודעות שמגיעות מה-WebView
    const handleMessage = async (event: any) => {
      try {
        // בודקים אם ההודעה היא בפורמט JSON (כפי ששלחנו מהאפליקציה)
        if (typeof event.data !== 'string') return;
        
        let parsedData;
        try {
          parsedData = JSON.parse(event.data);
        } catch (e) {
          // אם זה לא JSON, נתעלם
          return;
        }

        // אם זו ההודעה הנכונה עם הטוקן
        if (parsedData?.type === 'EXPO_PUSH_TOKEN' && parsedData?.token) {
          console.log("Received Push Token from App:", parsedData.token);
          
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            // שמירת הטוקן בפרופיל המשתמש
            const { error } = await supabase
              .from('profiles')
              .update({ expo_push_token: parsedData.token })
              .eq('id', user.id);

            if (error) {
              console.error("Error saving token:", error);
            } else {
              // אופציונלי: הצגת הודעה למשתמש (לצורך דיבוג או אישור)
              // toast.success("המכשיר חובר לקבלת התראות");
            }
          }
        }
      } catch (error) {
        console.error("Error handling webview message:", error);
      }
    };

    // האזנה לאירועים (תמיכה באנדרואיד ו-iOS)
    window.addEventListener("message", handleMessage);
    document.addEventListener("message", handleMessage as any);

    return () => {
      window.removeEventListener("message", handleMessage);
      document.removeEventListener("message", handleMessage as any);
    };
  }, []);
}