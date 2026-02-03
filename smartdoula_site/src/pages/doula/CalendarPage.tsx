import { useState, useEffect, useMemo } from "react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  Event,
  View,
} from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  isSameDay,
  startOfDay,
} from "date-fns";
import he from "date-fns/locale/he";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Save, Clock, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const locales = { he: he };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface MyEvent extends Event {
  id?: string;
  type: "meeting" | "birth_date" | "other";
  pregnancy_id?: string;
  content?: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State ניהול תאריך ותצוגה
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<View>("month");

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    start: "",
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

      const { data: pregnancies } = await supabase
        .from("pregnancies")
        .select("id, estimated_due_date, profiles:mother_id(full_name)")
        .eq("doula_id", user.id)
        .eq("is_active", true);

      setClients(pregnancies || []);

      const { data: pregEvents } = await supabase
        .from("pregnancy_events")
        .select("*")
        .in("pregnancy_id", pregnancies?.map((p) => p.id) || []);

      const calendarEvents: MyEvent[] = [];

      pregnancies?.forEach((p: any) => {
        if (p.estimated_due_date) {
          // יצירת תאריך מקומי נקי כדי למנוע קפיצה ליום קודם בגלל UTC
          const d = new Date(p.estimated_due_date);
          calendarEvents.push({
            id: `birth-${p.id}`,
            title: `תל"מ: ${p.profiles.full_name}`,
            start: d,
            end: d,
            allDay: true,
            type: "birth_date",
            pregnancy_id: p.id,
          });
        }
      });

      pregEvents?.forEach((e: any) => {
        const d = new Date(e.event_date);
        calendarEvents.push({
          id: e.id,
          title: e.title,
          start: d,
          end: new Date(d.getTime() + 60 * 60 * 1000),
          type: "meeting",
          pregnancy_id: e.pregnancy_id,
          content: e.content,
        });
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Calendar fetch error:", error);
      toast.error("שגיאה בטעינת נתונים");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = (dateToUse: Date = new Date()) => {
    setIsEditing(false);
    setSelectedEventId(null);
    const baseDate = new Date(dateToUse);
    baseDate.setMinutes(0);

    setFormData({
      title: "",
      start: format(baseDate, "yyyy-MM-dd'T'HH:mm"),
      end: format(
        new Date(baseDate.getTime() + 60 * 60 * 1000),
        "yyyy-MM-dd'T'HH:mm",
      ),
      pregnancy_id: "",
      content: "",
    });
    setIsDialogOpen(true);
  };

  const openEditModal = (event: MyEvent) => {
    if (event.type === "birth_date") {
      toast.info('תל"מ מנוהל דרך תיק היולדת');
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

  const handleSave = async () => {
    if (!formData.title || !formData.pregnancy_id || !formData.start) {
      toast.error("יש למלא שדות חובה");
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
      event_type: "meeting",
      created_by: user?.id,
    };
    try {
      if (isEditing && selectedEventId) {
        await supabase
          .from("pregnancy_events")
          .update(eventPayload)
          .eq("id", selectedEventId);
        toast.success("עודכן בהצלחה");
      } else {
        await supabase.from("pregnancy_events").insert(eventPayload);
        toast.success("נוצר בהצלחה");
      }
      setIsDialogOpen(false);
      fetchData();
    } catch {
      toast.error("שגיאה בשמירה");
    }
  };

  const handleDelete = async () => {
    if (!selectedEventId || !confirm("למחוק את האירוע?")) return;
    try {
      await supabase
        .from("pregnancy_events")
        .delete()
        .eq("id", selectedEventId);
      toast.success("נמחק בהצלחה");
      setIsDialogOpen(false);
      fetchData();
    } catch {
      toast.error("שגיאה במחיקה");
    }
  };

  // סינון אירועים ליום הנבחר - השוואה לפי תחילת יום למניעת באגים
  const selectedDayEvents = useMemo(() => {
    return events
      .filter((e) =>
        isSameDay(startOfDay(e.start as Date), startOfDay(selectedDate)),
      )
      .sort(
        (a, b) => (a.start as Date).getTime() - (b.start as Date).getTime(),
      );
  }, [events, selectedDate]);

  const daysWithEvents = useMemo(
    () => events.map((e) => e.start as Date),
    [events],
  );

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="animate-spin w-12 h-12 text-primary" />
      </div>
    );
  }

  return (
    <div
      className="p-4 h-[calc(100vh-4rem)] flex flex-col gap-4 animate-fade-in"
      dir="rtl"
    >
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">יומן פגישות</h1>
        <Button
          onClick={() => openAddModal(selectedDate)}
          className="gradient-warm gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">אירוע חדש</span>
        </Button>
      </div>

      {/* תצוגת דסקטופ */}
      <Card className="hidden md:block flex-1 p-4 shadow-card border-none bg-white/50">
        <BigCalendar
          localizer={localizer}
          events={events}
          date={selectedDate}
          onNavigate={(newDate) => setSelectedDate(newDate)}
          view={view}
          onView={(newView) => setView(newView)}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          culture="he"
          selectable
          onSelectSlot={(slot) => setSelectedDate(slot.start)}
          onSelectEvent={openEditModal}
          messages={{
            next: "הבא",
            previous: "הקודם",
            today: "היום",
            month: "חודש",
            week: "שבוע",
            day: "יום",
            agenda: "סדר יום",
          }}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor:
                event.type === "birth_date" ? "#e11d48" : "#10b981",
              borderRadius: "6px",
              fontSize: "0.85rem",
            },
          })}
          rtl={true}
        />
      </Card>

      {/* תצוגת מובייל */}
      <div className="md:hidden flex flex-col gap-4 h-full min-h-0">
        <Card className="border-none shadow-sm shrink-0">
          <CardContent className="p-0 flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={he}
              className="rounded-md border-none"
              modifiers={{ hasEvent: daysWithEvents }}
              modifiersClassNames={{
                hasEvent:
                  "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full font-bold text-primary",
              }}
            />
          </CardContent>
        </Card>

        <div className="flex-1 overflow-y-auto space-y-3 pb-20 custom-scrollbar">
          <h3 className="font-bold text-muted-foreground text-sm px-2 sticky top-0 bg-background/80 backdrop-blur py-1 z-10">
            אירועים ל-{format(selectedDate, "dd/MM/yyyy")}
          </h3>

          {selectedDayEvents.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-xl mx-2">
              אין אירועים ביום זה
            </div>
          ) : (
            selectedDayEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => openEditModal(event)}
                className={cn(
                  "bg-white p-4 rounded-xl shadow-sm border-r-4 flex items-center justify-between mx-2 active:scale-95 transition-transform",
                  event.type === "birth_date"
                    ? "border-r-red-500"
                    : "border-r-green-500",
                )}
              >
                <div>
                  <h4 className="font-bold text-foreground">{event.title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(event.start as Date, "HH:mm")}
                    </span>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-muted-foreground/50" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* דיאלוג הוספה/עריכה */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          dir="rtl"
          className="max-w-[90%] md:max-w-[425px] rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "עריכת אירוע" : "הוספת אירוע חדש"}
            </DialogTitle>
            <DialogDescription>
              הזיני את פרטי המפגש עם היולדת.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-right">
            <div className="space-y-2">
              <Label>יולדת</Label>
              <Select
                value={formData.pregnancy_id}
                onValueChange={(val) =>
                  setFormData({ ...formData, pregnancy_id: val })
                }
              >
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="בחר יולדת" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.profiles.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>כותרת</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>התחלה</Label>
                <Input
                  type="datetime-local"
                  value={formData.start}
                  onChange={(e) =>
                    setFormData({ ...formData, start: e.target.value })
                  }
                  className="text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label>סיום</Label>
                <Input
                  type="datetime-local"
                  value={formData.end}
                  onChange={(e) =>
                    setFormData({ ...formData, end: e.target.value })
                  }
                  className="text-xs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>הערות</Label>
              <Textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter className="flex-row justify-between gap-2">
            {isEditing && (
              <Button variant="destructive" size="icon" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <div className="flex gap-2 w-full justify-end">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                ביטול
              </Button>
              <Button onClick={handleSave} className="gradient-warm text-white">
                שמירה
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
