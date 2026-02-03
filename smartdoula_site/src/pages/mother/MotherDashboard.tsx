import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Phone,
  MessageCircle,
  Heart,
  Loader2,
  UserPlus,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { WeeklyProgress } from "../../components/dashboard/WeeklyProgress";
import { ContractionTimer } from "../../components/dashboard/ContractionTimer";
import { AlertsWidget } from "../../components/dashboard/AlertsWidget";

export function MotherDashboard() {
  const { profile } = useOutletContext<{ profile: any }>();
  const navigate = useNavigate();

  const [pregnancyData, setPregnancyData] = useState<any>(null);
  const [doulaProfile, setDoulaProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State לחיבור דולה חדשה
  const [doulaCode, setDoulaCode] = useState("");
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    fetchData();
  }, [profile.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: preg, error } = await supabase
        .from("pregnancies")
        .select("*, doula:doula_id(*)")
        .eq("mother_id", profile.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (preg) {
        setPregnancyData(preg);
        setDoulaProfile(preg.doula);
      }
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // ... (בתוך handleConnectDoula)
  const handleConnectDoula = async () => {
    const cleanCode = doulaCode.trim().toUpperCase(); // הפיכה לאותיות גדולות
    if (!cleanCode) {
      toast.error("נא להזין קוד דולה");
      return;
    }

    setLinking(true);
    try {
      // 1. חיפוש הדולה לפי הקוד הקצר
      const { data: doula, error: doulaErr } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("doula_link_code", cleanCode) // חיפוש לפי השדה החדש
        .eq("role", "doula")
        .maybeSingle();

      if (doulaErr || !doula) {
        toast.error("קוד לא תקין. ודאי שהקוד שהזנת מדויק.");
        return;
      }

      // 2. יצירת היריון חדש מחובר ל-ID של הדולה שמצאנו
      const { error: insertErr } = await supabase.from("pregnancies").insert({
        mother_id: profile.id,
        doula_id: doula.id, // משתמשים ב-UUID האמיתי שמצאנו
        is_active: true,
        estimated_due_date: new Date(Date.now() + 280 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      });

      if (insertErr) throw insertErr;

      toast.success(`שורתם בהצלחה לדולה ${doula.full_name}!`);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error("שגיאה בתהליך החיבור");
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  // --- מצב שבו האמא לא מחוברת לדולה ---
  if (!pregnancyData) {
    return (
      <div
        className="p-4 max-w-2xl mx-auto space-y-8 animate-fade-in text-right"
        dir="rtl"
      >
        <header className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 gradient-warm rounded-full flex items-center justify-center shadow-soft">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold">
            ברוכה הבאה, {profile.full_name}!
          </h1>
          <p className="text-muted-foreground text-lg">
            כדי להתחיל את המעקב ולשתף נתונים עם הדולה שלך, אנחנו צריכים לחבר
            ביניכן.
          </p>
        </header>

        <Card className="border-none shadow-hover bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="text-primary" /> חיבור לדולה
            </CardTitle>
            <CardDescription>
              בקשי מהדולה שלך את "קוד הדולה" שלה (מזהה הפרופיל שלה) והדביקי אותו
              כאן.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="הדביקי כאן את הקוד..."
                value={doulaCode}
                onChange={(e) => setDoulaCode(e.target.value)}
                className="text-center font-mono"
              />
            </div>
            <Button
              onClick={handleConnectDoula}
              disabled={linking}
              className="w-full gradient-warm text-white h-12 text-lg font-bold"
            >
              {linking ? (
                <Loader2 className="animate-spin" />
              ) : (
                "התחברי לדולה שלי"
              )}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          אין לך דולה? את עדיין יכולה להשתמש בטיימר הצירים באופן מקומי, אך
          הנתונים לא יישלחו לאף אחד.
        </p>
      </div>
    );
  }

  // --- מצב רגיל (כבר מחוברת לדולה) ---
  return (
    <div
      className="p-4 md:p-8 space-y-8 animate-fade-in max-w-6xl mx-auto"
      dir="rtl"
    >
      {/* ... (שאר הקוד הקיים של ה-Dashboard נשאר אותו דבר) */}
      <header className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              היי {profile?.full_name?.split(" ")[0]}{" "}
              <Heart className="text-pink-400 fill-pink-400 w-6 h-6 animate-pulse" />
            </h1>
            <p className="text-muted-foreground mt-1">
              שבוע{" "}
              {Math.max(
                1,
                40 -
                  Math.floor(
                    (new Date(pregnancyData.estimated_due_date).getTime() -
                      Date.now()) /
                      (1000 * 60 * 60 * 24 * 7),
                  ),
              )}{" "}
              להריון
            </p>
          </div>
          {doulaProfile && (
            <div className="flex gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                className="flex-1 md:flex-none gap-2 border-green-200 text-green-700"
                onClick={() =>
                  window.open(
                    `https://wa.me/${doulaProfile.phone?.replace(/\D/g, "")}`,
                  )
                }
              >
                <MessageCircle className="w-4 h-4" /> ווטסאפ
              </Button>
              <Button
                variant="destructive"
                className="flex-1 md:flex-none gap-2"
                onClick={() =>
                  (window.location.href = `tel:${doulaProfile.phone}`)
                }
              >
                <Phone className="w-4 h-4" /> SOS
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <WeeklyProgress
            currentWeek={Math.max(
              1,
              40 -
                Math.floor(
                  (new Date(pregnancyData.estimated_due_date).getTime() -
                    Date.now()) /
                    (1000 * 60 * 60 * 24 * 7),
                ),
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigate("/mother/contractions")}
            >
              <CardContent className="p-6 text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="text-primary" />
                </div>
                <h3 className="font-bold">טיימר צירים</h3>
                <p className="text-xs text-muted-foreground">
                  לחצי כאן לתזמון בזמן אמת
                </p>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigate("/mother/settings")}
            >
              <CardContent className="p-6 text-center space-y-2">
                <div className="w-12 h-12 bg-sage/10 rounded-full flex items-center justify-center mx-auto">
                  <UserPlus className="text-sage" />
                </div>
                <h3 className="font-bold">פרטים רפואיים</h3>
                <p className="text-xs text-muted-foreground">
                  עדכון תל"מ ותוכנית לידה
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="space-y-8">
         
          <AlertsWidget />
        </div>
      </div>
    </div>
  );
}
