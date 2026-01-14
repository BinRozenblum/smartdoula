import { Calendar, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  client: string;
  date: string;
  time: string;
  type: "meeting" | "checkup" | "birth" | "reminder";
}

const events: Event[] = [
  {
    id: "1",
    title: "פגישת היכרות",
    client: "נועה כהן",
    date: "היום",
    time: "14:00",
    type: "meeting",
  },
  {
    id: "2",
    title: "בדיקת מעקב שבועית",
    client: "שירה לוי",
    date: "מחר",
    time: "10:30",
    type: "checkup",
  },
  {
    id: "3",
    title: "תאריך לידה משוער",
    client: "מיכל ברק",
    date: "15.01",
    time: "-",
    type: "birth",
  },
  {
    id: "4",
    title: "הכנה ללידה - מפגש 3",
    client: "דנה אברהם",
    date: "18.01",
    time: "16:00",
    type: "meeting",
  },
];

const typeConfig = {
  meeting: { bg: "bg-sage-light", text: "text-secondary-foreground", icon: "👥" },
  checkup: { bg: "bg-peach-light", text: "text-terracotta", icon: "📋" },
  birth: { bg: "bg-primary/10", text: "text-primary", icon: "👶" },
  reminder: { bg: "bg-lavender", text: "text-foreground", icon: "🔔" },
};

export function UpcomingEvents() {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-card animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">אירועים קרובים</h2>
        <button className="text-sm text-primary hover:underline">הצג הכל</button>
      </div>

      <div className="space-y-3">
        {events.map((event) => {
          const config = typeConfig[event.type];
          return (
            <div
              key={event.id}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                config.bg
              )}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{event.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="w-3 h-3" />
                  <span>{event.client}</span>
                </div>
              </div>
              <div className="text-left">
                <p className={cn("text-sm font-medium", config.text)}>{event.date}</p>
                {event.time !== "-" && (
                  <p className="text-xs text-muted-foreground">{event.time}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
