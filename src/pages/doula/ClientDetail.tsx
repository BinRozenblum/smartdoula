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
  MapPin,
  ArrowRight,
  Loader2,
  Clock,
  Plus,
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
        // 1. שליפת פרטי הריון ופרופיל האם
        const { data: preg, error: pregError } = await supabase
          .from("pregnancies")
          .select(
            `
            *,
            profiles:mother_id(*)
          `
          )
          .eq("id", id)
          .single();

        if (pregError) throw pregError;

        // 2. שליפת אירועים (Timeline)
        const { data: evs, error: evsError } = await supabase
          .from("pregnancy_events")
          .select("*")
          .eq("pregnancy_id", id)
          .order("event_date", { ascending: false });

        if (evsError) console.error("Error fetching events:", evsError);

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

  // מניעת קריסה: תצוגת טעינה כל עוד אין נתונים
  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] w-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">טוען תיק יולדת...</p>
      </div>
    );
  }

  // מניעת קריסה: אם הטעינה הסתיימה אבל לא נמצאו נתונים
  if (!data) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold">לא נמצאו נתונים</h2>
        <Button onClick={() => navigate("/clients")}>חזרה לרשימה</Button>
      </div>
    );
  }

  const currentWeek = calculateWeek(data.estimated_due_date);
  const motherName = data.profiles?.full_name || "ללא שם";
  const avatarLetter = motherName[0] || "?";

  return (
    <div
      className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto animate-fade-in"
      dir="rtl"
    >
      {/* כפתור חזרה */}
      <Button
        variant="ghost"
        className="gap-2 text-muted-foreground hover:text-foreground p-0 hover:bg-transparent"
        onClick={() => navigate("/clients")}
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
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-background">
                שבוע {currentWeek}
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
          <div className="flex items-center gap-3 text-sm text-muted-foreground bg-background/50 p-2 rounded-lg">
            <Phone className="w-4 h-4 text-primary" />
            <span dir="ltr">{data.profiles?.phone || "אין טלפון"}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground bg-background/50 p-2 rounded-lg">
            <Calendar className="w-4 h-4 text-primary" />
            <span>
              תאריך משוער:{" "}
              {new Date(data.estimated_due_date).toLocaleDateString("he-IL")}
            </span>
          </div>
        </div>
      </div>

      {/* סרגל התקדמות */}
      <WeeklyProgress currentWeek={currentWeek} />

      {/* טאבים למידע */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="w-full justify-start h-12 bg-muted/50 p-1 rounded-xl mb-6" dir="rtl">
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
            פרטים אישיים
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
            <Button size="sm" variant="outline" className="gap-2">
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
                  {/* נקודה על הציר */}
                  <div className="absolute -right-[41px] top-4 w-5 h-5 rounded-full bg-background border-4 border-primary shadow-sm z-10 group-hover:scale-110 transition-transform" />

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

        {/* --- טאב פרטים מעמיקים --- */}
        <TabsContent value="details" dir="rtl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-terracotta" />
                  כתובת ומגורים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {data.profiles?.address || "לא הוזנה כתובת"}
                </p>
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
                    הערות חשובות:
                  </span>
                  <p className="text-muted-foreground text-sm leading-relaxed bg-muted/30 p-3 rounded-lg">
                    {data.profiles?.personal_notes || "אין הערות מיוחדות"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- טאב לידה --- */}
        <TabsContent value="birth" dir="rtl">
          <Card
            className={
              !data.birth_date
                ? "border-dashed bg-muted/10"
                : "bg-gradient-to-br from-white to-orange-50/50"
            }
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Baby className="w-6 h-6 text-primary" /> פרטי הלידה
              </CardTitle>
              <CardDescription>
                {data.birth_date
                  ? "מזל טוב! הנה פרטי הלידה המתועדים."
                  : "החלק הזה יתמלא לאחר הלידה."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!data.birth_date ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Baby className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground mb-4">
                    הלידה טרם דווחה במערכת.
                  </p>
                  <Button
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/5"
                  >
                    דיווח על לידה
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      תאריך ושעה
                    </h4>
                    <p className="text-lg font-semibold">
                      {new Date(data.birth_date).toLocaleString("he-IL")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      משקל התינוק/ת
                    </h4>
                    <p className="text-lg font-semibold">
                      {data.baby_weight ? `${data.baby_weight} גרם` : "לא צוין"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      סוג לידה
                    </h4>
                    <p className="text-lg font-semibold">
                      {data.delivery_type || "רגילה"}
                    </p>
                  </div>
                  <div className="col-span-full bg-white p-4 rounded-xl border shadow-sm">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      סיכום מהלך הלידה
                    </h4>
                    <p className="text-foreground leading-relaxed">
                      {data.birth_summary || "לא הוזן סיכום מילולי."}
                    </p>
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

// פונקציות עזר
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

function calculateWeek(dueDate: string) {
  if (!dueDate) return 0;
  const diff = new Date(dueDate).getTime() - new Date().getTime();
  const weeksLeft = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  return Math.max(0, 40 - weeksLeft);
}
