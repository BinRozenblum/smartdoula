import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { WeeklyProgress } from "../../components/dashboard/WeeklyProgress";
import { ContractionTimer } from "../../components/dashboard/ContractionTimer";
import { AlertsWidget } from "../../components/dashboard/AlertsWidget";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function MotherDashboard() {
  const { profile } = useOutletContext<{ profile: any }>();
  const navigate = useNavigate();

  // State
  const [pregnancyData, setPregnancyData] = useState<any>(null);
  const [doulaProfile, setDoulaProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [profile.id]);

  const fetchData = async () => {
    try {
      // 1. שליפת פרטי הריון פעיל (כולל חיבור לדולה)
      const { data: preg, error } = await supabase
        .from("pregnancies")
        .select("*, doula:doula_id(*)") // שואבים גם את פרטי הדולה דרך ה-Join
        .eq("mother_id", profile.id)
        .eq("is_active", true)
        .maybeSingle(); // maybeSingle מונע שגיאה אם אין תוצאה

      if (error) throw error;

      if (preg) {
        setPregnancyData(preg);

        // אם ה-Join עבד, preg.doula יכיל את המידע.
        // אם לא, ננסה לשלוף ידנית (גיבוי למקרה שה-Types לא מסתדרים)
        if (preg.doula) {
          setDoulaProfile(preg.doula);
        } else if (preg.doula_id) {
          const { data: dData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", preg.doula_id)
            .single();
          setDoulaProfile(dData);
        }
      }
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      // לא מקפיצים Toast כדי לא להציק למשתמש בכניסה
    } finally {
      setLoading(false);
    }
  };

  // חישוב שבוע נוכחי
  const calculateWeek = () => {
    if (!pregnancyData?.estimated_due_date) return 0;
    const due = new Date(pregnancyData.estimated_due_date).getTime();
    const now = new Date().getTime();
    const diffWeeks = Math.floor((due - now) / (1000 * 60 * 60 * 24 * 7));
    return Math.max(0, 40 - diffWeeks);
  };

  const currentWeek = calculateWeek();

  if (loading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  return (
    <div
      className="p-4 md:p-8 space-y-8 animate-fade-in max-w-6xl mx-auto"
      dir="rtl"
    >
      {/* --- Header & Greeting --- */}
      <header className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              היי {profile?.full_name?.split(" ")[0]}{" "}
              <Heart className="text-pink-400 fill-pink-400 w-6 h-6 animate-pulse" />
            </h1>
            <p className="text-muted-foreground mt-1">
              {currentWeek > 0
                ? `שבוע ${currentWeek} להריון`
                : "ברוכה הבאה ל-SmartDoula"}
            </p>
          </div>

          {/* לחצני קשר מהירים עם הדולה */}
          {doulaProfile && (
            <div className="flex gap-3 w-full md:w-auto">
              <a
                href={`https://wa.me/${doulaProfile.phone?.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 md:flex-none"
              >
                <Button
                  variant="outline"
                  className="w-full gap-2 border-green-200 text-green-700 hover:bg-green-50 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" /> ווטסאפ לדולה
                </Button>
              </a>
              <a
                href={`tel:${doulaProfile.phone}`}
                className="flex-1 md:flex-none"
              >
                <Button
                  variant="destructive"
                  className="w-full gap-2 shadow-sm bg-red-500 hover:bg-red-600"
                >
                  <Phone className="w-4 h-4" /> SOS לדולה
                </Button>
              </a>
            </div>
          )}
        </div>

        {/* --- המסר היומי מהדולה --- */}
        {doulaProfile?.daily_broadcast_message && (
          <div className="bg-gradient-to-br from-peach-light/40 to-white p-6 rounded-2xl border-r-4 border-peach shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-lg md:text-xl font-medium text-foreground/90 italic leading-relaxed">
                "{doulaProfile.daily_broadcast_message}"
              </p>
              <div className="flex items-center gap-2 mt-3">
                {doulaProfile.avatar_url && (
                  <img
                    src={doulaProfile.avatar_url}
                    alt="Doula"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                )}
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  – {doulaProfile.full_name}, הדולה שלך
                </span>
              </div>
            </div>
            {/* קישוט רקע */}
            <Heart className="absolute -left-4 -bottom-4 w-32 h-32 text-peach/10 -rotate-12 z-0" />
          </div>
        )}
      </header>

      {/* --- Main Content Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* עמודה מרכזית רחבה */}
        <div className="lg:col-span-2 space-y-8">
          {/* סרגל התקדמות שבועי */}
          <WeeklyProgress
            currentWeek={currentWeek || 0}
            className="py-8 bg-white/60 backdrop-blur-sm border-none shadow-soft"
          />

          {/* כרטיסי מידע וקישורים */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
              className="bg-white hover:shadow-hover transition-all cursor-pointer border-none shadow-card group"
              onClick={() => navigate("/mother/settings")} // לדוגמה לתוכנית לידה
            >
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-sage/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Heart className="w-6 h-6 text-sage" />
                </div>
                <h3 className="font-bold text-lg">תוכנית לידה</h3>
                <p className="text-sm text-muted-foreground">
                  המכתב שלך לצוות הרפואי. ניתן לערוך ולשתף בכל רגע.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-hover transition-all border-none shadow-card">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-peach/20 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-terracotta" />
                </div>
                <h3 className="font-bold text-lg">אנשי קשר</h3>
                <p className="text-sm text-muted-foreground">
                  {doulaProfile
                    ? `${doulaProfile.full_name} זמינה עבורך.`
                    : "עדיין לא קושרה דולה."}
                  <br />
                  {pregnancyData?.hospital_primary &&
                    `רשום ביה"ח: ${pregnancyData.hospital_primary}`}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* עמודה צדדית: טיימר והתראות */}
        <div className="space-y-8">
          {/* ווידג'ט טיימר (גרסה מקוצרת אם רוצים, או המלא) */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-200 to-peach-200 rounded-[20px] blur opacity-30"></div>
            <ContractionTimer />
          </div>

          <AlertsWidget />
        </div>
      </div>
    </div>
  );
}
