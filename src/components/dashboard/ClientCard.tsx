import { Calendar, MapPin, Clock, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ClientCardProps {
  name: string;
  week: number;
  dueDate: string;
  location: string;
  status: "active" | "approaching" | "urgent";
  avatar?: string;
  lastUpdate?: string;
  onClick?: () => void;
}

export function ClientCard({
  name,
  week,
  dueDate,
  location,
  status,
  lastUpdate,
  onClick,
}: ClientCardProps) {
  const statusConfig = {
    active: {
      bg: "bg-sage-light",
      text: "text-secondary-foreground",
      label: "פעילה",
      ring: "ring-sage",
    },
    approaching: {
      bg: "bg-peach-light",
      text: "text-terracotta",
      label: "מתקרבת ללידה",
      ring: "ring-peach",
    },
    urgent: {
      bg: "bg-destructive/10",
      text: "text-destructive",
      label: "דחוף",
      ring: "ring-destructive",
    },
  };

  const config = statusConfig[status];

  return (
    <div 
      className={cn(
        "bg-card rounded-2xl p-5 shadow-card transition-all duration-300 hover:shadow-hover cursor-pointer group animate-fade-in",
        "border-r-4",
        status === "active" && "border-r-sage",
        status === "approaching" && "border-r-peach",
        status === "urgent" && "border-r-destructive"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-semibold text-foreground">
            {name.split(" ").map(n => n[0]).join("")}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="font-semibold text-foreground truncate">{name}</h3>
            <span className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0",
              config.bg,
              config.text
            )}>
              {config.label}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-medium text-primary">שבוע {week}</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {dueDate}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              {location}
            </div>
            {lastUpdate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                עדכון אחרון: {lastUpdate}
              </div>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
}
