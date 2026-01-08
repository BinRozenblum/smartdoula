import { AlertTriangle, Info, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Alert {
  id: string;
  type: "urgent" | "warning" | "info" | "success";
  title: string;
  message: string;
  time: string;
}

const initialAlerts: Alert[] = [
  {
    id: "1",
    type: "urgent",
    title: "שירה לוי - צירים",
    message: "דווח על צירים סדירים כל 5 דקות",
    time: "לפני 10 דקות",
  },
  {
    id: "2",
    type: "warning",
    title: "נועה כהן - שבוע 39",
    message: "מתקרבת לתאריך הלידה המשוער",
    time: "לפני שעה",
  },
  {
    id: "3",
    type: "info",
    title: "פגישה בעוד שעתיים",
    message: "פגישת היכרות עם לקוחה חדשה",
    time: "לפני שעתיים",
  },
];

const alertConfig = {
  urgent: {
    bg: "bg-destructive/10 border-destructive/30",
    icon: AlertTriangle,
    iconColor: "text-destructive",
  },
  warning: {
    bg: "bg-peach-light border-peach/50",
    icon: AlertTriangle,
    iconColor: "text-terracotta",
  },
  info: {
    bg: "bg-sage-light border-sage/50",
    icon: Info,
    iconColor: "text-secondary-foreground",
  },
  success: {
    bg: "bg-sage-light border-sage",
    icon: CheckCircle,
    iconColor: "text-secondary-foreground",
  },
};

export function AlertsWidget() {
  const [alerts, setAlerts] = useState(initialAlerts);

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">התראות</h2>
          {alerts.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
              {alerts.length}
            </span>
          )}
        </div>
        {alerts.length > 0 && (
          <button 
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setAlerts([])}
          >
            נקה הכל
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-sage-light flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-secondary-foreground" />
          </div>
          <p className="text-muted-foreground">אין התראות חדשות</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const config = alertConfig[alert.type];
            const Icon = config.icon;
            return (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border transition-all",
                  config.bg
                )}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", config.iconColor)} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{alert.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
