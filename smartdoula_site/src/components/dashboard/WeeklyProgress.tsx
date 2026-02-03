import { cn } from "@/lib/utils";

interface WeeklyProgressProps {
  currentWeek: number;
  className?: string;
}

export function WeeklyProgress({ currentWeek, className }: WeeklyProgressProps) {
  const trimester = currentWeek <= 12 ? 1 : currentWeek <= 27 ? 2 : 3;
  const progress = (currentWeek / 40) * 100;
  console.log(currentWeek);
  console.log(progress);

  const milestones = [
    { week: 12, label: "סיום טרימסטר 1" },
    { week: 20, label: "אולטרסאונד מערכות" },
    { week: 27, label: "סיום טרימסטר 2" },
    { week: 37, label: "לידה בטוחה" },
    { week: 40, label: "תאריך לידה משוער" },
  ];

  return (
    <div className={cn("bg-card rounded-2xl p-6 shadow-card animate-fade-in", className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">התקדמות ההיריון</h2>
        <span className="text-sm text-muted-foreground">טרימסטר {trimester}</span>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-8">
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full gradient-warm rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Week indicator */}
        <div 
          className="absolute -top-1 transition-all duration-500"
          style={{ right: `${progress}%`, transform: "translateX(50%)" }}
        >
          <div className="w-6 h-6 rounded-full bg-primary shadow-soft flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary-foreground">{currentWeek}</span>
          </div>
        </div>

        {/* Milestone markers */}
        {milestones.map((m) => (
          <div
            key={m.week}
            className="absolute -bottom-6"
            style={{ right: `${(m.week / 40) * 100}%`, transform: "translateX(50%)" }}
          >
            <div className={cn(
              "w-2 h-2 rounded-full",
              currentWeek >= m.week ? "bg-primary" : "bg-muted-foreground/30"
            )} />
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-4">
        {milestones.map((m) => (
          <div
            key={m.week}
            className={cn(
              "flex items-center gap-1.5 text-xs",
              currentWeek >= m.week ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <div className={cn(
              "w-2 h-2 rounded-full",
              currentWeek >= m.week ? "bg-primary" : "bg-muted-foreground/30"
            )} />
            <span>שבוע {m.week}: {m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
