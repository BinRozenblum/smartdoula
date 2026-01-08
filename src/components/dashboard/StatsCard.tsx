import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "warm" | "sage" | "accent";
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  trend,
  variant = "default" 
}: StatsCardProps) {
  const variants = {
    default: "bg-card",
    warm: "bg-peach-light",
    sage: "bg-sage-light",
    accent: "bg-accent",
  };

  const iconVariants = {
    default: "bg-muted text-muted-foreground",
    warm: "gradient-warm text-primary-foreground",
    sage: "gradient-sage text-secondary-foreground",
    accent: "bg-primary text-primary-foreground",
  };

  return (
    <div className={cn(
      "rounded-2xl p-6 shadow-card transition-all duration-300 hover:shadow-hover animate-fade-in",
      variants[variant]
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              trend.isPositive ? "bg-sage-light text-secondary-foreground" : "bg-destructive/10 text-destructive"
            )}>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          iconVariants[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
