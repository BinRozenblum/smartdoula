import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowRight,
  Clock,
  Loader2,
  Timer,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function LiveMonitor() {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [activeContraction, setActiveContraction] = useState<any>(null);
  const [recentContractions, setRecentContractions] = useState<any[]>([]);
  const [motherName, setMotherName] = useState("");
  const [loading, setLoading] = useState(true);

  // טיימר מקומי
  const [liveSeconds, setLiveSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!clientId) return;

    fetchInitialData();

    // --- REALTIME SETUP ---
    const channel = supabase
      .channel("live-contractions")
      .on(
        "postgres_changes",
        {
          event: "*", // האזנה לכל השינויים (INSERT, UPDATE)
          schema: "public",
          table: "contractions",
          filter: `pregnancy_id=eq.${clientId}`,
        },
        (payload) => {
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Connected to Realtime updates");
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [clientId]);

  // ניהול הטיימר החי
  useEffect(() => {
    if (activeContraction) {
      // אם יש טיימר קודם, ננקה אותו
      if (timerRef.current) clearInterval(timerRef.current);

      // חישוב הזמן ההתחלתי
      const startTime = new Date(activeContraction.start_time).getTime();

      // פונקציית עדכון מיידית
      const updateTimer = () => {
        const now = new Date().getTime();
        const diff = Math.floor((now - startTime) / 1000);
        setLiveSeconds(diff >= 0 ? diff : 0);
      };

      updateTimer(); // הרצה ראשונית
      timerRef.current = setInterval(updateTimer, 1000); // הרצה כל שנייה
    } else {
      setLiveSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [activeContraction]);

  const fetchInitialData = async () => {
    try {
      // 1. קבלת שם האם
      const { data: preg } = await supabase
        .from("pregnancies")
        .select("profiles:mother_id(full_name)")
        .eq("id", clientId)
        .single();

      if (preg) setMotherName(preg.profiles?.full_name || "יולדת");

      // 2. בדיקה אם יש ציר פעיל כרגע
      // שים לב: השינוי הגדול הוא השימוש ב-maybeSingle במקום single
      const { data: active, error } = await supabase
        .from("contractions")
        .select("*")
        .eq("pregnancy_id", clientId)
        .is("end_time", null)
        .maybeSingle();

      if (error) console.error("Error fetching active contraction:", error);
      if (active) setActiveContraction(active);

      // 3. היסטוריה אחרונה
      await fetchHistory();
    } catch (error) {
      console.error("Error initializing monitor:", error);
      toast.error("שגיאה בטעינת נתונים");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    const { data } = await supabase
      .from("contractions")
      .select("*")
      .eq("pregnancy_id", clientId)
      .not("end_time", "is", null)
      .order("start_time", { ascending: false })
      .limit(5);

    if (data) setRecentContractions(data);
  };

  const handleRealtimeUpdate = (payload: any) => {
    console.log("Realtime update received:", payload);

    // מקרה 1: התחיל ציר חדש
    if (payload.eventType === "INSERT") {
      setActiveContraction(payload.new);
      toast.info("התחיל ציר חדש!");
    }

    // מקרה 2: ציר הסתיים (עודכן)
    if (payload.eventType === "UPDATE") {
      // אם הציר שהיה פעיל קיבל זמן סיום
      if (payload.new.end_time) {
        setActiveContraction(null);
        // רענון ההיסטוריה כדי לראות את הציר שהסתיים
        fetchHistory();
      }
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (totalSeconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p>מתחבר למוניטור...</p>
      </div>
    );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-fade-in" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="w-6 h-6 text-red-500 animate-pulse" />
          מוניטור חי: {motherName}
        </h1>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowRight className="w-4 h-4" /> חזרה
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* כרטיס סטטוס ראשי */}
        <Card
          className={`border-2 shadow-lg transition-all duration-500 ${
            activeContraction
              ? "border-red-500 bg-red-50"
              : "border-green-500 bg-green-50"
          }`}
        >
          <CardHeader>
            <CardTitle className="text-center text-lg">סטטוס נוכחי</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10 min-h-[300px]">
            {activeContraction ? (
              <>
                <div className="relative">
                  <span className="absolute -top-4 -right-4 flex h-6 w-6">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500"></span>
                  </span>
                  <div className="w-48 h-48 rounded-full bg-red-500 text-white flex items-center justify-center text-5xl font-mono font-bold animate-pulse shadow-xl border-8 border-red-200">
                    {formatTime(liveSeconds)}
                  </div>
                </div>
                <h3 className="mt-6 text-3xl font-bold text-red-600 animate-pulse">
                  ציר פעיל!
                </h3>
                <p className="text-muted-foreground mt-2 font-medium">
                  התחיל בשעה:{" "}
                  {new Date(activeContraction.start_time).toLocaleTimeString(
                    "he-IL"
                  )}
                </p>
              </>
            ) : (
              <>
                <div className="w-48 h-48 rounded-full bg-green-500 text-white flex items-center justify-center shadow-xl border-8 border-green-200">
                  <Clock className="w-20 h-20" />
                </div>
                <h3 className="mt-6 text-3xl font-bold text-green-700">
                  במנוחה
                </h3>
                <p className="text-muted-foreground mt-2 font-medium">
                  ממתינים לציר הבא...
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* היסטוריה וסטטיסטיקה */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5" /> 5 צירים אחרונים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentContractions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>עדיין לא תועדו צירים בהריון זה.</p>
              </div>
            ) : (
              recentContractions.map((c, i) => {
                const start = new Date(c.start_time);
                const end = new Date(c.end_time);
                const durationSec = Math.round(
                  (end.getTime() - start.getTime()) / 1000
                );

                // חישוב מרווח מהציר הבא (שהוא הקודם כרונולוגית ברשימה שלנו)
                // ברשימה ממוינת יורד (הכי חדש למעלה), ה"קודם" בזמן הוא האינדקס הבא [i+1]
                const prevContraction =
                  i < recentContractions.length - 1
                    ? recentContractions[i + 1]
                    : null;
                let freqMin = null;

                if (prevContraction) {
                  const prevStart = new Date(prevContraction.start_time);
                  // תדירות = הפרש בין התחלת ציר נוכחי להתחלת ציר קודם
                  freqMin = Math.round(
                    (start.getTime() - prevStart.getTime()) / 60000
                  );
                }

                return (
                  <div
                    key={c.id}
                    className="flex justify-between items-center p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      <p className="font-bold text-lg">
                        {start.toLocaleTimeString("he-IL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {freqMin && (
                        <Badge variant="secondary" className="text-[10px] mt-1">
                          כל {freqMin} דק'
                        </Badge>
                      )}
                    </div>
                    <div className="text-center px-4 border-l border-r mx-2">
                      <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">
                        משך
                      </span>
                      <span className="font-mono font-bold text-xl">
                        {formatTime(durationSec)}
                      </span>
                    </div>
                    <div className="flex flex-col items-center min-w-[3rem]">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                        כאב
                      </span>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                          c.intensity >= 8
                            ? "bg-red-600"
                            : c.intensity >= 5
                            ? "bg-orange-500"
                            : "bg-green-500"
                        }`}
                      >
                        {c.intensity}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
