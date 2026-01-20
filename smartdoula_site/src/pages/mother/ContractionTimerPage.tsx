import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Play,
  Square,
  Timer,
  History,
  Droplets,
  Plug,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

export default function ContractionTimerPage() {
  const [activeContraction, setActiveContraction] = useState<any>(null);
  const [pregnancyId, setPregnancyId] = useState<string | null>(null);
  const [doulaId, setDoulaId] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [intensity, setIntensity] = useState([5]); // 1-10
  const [history, setHistory] = useState<any[]>([]);

  // נתונים רפואיים
  const [waterBreakTime, setWaterBreakTime] = useState<string | null>(null);
  const [mucusPlugTime, setMucusPlugTime] = useState<string | null>(null);

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

    const { data: preg } = await supabase
      .from("pregnancies")
      .select("id, doula_id, water_break_time, mucus_plug_time")
      .eq("mother_id", user.id)
      .eq("is_active", true)
      .single();

    if (preg) {
      setPregnancyId(preg.id);
      setDoulaId(preg.doula_id);
      setWaterBreakTime(preg.water_break_time);
      setMucusPlugTime(preg.mucus_plug_time);

      checkForActiveContraction(preg.id);
      fetchHistory(preg.id);
    }
  };

  const checkForActiveContraction = async (pregId: string) => {
    const { data } = await supabase
      .from("contractions")
      .select("*")
      .eq("pregnancy_id", pregId)
      .is("end_time", null)
      .order("start_time", { ascending: false })
      .maybeSingle();

    if (data) {
      setActiveContraction(data);
      const startTime = new Date(data.start_time).getTime();
      const now = new Date().getTime();
      setSeconds(Math.floor((now - startTime) / 1000));
    }
  };

  const fetchHistory = async (pregId: string) => {
    const { data } = await supabase
      .from("contractions")
      .select("*")
      .eq("pregnancy_id", pregId)
      .not("end_time", "is", null)
      .order("start_time", { ascending: false })
      .limit(20);
    if (data) setHistory(data);
  };

  // --- התחלת ציר ---
  const handleStart = async () => {
    if (!pregnancyId) return;

    try {
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

      if (navigator.vibrate) navigator.vibrate(200);
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
      setIntensity([5]);
      fetchHistory(pregnancyId!);
      toast.success("הציר נשמר בהצלחה");

      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } catch (e: any) {
      toast.error("שגיאה בסיום: " + e.message);
    }
  };

  // --- טוגל אירוע רפואי (דיווח או ביטול) ---
  const toggleMedicalEvent = async (type: "water" | "plug") => {
    if (!pregnancyId) return;

    const isWater = type === "water";
    const currentValue = isWater ? waterBreakTime : mucusPlugTime;
    const label = isWater ? "ירידת מים" : "יציאת הפקק";

    // 1. אם כבר קיים - זהו ביטול
    if (currentValue) {
      if (!confirm(`האם לבטל את הדיווח על ${label}?`)) return;

      const updateData = isWater
        ? { water_break_time: null }
        : { mucus_plug_time: null };

      try {
        const { error } = await supabase
          .from("pregnancies")
          .update(updateData)
          .eq("id", pregnancyId);
        if (error) throw error;

        if (isWater) setWaterBreakTime(null);
        else setMucusPlugTime(null);

        toast.info(`דיווח ${label} בוטל`);
      } catch (e) {
        toast.error("שגיאה בביטול");
      }
      return;
    }

    // 2. אם לא קיים - זהו דיווח חדש
    const now = new Date().toISOString();
    const updateData = isWater
      ? { water_break_time: now }
      : { mucus_plug_time: now };

    try {
      const { error } = await supabase
        .from("pregnancies")
        .update(updateData)
        .eq("id", pregnancyId);
      if (error) throw error;

      if (isWater) setWaterBreakTime(now);
      else setMucusPlugTime(now);

      toast.success(`${label} תועדה בהצלחה`, {
        description: "הדולה שלך קיבלה את העדכון",
      });

      // שליחת התראה לדולה
      if (doulaId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        await supabase.from("notifications").insert({
          doula_id: doulaId,
          mother_id: user?.id,
          pregnancy_id: pregnancyId,
          title: `${label}!`,
          message: `היולדת דיווחה על ${label}`,
          type: "medical_update",
        });
      }
    } catch (e: any) {
      toast.error("שגיאה בדיווח");
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (totalSeconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <div
      className="p-4 max-w-lg mx-auto space-y-8 animate-fade-in pb-20"
      dir="rtl"
    >
      {/* כותרת */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold flex justify-center items-center gap-2 text-foreground">
          <Timer className="w-6 h-6 text-primary" /> חדר לידה דיגיטלי
        </h1>
        <p className="text-sm text-muted-foreground">אנחנו איתך בכל ציר.</p>
      </div>

      {/* --- הטיימר הראשי (נקי ללא הבהובים) --- */}
      <div className="relative flex flex-col items-center justify-center">
        <button
          onClick={activeContraction ? handleStop : handleStart}
          className={`
                relative z-10 w-72 h-72 rounded-full flex flex-col items-center justify-center transition-colors duration-300 shadow-xl border-[8px]
                ${
                  activeContraction
                    ? "bg-red-500 border-red-400 text-white" // רקע אדום יציב
                    : "bg-white border-primary/20 text-foreground" // רקע לבן רגיל
                }
            `}
        >
          <span className="text-7xl font-mono font-bold tracking-widest tabular-nums drop-shadow-sm">
            {formatTime(seconds)}
          </span>
          <span className="text-lg mt-2 font-bold flex items-center gap-2">
            {activeContraction ? (
              <>
                <Square className="fill-current w-5 h-5" /> סיום ציר
              </>
            ) : (
              <>
                <Play className="fill-current w-5 h-5" /> התחלת ציר
              </>
            )}
          </span>
        </button>
      </div>

      {/* --- סרגל עוצמה (מוצג רק בזמן ציר) --- */}
      <div
        className={`transition-all duration-500 transform ${
          activeContraction
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none h-0 overflow-hidden"
        }`}
      >
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-red-100">
          <div className="flex justify-between items-center mb-4">
            <label className="text-sm font-bold text-red-900">
              כמה כואב עכשיו?
            </label>
            <span className="text-2xl font-black text-red-500">
              {intensity}
            </span>
          </div>
          <Slider
            value={intensity}
            onValueChange={setIntensity}
            max={10}
            min={1}
            step={1}
            className="py-2"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-medium">
            <span>נסבל 🙂</span>
            <span>בינוני 😐</span>
            <span>כואב מאוד 😣</span>
          </div>
        </div>
      </div>

      {/* --- לחצנים רפואיים (מים / פקק) --- */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className={`relative h-28 flex flex-col gap-1 border-2 rounded-2xl transition-all ${waterBreakTime ? "bg-blue-50 border-blue-300" : "bg-white border-muted hover:border-blue-200"}`}
          onClick={() => toggleMedicalEvent("water")}
        >
          {/* אייקון ביטול קטן שמופיע רק כשיש דיווח */}
          {waterBreakTime && (
            <div className="absolute top-2 left-2 text-muted-foreground hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </div>
          )}

          <div
            className={`p-2 rounded-full ${waterBreakTime ? "bg-blue-200 text-blue-700" : "bg-gray-100 text-gray-500"}`}
          >
            <Droplets className="w-6 h-6" />
          </div>
          {waterBreakTime ? (
            <div className="text-center animate-fade-in">
              <span className="block font-bold text-blue-900 text-sm">
                ירדו המים
              </span>
              <span className="text-[10px] text-blue-700 font-medium">
                {formatDistanceToNow(new Date(waterBreakTime), {
                  addSuffix: true,
                  locale: he,
                })}
              </span>
            </div>
          ) : (
            <span className="text-sm font-bold text-gray-600">
              דיווח ירידת מים
            </span>
          )}
        </Button>

        <Button
          variant="outline"
          className={`relative h-28 flex flex-col gap-1 border-2 rounded-2xl transition-all ${mucusPlugTime ? "bg-pink-50 border-pink-300" : "bg-white border-muted hover:border-pink-200"}`}
          onClick={() => toggleMedicalEvent("plug")}
        >
          {mucusPlugTime && (
            <div className="absolute top-2 left-2 text-muted-foreground hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </div>
          )}

          <div
            className={`p-2 rounded-full ${mucusPlugTime ? "bg-pink-200 text-pink-700" : "bg-gray-100 text-gray-500"}`}
          >
            <Plug className="w-6 h-6" />
          </div>
          {mucusPlugTime ? (
            <div className="text-center animate-fade-in">
              <span className="block font-bold text-pink-900 text-sm">
                יצא הפקק
              </span>
              <span className="text-[10px] text-pink-700 font-medium">
                {formatDistanceToNow(new Date(mucusPlugTime), {
                  addSuffix: true,
                  locale: he,
                })}
              </span>
            </div>
          ) : (
            <span className="text-sm font-bold text-gray-600">
              דיווח פקק רירי
            </span>
          )}
        </Button>
      </div>

      {/* --- היסטוריה אחרונה --- */}
      <div className="space-y-4 pt-4">
        <h3 className="font-bold flex items-center gap-2 text-muted-foreground text-sm border-b pb-2">
          <History className="w-4 h-4" /> היסטוריית צירים (20 אחרונים)
        </h3>

        {history.length === 0 ? (
          <p className="text-center text-muted-foreground py-4 text-sm">
            עדיין לא נרשמו צירים.
          </p>
        ) : (
          <div className="space-y-3">
            {history.map((c, i) => {
              const start = new Date(c.start_time);
              const end = c.end_time ? new Date(c.end_time) : null;
              const duration = end
                ? Math.round((end.getTime() - start.getTime()) / 1000)
                : 0;

              const prevContraction = history[i + 1];
              let intervalMinutes = null;

              if (prevContraction && prevContraction.end_time) {
                const prevEnd = new Date(prevContraction.end_time).getTime();
                const currentStart = start.getTime();
                intervalMinutes = Math.floor(
                  (currentStart - prevEnd) / 1000 / 60,
                );
              }

              return (
                <Card
                  key={c.id}
                  className="border-none shadow-sm bg-secondary/10 overflow-hidden"
                >
                  <CardContent className="p-0 flex h-16">
                    <div className="w-24 bg-white/50 flex flex-col justify-center items-center border-l px-2">
                      <span className="font-bold text-lg text-foreground">
                        {start.toLocaleTimeString("he-IL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {intervalMinutes !== null && (
                        <span
                          className={`text-[10px] font-bold ${intervalMinutes < 5 ? "text-red-500" : "text-muted-foreground"}`}
                        >
                          כל {intervalMinutes} דק'
                        </span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-center px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          משך הציר:
                        </span>
                        <span className="font-mono font-bold text-lg">
                          {formatTime(duration)}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-12 flex items-center justify-center font-bold text-white ${
                        c.intensity >= 8
                          ? "bg-red-500"
                          : c.intensity >= 5
                            ? "bg-orange-400"
                            : "bg-green-400"
                      }`}
                    >
                      {c.intensity}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
