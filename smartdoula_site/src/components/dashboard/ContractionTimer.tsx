import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Contraction {
  id: number;
  duration: number;
  interval: number;
  timestamp: Date;
}

export function ContractionTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [contractions, setContractions] = useState<Contraction[]>([]);
  const lastContraction = useRef<Date | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleToggle = () => {
    if (isRunning) {
      // Stopping - record the contraction
      const now = new Date();
      const interval = lastContraction.current
        ? Math.floor((now.getTime() - lastContraction.current.getTime()) / 1000)
        : 0;

      setContractions((prev) => [
        {
          id: Date.now(),
          duration: seconds,
          interval,
          timestamp: now,
        },
        ...prev.slice(0, 9), // Keep last 10
      ]);

      lastContraction.current = now;
      setSeconds(0);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
    setContractions([]);
    lastContraction.current = null;
  };

  const avgDuration = contractions.length
    ? Math.round(
        contractions.reduce((a, c) => a + c.duration, 0) / contractions.length
      )
    : 0;

  const avgInterval = contractions.filter((c) => c.interval > 0).length
    ? Math.round(
        contractions
          .filter((c) => c.interval > 0)
          .reduce((a, c) => a + c.interval, 0) /
          contractions.filter((c) => c.interval > 0).length
      )
    : 0;

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">תזמון צירים</h2>
        <Button variant="ghost" size="icon" onClick={handleReset}>
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-6">
        <div
          className={cn(
            "w-40 h-40 mx-auto rounded-full flex items-center justify-center mb-4 transition-all duration-300",
            isRunning
              ? "gradient-warm animate-pulse-soft shadow-hover"
              : "bg-muted"
          )}
        >
          <span
            className={cn(
              "text-4xl font-bold font-mono",
              isRunning ? "text-primary-foreground" : "text-foreground"
            )}
          >
            {formatTime(seconds)}
          </span>
        </div>

        <Button
          variant={isRunning ? "destructive" : "default"}
          size="lg"
          className={cn(
            "w-40",
            !isRunning && "gradient-warm border-none shadow-soft"
          )}
          onClick={handleToggle}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5" />
              עצירה
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              התחלה
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      {contractions.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-sage-light rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">משך ממוצע</p>
            <p className="text-2xl font-bold text-secondary-foreground">
              {formatTime(avgDuration)}
            </p>
          </div>
          <div className="bg-peach-light rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">מרווח ממוצע</p>
            <p className="text-2xl font-bold text-terracotta">
              {formatTime(avgInterval)}
            </p>
          </div>
        </div>
      )}

      {/* History */}
      {contractions.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            היסטוריה
          </p>
          {contractions.map((c, i) => (
            <div
              key={c.id}
              className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground">
                צייר #{contractions.length - i}
              </span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-foreground">
                  <Clock className="w-3 h-3" />
                  {formatTime(c.duration)}
                </span>
                {c.interval > 0 && (
                  <span className="text-muted-foreground text-xs">
                    מרווח: {formatTime(c.interval)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
