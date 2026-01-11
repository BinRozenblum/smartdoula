import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Play, Square, Timer, Activity, History } from "lucide-react";

export default function ContractionTimerPage() {
  const [activeContraction, setActiveContraction] = useState<any>(null);
  const [pregnancyId, setPregnancyId] = useState<string | null>(null);
  const [doulaId, setDoulaId] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [intensity, setIntensity] = useState([5]); // 1-10
  const [history, setHistory] = useState<any[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchPregnancyInfo();
  }, []);

  // טיימר רץ
  useEffect(() => {
    if (activeContraction) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setSeconds(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeContraction]);

  const fetchPregnancyInfo = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // שליפת הריון פעיל כדי לקבל ID ו-Doula ID
    const { data: preg } = await supabase
      .from("pregnancies")
      .select("id, doula_id")
      .eq("mother_id", user.id)
      .eq("is_active", true)
      .single();

    if (preg) {
      setPregnancyId(preg.id);
      setDoulaId(preg.doula_id);
      fetchHistory(preg.id);
    }
  };

  const fetchHistory = async (pregId: string) => {
    const { data } = await supabase
      .from("contractions")
      .select("*")
      .eq("pregnancy_id", pregId)
      .order("start_time", { ascending: false })
      .limit(20);
    if (data) setHistory(data);
  };

  // --- התחלת ציר ---
  const handleStart = async () => {
    if (!pregnancyId) return;

    try {
      // 1. יצירת רשומה בטבלה
      const { data, error } = await supabase
        .from("contractions")
        .insert({
          pregnancy_id: pregnancyId,
          start_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      setActiveContraction(data);

      // 2. שליחת התראה לדולה (רק אם מוגדרת דולה)
      if (doulaId) {
        await supabase.from("notifications").insert({
          doula_id: doulaId,
          mother_id: (await supabase.auth.getUser()).data.user?.id,
          title: "התחלת תזמון צירים",
          message: "היולדת התחילה לתזמן ציר כעת.",
          type: "contraction",
        });
        toast.info("הדולה קיבלה עדכון על תחילת הציר");
      }
    } catch (e: any) {
      toast.error("שגיאה בהתחלה: " + e.message);
    }
  };

  // --- סיום ציר ---
  const handleStop = async () => {
    if (!activeContraction) return;

    try {
      const { error } = await supabase
        .from("contractions")
        .update({
          end_time: new Date().toISOString(),
          intensity: intensity[0],
        })
        .eq("id", activeContraction.id);

      if (error) throw error;

      setActiveContraction(null);
      setIntensity([5]); // איפוס עוצמה
      fetchHistory(pregnancyId!); // רענון היסטוריה
      toast.success("הציר נשמר בהצלחה");
    } catch (e: any) {
      toast.error("שגיאה בסיום: " + e.message);
    }
  };

  // פירמוט זמן MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (totalSeconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-8 animate-fade-in text-center">
      <h1 className="text-3xl font-bold flex justify-center items-center gap-2">
        <Timer className="w-8 h-8 text-primary" /> תזמון צירים
      </h1>

      {/* הטיימר הראשי */}
      <div
        className={`w-64 h-64 mx-auto rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-xl border-8 ${
          activeContraction
            ? "bg-primary text-white border-primary-foreground animate-pulse"
            : "bg-white text-foreground border-muted"
        }`}
      >
        <span className="text-6xl font-mono font-bold tracking-wider">
          {formatTime(seconds)}
        </span>
        <span className="text-sm mt-2 font-medium opacity-80">
          {activeContraction ? "ציר פעיל" : "במנוחה"}
        </span>
      </div>

      {/* בורר עוצמה (מוצג רק בזמן ציר) */}
      <div
        className={`transition-all duration-300 ${
          activeContraction ? "opacity-100" : "opacity-30 pointer-events-none"
        }`}
      >
        <label className="text-sm font-medium mb-2 block">
          עוצמת הכאב: {intensity}
        </label>
        <Slider
          value={intensity}
          onValueChange={setIntensity}
          max={10}
          min={1}
          step={1}
          className="py-4"
        />
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>קל</span>
          <span>בינוני</span>
          <span>חזק מאוד</span>
        </div>
      </div>

      {/* כפתור פעולה */}
      <Button
        size="lg"
        className={`w-full h-16 text-xl rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] ${
          activeContraction ? "bg-red-500 hover:bg-red-600" : "gradient-warm"
        }`}
        onClick={activeContraction ? handleStop : handleStart}
      >
        {activeContraction ? (
          <>
            <Square className="w-6 h-6 mr-2 fill-current" /> סיום ציר
          </>
        ) : (
          <>
            <Play className="w-6 h-6 mr-2 fill-current" /> התחלת ציר
          </>
        )}
      </Button>

      {/* היסטוריה */}
      <div className="text-right space-y-3">
        <h3 className="font-bold flex items-center gap-2 text-muted-foreground">
          <History className="w-4 h-4" /> היסטוריה אחרונה
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {history.map((c) => {
            const start = new Date(c.start_time);
            const end = c.end_time ? new Date(c.end_time) : null;
            const duration = end
              ? Math.round((end.getTime() - start.getTime()) / 1000)
              : 0;

            return (
              <Card
                key={c.id}
                className="border-none shadow-sm bg-secondary/20"
              >
                <CardContent className="p-3 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm">
                      {start.toLocaleTimeString("he-IL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {start.toLocaleDateString("he-IL")}
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground block">
                      משך
                    </span>
                    <span className="font-mono font-medium">
                      {formatTime(duration)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity
                      className={`w-4 h-4 ${
                        c.intensity > 7 ? "text-red-500" : "text-green-500"
                      }`}
                    />
                    <span className="font-bold">{c.intensity || "-"}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
