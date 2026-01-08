import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ClientCard } from "@/components/dashboard/ClientCard";
import { ContractionTimer } from "@/components/dashboard/ContractionTimer";
import { WeeklyProgress } from "@/components/dashboard/WeeklyProgress";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { AlertsWidget } from "@/components/dashboard/AlertsWidget";
import { Users, Baby, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockClients = [
  {
    name: "שירה לוי",
    week: 38,
    dueDate: "15.01.2026",
    location: "תל אביב - איכילוב",
    status: "urgent" as const,
    lastUpdate: "לפני 10 דקות",
  },
  {
    name: "נועה כהן",
    week: 32,
    dueDate: "01.03.2026",
    location: "ירושלים - הדסה",
    status: "active" as const,
    lastUpdate: "היום, 09:30",
  },
  {
    name: "מיכל ברק",
    week: 36,
    dueDate: "25.01.2026",
    location: "רמת גן - שיבא",
    status: "approaching" as const,
    lastUpdate: "אתמול",
  },
  {
    name: "דנה אברהם",
    week: 28,
    dueDate: "15.03.2026",
    location: "חיפה - רמב״ם",
    status: "active" as const,
    lastUpdate: "לפני 3 ימים",
  },
];

const Index = () => {
  const [activeNav, setActiveNav] = useState("/");

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem={activeNav} onNavigate={setActiveNav} />

      {/* Main Content */}
      <main className="mr-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 glass border-b border-border/50 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                שלום, מירב 👋
              </h1>
              <p className="text-muted-foreground">הנה הסקירה היומית שלך</p>
            </div>
            <Button variant="warm" size="lg">
              + יולדת חדשה
            </Button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 space-y-8">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="יולדות פעילות"
              value={12}
              subtitle="2 מתקרבות ללידה"
              icon={Users}
              variant="warm"
            />
            <StatsCard
              title="לידות החודש"
              value={3}
              subtitle="2 הצלחות, 1 בתהליך"
              icon={Baby}
              variant="sage"
              trend={{ value: 15, isPositive: true }}
            />
            <StatsCard
              title="פגישות השבוע"
              value={8}
              subtitle="3 היום"
              icon={Calendar}
              variant="default"
            />
            <StatsCard
              title="ממתינות לתשומת לב"
              value={2}
              subtitle="דורשות מעקב"
              icon={Clock}
              variant="accent"
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Clients List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">
                  היולדות שלי
                </h2>
                <Button variant="ghost">הצג הכל</Button>
              </div>
              <div className="grid gap-4">
                {mockClients.map((client) => (
                  <ClientCard key={client.name} {...client} />
                ))}
              </div>
            </div>

            {/* Sidebar Widgets */}
            <div className="space-y-6">
              <AlertsWidget />
              <ContractionTimer />
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <WeeklyProgress currentWeek={38} />
            <UpcomingEvents />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
