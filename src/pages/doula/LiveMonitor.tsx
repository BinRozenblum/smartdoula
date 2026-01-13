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
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

export default function LiveMonitor() {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [activeContraction, setActiveContraction] = useState<any>(null);
  const [recentContractions, setRecentContractions] = useState<any[]>([]);
  const [motherName, setMotherName] = useState("");
  const [loading, setLoading] = useState(true);

  const [liveSeconds, setLiveSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!clientId) return;
    fetchInitialData();

    const channel = supabase
      .channel("live-contractions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contractions",
          filter: `pregnancy_id=eq.${clientId}`,
        },
        (payload) => handleRealtimeUpdate(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [clientId]);

  useEffect(() => {
    if (activeContraction) {
      if (timerRef.current) clearInterval(timerRef.current);
      const startTime = new Date(activeContraction.start_time).getTime();
      const updateTimer = () => {
        const now = new Date().getTime();
        setLiveSeconds(Math.max(0, Math.floor((now - startTime) / 1000)));
      };
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    } else {
      setLiveSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [activeContraction]);

  const fetchInitialData = async () => {
    try {
      const { data: preg } = await supabase
        .from("pregnancies")
        .select("profiles:mother_id(full_name)")
        .eq("id", clientId)
        .single();
      if (preg) setMotherName(preg.profiles?.full_name || "יולדת");

      const { data: active } = await supabase
        .from("contractions")
        .select("*")
        .eq("pregnancy_id", clientId)
        .is("end_time", null)
        .maybeSingle();
      if (active) setActiveContraction(active);

      await fetchHistory();
    } catch (error) {
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
      .limit(10); // הגדלנו ל-10
    if (data) setRecentContractions(data);
  };

  const handleRealtimeUpdate = (payload: any) => {
    if (payload.eventType === "INSERT") {
      setActiveContraction(payload.new);
      toast.info("התחיל ציר חדש!");
    }
    if (payload.eventType === "UPDATE" && payload.new.end_time) {
      setActiveContraction(null);
      fetchHistory();
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (totalSeconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // --- חישוב סטטיסטיקה לשעה האחרונה ---
  const getStats = () => {
    const anHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourContractions = recentContractions.filter(
      (c) => new Date(c.start_time) > anHourAgo
    );

    if (hourContractions.length < 2) return null;

    const avgDuration =
      hourContractions.reduce((acc, c) => {
        const d =
          (new Date(c.end_time).getTime() - new Date(c.start_time).getTime()) /
          1000;
        return acc + d;
      }, 0) / hourContractions.length;

    return {
      count: hourContractions.length,
      avgDuration: Math.round(avgDuration),
    };
  };

  const stats = getStats();

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div
      className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 animate-fade-in"
      dir="rtl"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Activity className="text-red-500 animate-pulse" /> מוניטור חי:{" "}
          {motherName}
        </h1>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowRight className="ml-2 w-4 h-4" /> חזרה
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* צד שמאל: המונה החי (4 תאים ב-Grid) */}
        <Card
          className={`lg:col-span-5 shadow-xl border-2 transition-colors duration-500 ${
            activeContraction
              ? "border-red-500 bg-red-50"
              : "border-green-500 bg-green-50"
          }`}
        >
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">
              סטטוס רחם
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            {activeContraction ? (
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-48 h-48 rounded-full bg-red-500 text-white flex items-center justify-center text-6xl font-mono font-bold shadow-2xl border-[12px] border-red-200 animate-pulse">
                    {formatTime(liveSeconds)}
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-red-600">
                    ציר פעיל!
                  </h3>
                  <p className="text-muted-foreground font-medium flex items-center justify-center gap-1">
                    <Clock className="w-4 h-4" /> התחיל ב-
                    {new Date(activeContraction.start_time).toLocaleTimeString(
                      "he-IL",
                      { hour: "2-digit", minute: "2-digit" }
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="w-48 h-48 rounded-full bg-green-500 text-white flex items-center justify-center shadow-xl border-[12px] border-green-100">
                  <Clock className="w-20 h-20 opacity-80" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-green-700">מנוחה</h3>
                  <p className="text-muted-foreground font-medium">
                    ממתינים להתקשות הבאה...
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* צד ימין: היסטוריה וסטטיסטיקה (7 תאים ב-Grid) */}
        <div className="lg:col-span-7 space-y-4">
          {/* באנר סטטיסטיקה מהירה */}
          {stats && (
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex justify-around items-center text-primary shadow-sm">
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase">
                  צירים בשעה האחרונה
                </p>
                <p className="text-2xl font-black">{stats.count}</p>
              </div>
              <div className="h-8 w-px bg-primary/20" />
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase">משך ממוצע</p>
                <p className="text-2xl font-black">
                  {stats.avgDuration}{" "}
                  <span className="text-xs font-normal">שנ'</span>
                </p>
              </div>
              <TrendingUp className="w-8 h-8 opacity-20" />
            </div>
          )}

          <Card className="h-full">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Timer className="w-4 h-4" /> 10 צירים אחרונים
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[500px] overflow-y-auto">
              {recentContractions.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  <AlertCircle className="mx-auto mb-2 opacity-20" /> אין נתונים
                  זמינים
                </div>
              ) : (
                recentContractions.map((c, i) => {
                  const start = new Date(c.start_time);
                  const end = new Date(c.end_time);
                  const durationSec = Math.round(
                    (end.getTime() - start.getTime()) / 1000
                  );

                  // בדיקת תאריך (אם זה לא היום, נציג תאריך)
                  const isToday =
                    start.toDateString() === new Date().toDateString();
                  const dateLabel = isToday
                    ? ""
                    : start.toLocaleDateString("he-IL", {
                        day: "numeric",
                        month: "short",
                      });

                  const prev = recentContractions[i + 1];
                  let freqMin = null;
                  if (prev)
                    freqMin = Math.round(
                      (start.getTime() - new Date(prev.start_time).getTime()) /
                        60000
                    );

                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-4 border-b hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold">
                            {start.toLocaleTimeString("he-IL", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {dateLabel && (
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              {dateLabel}
                            </span>
                          )}
                        </div>
                        {freqMin && (
                          <p
                            className={`text-xs font-bold mt-1 ${
                              freqMin <= 4
                                ? "text-red-500"
                                : "text-muted-foreground"
                            }`}
                          >
                            כל {freqMin} דקות
                          </p>
                        )}
                      </div>

                      <div className="flex-1 text-center border-x px-2">
                        <span className="block text-[10px] uppercase text-muted-foreground font-bold">
                          משך
                        </span>
                        <span className="text-xl font-mono font-black">
                          {durationSec}
                          <span className="text-xs font-normal mr-1">שנ'</span>
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col items-end">
                        <span className="text-[10px] uppercase text-muted-foreground font-bold mb-1">
                          כאב
                        </span>
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
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
    </div>
  );
}
