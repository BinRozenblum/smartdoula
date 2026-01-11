import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Phone,
  FileText,
  Baby,
  MessageSquare,
  Activity,
  MapPin,
  ArrowRight,
  Loader2,
  Clock,
  Plus,
  HeartPulse,
  AlertCircle,
} from "lucide-react";
import { WeeklyProgress } from "@/components/dashboard/WeeklyProgress";

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;

      try {
        setLoading(true);
        // שליפת פרטי הריון + חיבור לטבלת פרופילים של האמא
        // שים לב: profiles:mother_id בודק את ה-Foreign Key
        const { data: preg, error: pregError } = await supabase
          .from("pregnancies")
          .select(
            `
            *,
            profiles:mother_id (
              id,
              full_name,
              phone,
              address,
              personal_notes,
              avatar_url,
              date_of_birth
            )
          `
          )
          .eq("id", id)
          .single();

        if (pregError) throw pregError;

        // שליפת אירועים
        const { data: evs } = await supabase
          .from("pregnancy_events")
          .select("*")
          .eq("pregnancy_id", id)
          .order("event_date", { ascending: false });

        setData(preg);
        setEvents(evs || []);
      } catch (error) {
        console.error("Error fetching client details:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] w-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">טוען תיק יולדת...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold">לא נמצאו נתונים</h2>
        <Button onClick={() => navigate("/doula/clients")}>חזרה לרשימה</Button>
      </div>
    );
  }

  // חישוב שבוע הריון
  const { currentWeek, daysInWeek } = calculatePregnancyProgress(
    data.last_period_date,
    data.estimated_due_date
  );

  // נתונים לתצוגה עם ערכי ברירת מחדל
  const motherName = data.profiles?.full_name || "שם לא זמין";
  const avatarLetter = motherName[0] || "?";
  const motherAge = calculateAge(data.profiles?.date_of_birth);

  return (
    <div
      className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto animate-fade-in"
      dir="rtl"
    >
      {/* כפתור חזרה */}
      <Button
        variant="ghost"
        className="gap-2 text-muted-foreground hover:text-foreground p-0 hover:bg-transparent"
        onClick={() => navigate("/doula/clients")}
      >
        <ArrowRight className="w-4 h-4" />
        חזרה לרשימת היולדות
      </Button>

      {/* כותרת ראשית ופרטים בסיסיים */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 bg-card p-6 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full gradient-warm flex items-center justify-center text-3xl font-bold text-white shadow-md">
            {avatarLetter}
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">{motherName}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {motherAge && <span>בת {motherAge}</span>}
              {motherAge && (
                <span className="w-1 h-1 bg-muted-foreground/40 rounded-full" />
              )}
              <span>{data.profiles?.address || "אין כתובת"}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge
                variant="outline"
                className="bg-background border-primary/30 text-primary"
              >
                שבוע {currentWeek} + {daysInWeek}
              </Badge>
              {data.tags?.map((tag: string) => (
                <Badge
                  key={tag}
                  className="bg-sage/20 text-secondary-foreground hover:bg-sage/30 border-sage/50"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto min-w-[200px]">
          <div className="flex items-center gap-3 text-sm text-muted-foreground bg-background/50 p-2 rounded-lg border border-border/50">
            <Phone className="w-4 h-4 text-primary" />
            <a
              href={`tel:${data.profiles?.phone}`}
              dir="ltr"
              className="hover:text-primary transition-colors"
            >
              {data.profiles?.phone || "אין טלפון"}
            </a>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground bg-background/50 p-2 rounded-lg border border-border/50">
            <Calendar className="w-4 h-4 text-primary" />
            <span>
              תל"מ:{" "}
              {new Date(data.estimated_due_date).toLocaleDateString("he-IL")}
            </span>
          </div>
        </div>

        <Button
          onClick={() => navigate(`/doula/live-monitor/${id}`)}
          className="bg-red-500 hover:bg-red-600 text-white gap-2 shadow-lg animate-pulse"
        >
          <Activity className="w-4 h-4" />
          צפייה במוניטור חי
        </Button>
      </div>

      {/* סרגל התקדמות */}
      <WeeklyProgress currentWeek={currentWeek} />

      {/* טאבים למידע */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList
          className="w-full justify-start h-12 bg-muted/50 p-1 rounded-xl mb-6"
          dir="rtl"
        >
          <TabsTrigger
            value="timeline"
            className="flex-1 max-w-[200px] rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            ציר זמן ופגישות
          </TabsTrigger>
          <TabsTrigger
            value="details"
            className="flex-1 max-w-[200px] rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            תיק רפואי ופרטים
          </TabsTrigger>
          <TabsTrigger
            value="birth"
            className="flex-1 max-w-[200px] rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            סיכום לידה
          </TabsTrigger>
        </TabsList>

        {/* --- טאב ציר זמן --- */}
        <TabsContent value="timeline" className="space-y-4" dir="rtl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">היסטוריית ליווי</h3>
            <Button size="sm" variant="outline" className="gap-2 bg-white">
              <Plus className="w-4 h-4" /> תיעוד חדש
            </Button>
          </div>

          <div className="relative border-r-2 border-muted pr-8 mr-3 space-y-8 min-h-[200px]">
            {events.length === 0 ? (
              <div className="text-center text-muted-foreground py-10 bg-muted/20 rounded-xl border border-dashed">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>אין אירועים מתועדים עדיין</p>
              </div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="relative group">
                  <div className="absolute -right-[41px] top-4 w-5 h-5 rounded-full bg-background border-4 border-primary shadow-sm z-10" />
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="py-4 pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {getEventIcon(event.event_type)}
                          <CardTitle className="text-base font-bold">
                            {event.title}
                          </CardTitle>
                        </div>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          {new Date(event.event_date).toLocaleDateString(
                            "he-IL"
                          )}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4 pt-2">
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {event.content}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* --- טאב תיק רפואי ופרטים --- */}
        <TabsContent value="details" dir="rtl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* מידע רפואי - חדש! */}
            <Card className="md:col-span-2 bg-red-50/30 border-red-100">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-900">
                  <HeartPulse className="w-5 h-5 text-red-500" />
                  מידע רפואי קריטי
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase">
                    סוג דם
                  </span>
                  <p className="font-semibold text-lg">
                    {data.blood_type || "לא ידוע"}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase">
                    מספר עוברים
                  </span>
                  <p className="font-semibold text-lg">
                    {data.number_of_fetuses || 1}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase">
                    רגישויות/אלרגיות
                  </span>
                  <p className="font-medium text-red-600">
                    {data.allergies || "ללא"}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase">
                    מחלות רקע
                  </span>
                  <p className="font-medium">
                    {data.background_diseases || "ללא"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-secondary-foreground" />
                  העדפות ללידה
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-semibold block text-sm mb-1">
                    בית חולים מועדף:
                  </span>
                  <p className="text-muted-foreground">
                    {data.hospital_preference || "טרם הוחלט"}
                  </p>
                </div>
                <div>
                  <span className="font-semibold block text-sm mb-1">
                    הערות כלליות:
                  </span>
                  <p className="text-muted-foreground text-sm leading-relaxed bg-muted/30 p-3 rounded-lg">
                    {data.profiles?.personal_notes ||
                      "אין הערות מיוחדות בפרופיל"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-terracotta" />
                  פרטים נוספים
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-semibold block text-sm mb-1">
                    תאריך וסת אחרון:
                  </span>
                  <p className="text-muted-foreground">
                    {data.last_period_date
                      ? new Date(data.last_period_date).toLocaleDateString(
                          "he-IL"
                        )
                      : "לא הוזן"}
                  </p>
                </div>
                <div>
                  <span className="font-semibold block text-sm mb-1">
                    היסטוריית לידות (G/P):
                  </span>
                  <p className="text-muted-foreground">
                    {data.g_p_summary || "-"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- טאב סיכום לידה --- */}
        <TabsContent value="birth" dir="rtl">
          <Card
            className={
              !data.birth_date
                ? "border-dashed bg-muted/10"
                : "bg-gradient-to-br from-white to-orange-50/50 border-orange-100"
            }
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Baby className="w-6 h-6 text-primary" />
                פרטי הלידה
              </CardTitle>
              <CardDescription>
                {data.birth_date
                  ? "בשעה טובה! הנה הפרטים שתועדו מהלידה."
                  : "אזור זה יתמלא אוטומטית לאחר דיווח על לידה."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!data.birth_date ? (
                // --- מצב: טרם נולדו ---
                <div className="text-center py-10 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <Baby className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                  <h3 className="text-lg font-semibold text-muted-foreground">
                    הלידה טרם דווחה
                  </h3>
                  <p className="text-sm text-muted-foreground/70 max-w-xs mb-6">
                    כאשר היולדת תלד, תוכלי להזין כאן את תאריך הלידה, המשקל
                    וסיכום החוויה.
                  </p>
                  <Button className="gradient-warm text-white gap-2 shadow-lg hover:shadow-xl transition-all">
                    <Plus className="w-4 h-4" />
                    דיווח על לידה חדשה
                  </Button>
                </div>
              ) : (
                // --- מצב: לאחר לידה (הצגת נתונים) ---
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* תאריך ושעה */}
                  <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-orange-100 text-orange-500">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-muted-foreground mb-1">
                        תאריך ושעה
                      </h4>
                      <p className="text-xl font-bold text-foreground">
                        {new Date(data.birth_date).toLocaleDateString("he-IL", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        בשעה{" "}
                        {new Date(data.birth_date).toLocaleTimeString("he-IL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* משקל */}
                  <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100 text-blue-500">
                      {/* Scale icon is not in basic lucide imports sometimes, using Baby as fallback or verify import */}
                      <Baby className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-muted-foreground mb-1">
                        משקל התינוק/ת
                      </h4>
                      <p className="text-xl font-bold text-foreground">
                        {data.baby_weight
                          ? `${data.baby_weight.toLocaleString()} גרם`
                          : "לא צוין"}
                      </p>
                    </div>
                  </div>

                  {/* סוג לידה */}
                  <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-purple-100 text-purple-500">
                      <HeartPulse className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-muted-foreground mb-1">
                        סוג לידה
                      </h4>
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-bold text-foreground">
                          {data.delivery_type || "לידה וגינלית"}
                        </p>
                        {/* אפשר להוסיף כאן תגית אם זה ניתוח */}
                        {data.delivery_type?.includes("קיסרי") && (
                          <Badge variant="destructive" className="text-[10px]">
                            ניתוח
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* סיכום מילולי - תופס רוחב מלא */}
                  <div className="col-span-1 md:col-span-2 mt-4">
                    <h4 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      סיכום מהלך הלידה
                    </h4>
                    <div className="bg-white/80 p-5 rounded-2xl border border-orange-100 shadow-sm">
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap text-base">
                        {data.birth_summary || "לא הוזן סיכום מילולי ללידה זו."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- פונקציות חישוב ---

// חישוב שבוע הריון מוסת אחרון או מתאריך לידה משוער
function calculatePregnancyProgress(
  lastPeriodDate: string | null,
  dueDate: string
) {
  let startDate = new Date();

  if (lastPeriodDate) {
    startDate = new Date(lastPeriodDate);
  } else if (dueDate) {
    // אם אין וסת אחרון, נחשב אחורה 280 יום מהתל"מ
    startDate = new Date(
      new Date(dueDate).getTime() - 280 * 24 * 60 * 60 * 1000
    );
  } else {
    return { currentWeek: 0, daysInWeek: 0 };
  }

  const today = new Date();
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const currentWeek = Math.floor(diffDays / 7);
  const daysInWeek = diffDays % 7;

  return {
    currentWeek: Math.min(42, Math.max(0, currentWeek)),
    daysInWeek,
  };
}

function calculateAge(dob: string) {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const ageDifMs = Date.now() - birthDate.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function getEventIcon(type: string) {
  const baseClass =
    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0";
  switch (type) {
    case "meeting":
      return (
        <div className={`${baseClass} bg-blue-100 text-blue-600`}>
          <Calendar className="w-5 h-5" />
        </div>
      );
    case "phone_call":
      return (
        <div className={`${baseClass} bg-green-100 text-green-600`}>
          <Phone className="w-5 h-5" />
        </div>
      );
    case "note":
      return (
        <div className={`${baseClass} bg-orange-100 text-orange-600`}>
          <MessageSquare className="w-5 h-5" />
        </div>
      );
    case "checkup":
      return (
        <div className={`${baseClass} bg-purple-100 text-purple-600`}>
          <FileText className="w-5 h-5" />
        </div>
      );
    default:
      return (
        <div className={`${baseClass} bg-gray-100 text-gray-600`}>
          <Clock className="w-5 h-5" />
        </div>
      );
  }
}
