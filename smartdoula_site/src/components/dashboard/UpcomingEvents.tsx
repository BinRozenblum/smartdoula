import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, isToday, isTomorrow } from "date-fns";
import { he } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export function UpcomingEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // חישוב תאריכים: מהיום עד עוד שבוע
      const today = new Date();
      const nextWeek = addDays(today, 7);

      // 1. קודם נשיג את ה-IDs של היולדות של הדולה הזו
      const { data: myPregnancies } = await supabase
        .from("pregnancies")
        .select("id")
        .eq("doula_id", user.id)
        .eq("is_active", true);

      if (!myPregnancies || myPregnancies.length === 0) {
        setLoading(false);
        return;
      }

      const pregnancyIds = myPregnancies.map((p) => p.id);

      // 2. שליפת האירועים בטווח הזמן
      const { data: eventsData, error } = await supabase
        .from("pregnancy_events")
        .select(
          `
          id,
          title,
          event_date,
          event_type,
          content,
          pregnancies (
            profiles:mother_id (full_name)
          )
        `,
        )
        .in("pregnancy_id", pregnancyIds)
        .gte("event_date", today.toISOString()) // החל מהיום
        .lte("event_date", nextWeek.toISOString()) // עד שבוע הבא
        .order("event_date", { ascending: true })
        .limit(5); // הגבלה ל-5 הקרובים ביותר

      if (error) throw error;

      setEvents(eventsData || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  // פונקציית עזר לפרמוט תאריך ידידותי בעברית
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "היום";
    if (isTomorrow(date)) return "מחר";
    return format(date, "EEEE, d.M", { locale: he });
  };

  // קונפיגורציה לאייקונים וצבעים לפי סוג אירוע
  const getTypeConfig = (type: string) => {
    switch (type) {
      case "meeting":
        return {
          bg: "bg-sage-light",
          text: "text-green-800",
          icon: <User className="w-5 h-5" />,
        };
      case "checkup": // בדיקה רפואית
        return {
          bg: "bg-blue-50",
          text: "text-blue-700",
          icon: <MapPin className="w-5 h-5" />,
        };
      case "birth_date": // תל"מ (אם הכנסנו אותו כאירוע)
        return {
          bg: "bg-red-50",
          text: "text-red-600",
          icon: <CalendarDays className="w-5 h-5" />,
        };
      default: // ברירת מחדל
        return {
          bg: "bg-muted",
          text: "text-foreground",
          icon: <Calendar className="w-5 h-5" />,
        };
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card animate-fade-in border border-border/40 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          השבוע הקרוב
        </h2>
        <button
          onClick={() => navigate("/doula/calendar")}
          className="text-xs text-primary font-bold hover:underline"
        >
          לכל היומן
        </button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-10 opacity-60 flex flex-col items-center">
            <Calendar className="w-10 h-10 mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              אין פגישות לשבוע הקרוב
            </p>
            <button
              onClick={() => navigate("/doula/calendar")}
              className="text-xs text-primary mt-2 underline"
            >
              הוסיפי אירוע ביומן
            </button>
          </div>
        ) : (
          events.map((event) => {
            const config = getTypeConfig(event.event_type);
            const eventTime = format(new Date(event.event_date), "HH:mm");

            return (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50 cursor-default group"
              >
                {/* אייקון */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-1",
                    config.bg,
                    config.text,
                  )}
                >
                  {config.icon}
                </div>

                {/* תוכן */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm truncate">
                    {event.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <User className="w-3 h-3" />
                    <span className="truncate">
                      {event.pregnancies?.profiles?.full_name || "לקוחה"}
                    </span>
                  </div>
                </div>

                {/* זמן */}
                <div className="text-left shrink-0">
                  <p
                    className={cn(
                      "text-xs font-bold bg-white border px-2 py-0.5 rounded-full shadow-sm",
                      config.text,
                    )}
                  >
                    {formatEventDate(event.event_date)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center justify-end gap-1">
                    {eventTime} <Clock className="w-3 h-3" />
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
