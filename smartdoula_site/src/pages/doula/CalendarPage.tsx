import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer, Event } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import he from "date-fns/locale/he";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Save, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// לוקליזציה לעברית
const locales = {
  he: he,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// הגדרת סוג האירוע ביומן
interface MyEvent extends Event {
  id?: string;
  type: "meeting" | "birth_date" | "other";
  pregnancy_id?: string;
  content?: string; // תיאור
}

export default function CalendarPage() {
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [clients, setClients] = useState<any[]>([]); // רשימת יולדות לבחירה
  const [loading, setLoading] = useState(true);

  // ניהול הדיאלוג (מודאל)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // טופס
  const [formData, setFormData] = useState({
    title: "",
    start: "", // YYYY-MM-DDTHH:mm format for input
    end: "",
    pregnancy_id: "",
    content: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. שליפת יולדות (עבור ה-Select בטופס ועבור תל"מ)
      const { data: pregnancies } = await supabase
        .from("pregnancies")
        .select("id, estimated_due_date, profiles:mother_id(full_name)")
        .eq("doula_id", user.id)
        .eq("is_active", true);

      setClients(pregnancies || []);

      // 2. שליפת אירועים (פגישות)
      const { data: pregEvents } = await supabase
        .from("pregnancy_events")
        .select("*")
        .in("pregnancy_id", pregnancies?.map((p) => p.id) || []);

      const calendarEvents: MyEvent[] = [];

      // הוספת תאריכי לידה משוערים (לא ניתנים לעריכה דרך היומן כרגע)
      pregnancies?.forEach((p: any) => {
        if (p.estimated_due_date) {
          calendarEvents.push({
            id: `birth-${p.id}`,
            title: `תל"מ: ${p.profiles.full_name}`,
            start: new Date(p.estimated_due_date),
            end: new Date(p.estimated_due_date),
            allDay: true,
            type: "birth_date",
            pregnancy_id: p.id,
          });
        }
      });

      // הוספת פגישות/אירועים
      pregEvents?.forEach((e: any) => {
        calendarEvents.push({
          id: e.id,
          title: e.title,
          start: new Date(e.event_date),
          end: new Date(new Date(e.event_date).getTime() + 60 * 60 * 1000), // ברירת מחדל שעה
          type: "meeting",
          pregnancy_id: e.pregnancy_id,
          content: e.content,
        });
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error(error);
      toast.error("שגיאה בטעינת נתונים");
    } finally {
      setLoading(false);
    }
  };

  // --- לחיצה על מקום ריק ביומן (הוספה) ---
  const handleSelectSlot = ({ start }: { start: Date }) => {
    setIsEditing(false);
    setSelectedEventId(null);

    // הגדרת תאריך ושעה התחלתית (פורמט לאינפוט)
    const startDateStr = format(start, "yyyy-MM-dd'T'HH:mm");
    const endDateStr = format(
      new Date(start.getTime() + 60 * 60 * 1000),
      "yyyy-MM-dd'T'HH:mm",
    );

    setFormData({
      title: "",
      start: startDateStr,
      end: endDateStr,
      pregnancy_id: "",
      content: "",
    });
    setIsDialogOpen(true);
  };

  // --- לחיצה על אירוע קיים (עריכה) ---
  const handleSelectEvent = (event: MyEvent) => {
    // לא מאפשרים עריכת תל"מ דרך היומן (זה מגיע מפרופיל היולדת)
    if (event.type === "birth_date") {
      toast.info("זהו תאריך לידה משוער. ניתן לשנות אותו דרך כרטיס היולדת.");
      return;
    }

    setIsEditing(true);
    setSelectedEventId(event.id as string);
    setFormData({
      title: event.title as string,
      start: format(event.start as Date, "yyyy-MM-dd'T'HH:mm"),
      end: format(event.end as Date, "yyyy-MM-dd'T'HH:mm"),
      pregnancy_id: event.pregnancy_id || "",
      content: event.content || "",
    });
    setIsDialogOpen(true);
  };

  // --- שמירה (יצירה או עדכון) ---
  const handleSave = async () => {
    if (!formData.title || !formData.pregnancy_id || !formData.start) {
      toast.error("נא למלא את כל השדות החובה");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const eventPayload = {
      pregnancy_id: formData.pregnancy_id,
      title: formData.title,
      content: formData.content,
      event_date: new Date(formData.start).toISOString(),
      event_type: "meeting", // כרגע הכל מוגדר כפגישה/הערה
      created_by: user?.id,
    };

    try {
      if (isEditing && selectedEventId) {
        // עדכון
        const { error } = await supabase
          .from("pregnancy_events")
          .update(eventPayload)
          .eq("id", selectedEventId);

        if (error) throw error;
        toast.success("האירוע עודכן בהצלחה");
      } else {
        // יצירה חדשה
        const { error } = await supabase
          .from("pregnancy_events")
          .insert(eventPayload);

        if (error) throw error;
        toast.success("האירוע נוצר בהצלחה");
      }

      setIsDialogOpen(false);
      fetchData(); // רענון הלוח
    } catch (error) {
      console.error(error);
      toast.error("שגיאה בשמירת האירוע");
    }
  };

  // --- מחיקה ---
  const handleDelete = async () => {
    if (!selectedEventId) return;
    if (!confirm("האם למחוק את האירוע הזה?")) return;

    try {
      const { error } = await supabase
        .from("pregnancy_events")
        .delete()
        .eq("id", selectedEventId);

      if (error) throw error;

      toast.success("האירוע נמחק");
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("שגיאה במחיקה");
    }
  };

  // עיצוב האירועים בלוח
  const eventStyleGetter = (event: MyEvent) => {
    let backgroundColor = "#10b981"; // ירוק (פגישה)
    if (event.type === "birth_date") backgroundColor = "#e11d48"; // אדום (תל"מ)

    return {
      style: {
        backgroundColor,
        borderRadius: "6px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
        fontSize: "0.85rem",
      },
    };
  };

  if (loading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div
      className="p-4 md:p-6 h-[calc(100vh-2rem)] flex flex-col gap-4 animate-fade-in"
      dir="rtl"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">יומן פגישות</h1>
        <Button
          onClick={() => handleSelectSlot({ start: new Date() })}
          className="gradient-warm gap-2"
        >
          <Plus className="w-4 h-4" /> אירוע חדש
        </Button>
      </div>

      <Card className="flex-1 p-4 shadow-card border-none bg-white/50 backdrop-blur-sm">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          culture="he"
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          messages={{
            next: "הבא",
            previous: "הקודם",
            today: "היום",
            month: "חודש",
            week: "שבוע",
            day: "יום",
            agenda: "סדר יום",
            date: "תאריך",
            time: "זמן",
            event: "אירוע",
            noEventsInRange: "אין אירועים בטווח זה",
          }}
          eventPropGetter={eventStyleGetter}
          rtl={true}
        />
      </Card>

      {/* --- דיאלוג הוספה/עריכה --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "עריכת אירוע" : "הוספת אירוע חדש"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* בחירת יולדת */}
            <div className="space-y-2">
              <Label>יולדת מקושרת</Label>
              <Select
                value={formData.pregnancy_id}
                onValueChange={(val) =>
                  setFormData({ ...formData, pregnancy_id: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר יולדת מהרשימה" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.profiles.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* כותרת */}
            <div className="space-y-2">
              <Label>נושא הפגישה</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="למשל: הכנה ללידה מפגש 1"
              />
            </div>

            {/* זמנים */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>התחלה</Label>
                <Input
                  type="datetime-local"
                  value={formData.start}
                  onChange={(e) =>
                    setFormData({ ...formData, start: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>סיום (משוער)</Label>
                <Input
                  type="datetime-local"
                  value={formData.end}
                  onChange={(e) =>
                    setFormData({ ...formData, end: e.target.value })
                  }
                />
              </div>
            </div>

            {/* תיאור */}
            <div className="space-y-2">
              <Label>הערות / מיקום</Label>
              <Textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between gap-2">
            {isEditing && (
              <Button
                variant="destructive"
                size="icon"
                onClick={handleDelete}
                title="מחיקה"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <div className="flex gap-2 w-full justify-end">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                ביטול
              </Button>
              <Button onClick={handleSave} className="gradient-warm text-white">
                <Save className="w-4 h-4 ml-2" /> שמירה
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
