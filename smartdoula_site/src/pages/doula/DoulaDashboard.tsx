import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ClientCard } from "@/components/dashboard/ClientCard";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { AlertsWidget } from "@/components/dashboard/AlertsWidget";

import {
  Users,
  Baby,
  Calendar,
  Clock,
  Search,
  Filter,
  Loader2,
  Plus,
  Check,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate, useOutletContext } from "react-router-dom";

export function DoulaDashboard() {
  const navigate = useNavigate();
  const { profile } = useOutletContext<{ profile: any }>();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // all, active, approaching, urgent

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchClients();
    subscribeToLaborAlerts();
  }, []);

  // שליפת יולדות המקושרות לדולה הזו
  const fetchClients = async () => {
    try {
      setLoading(true);
      // שליפת הריונות שבהם ה-doula_id הוא ה-ID של המשתמש הנוכחי
      const { data, error } = await supabase
        .from("pregnancies")
        .select(
          `
          id,
          estimated_due_date,
          hospital_preference,
          profiles:mother_id (
            full_name,
            avatar_url
          )
        `,
        )
        .eq("doula_id", profile.id)
        .eq("is_active", true);

      if (error) throw error;

      // עיבוד הנתונים לפורמט שה-UI מכיר
      const formattedClients = data.map((item: any) => {
        const dueDate = new Date(item.estimated_due_date);
        const today = new Date();
        const diffWeeks = Math.floor(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 7),
        );
        const currentWeek = 40 - diffWeeks;

        return {
          id: item.id,
          name: item.profiles.full_name,
          week: currentWeek,
          dueDate: new Date(item.estimated_due_date).toLocaleDateString(
            "he-IL",
          ),
          location: item.hospital_preference || "לא נקבע",
          status: currentWeek >= 38 ? "approaching" : "active", // לוגיקה פשוטה לסטטוס
          lastUpdate: "עודכן לאחרונה היום",
        };
      });

      setClients(formattedClients);
    } catch (error: any) {
      toast.error("שגיאה בטעינת נתונים: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // האזנה לצירים בזמן אמת (Real-time)
  const subscribeToLaborAlerts = () => {
    const channel = supabase
      .channel("labor_notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contractions" },
        (payload) => {
          // חילוץ ה-ID של ההיריון מהרשומה החדשה שנוצרה בטבלה
          const pregnancyId = payload.new.pregnancy_id;

          toast("⚠️ התראה: ציר חדש דווח!", {
            description: "אחת היולדות שלך התחילה תזמון צירים כעת.",
            action: {
              label: "צפי במוניטור",
              onClick: () => navigate(`/doula/live-monitor/${pregnancyId}`),
            },
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // סינון לקוחות לפי חיפוש וטאבים
  const filteredClients = clients.filter((c) => {
    const matchesSearch = c.name.includes(searchTerm);
    if (filter === "all") return matchesSearch;
    return matchesSearch && c.status === filter;
  });

  const handleCopyInvite = () => {
    if (!profile?.id) return;
    const inviteLink = `${window.location.origin}/invite?doulaId=${profile.id}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("קישור הזמנה הועתק!", {
      description: "שלחי אותו ליולדת להרשמה מהירה תחתייך.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in">
      {/* Header עם פעולות מהירות */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            שלום, {profile.full_name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            הנה מבט על היולדות שלך והפעילויות להיום
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleCopyInvite}
            className={cn(
              "w-full gap-2 font-bold transition-all duration-300 shadow-md h-12 rounded-xl",
              copied
                ? "bg-sage text-white"
                : "gradient-warm text-white hover:opacity-90",
            )}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                הקישור הועתק
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                צירוף יולדת חדשה
              </>
            )}
          </Button>
          <span className="text-lg font-mono font-black text-primary tracking-widest">
            {profile?.doula_link_code || "---"}
          </span>
        </div>
      </header>

      {/* Stats Row - נתונים מסוכמים */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="יולדות פעילות"
          value={clients.length}
          subtitle={`${
            clients.filter((c) => c.status === "approaching").length
          } מתקרבות ללידה`}
          icon={Users}
          variant="warm"
        />
        <StatsCard
          title="לידות החודש"
          value="4"
          subtitle="2 מעל הממוצע שלך"
          icon={Baby}
          variant="sage"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="פגישות השבוע"
          value="6"
          subtitle="3 פגישות הכנה היום"
          icon={Calendar}
          variant="default"
        />
        <StatsCard
          title="במעקב צירים"
          value={clients.filter((c) => c.status === "urgent").length}
          subtitle="דורשות תשומת לב מיידית"
          icon={Clock}
          variant="accent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* עמודה מרכזית: ניהול יולדות */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש לפי שם יולדת..."
                className="pr-10 border-none bg-transparent focus-visible:ring-0 text-right"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-1 bg-muted p-1 rounded-xl">
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                  filter === "all"
                    ? "bg-white shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                הכל
              </button>
              <button
                onClick={() => setFilter("approaching")}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                  filter === "approaching"
                    ? "bg-white shadow-sm text-terracotta"
                    : "text-muted-foreground",
                )}
              >
                קרוב ללידה
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
              <p>טוען נתוני יולדות...</p>
            </div>
          ) : filteredClients.length > 0 ? (
            <div className="grid gap-4">
              {filteredClients.map((client) => (
                <ClientCard
                  key={client.id}
                  {...client}
                  onClick={() => navigate(`/doula/client/${client.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-muted/30 border-2 border-dashed rounded-3xl p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold">לא נמצאו יולדות</h3>
              <p className="text-muted-foreground mt-1">
                שלחי קישור הצטרפות ליולדת כדי שתופיע כאן.
              </p>
            </div>
          )}
        </div>

        {/* עמודה צידית: התראות ולוח זמנים */}
        <div className="space-y-8">
          <AlertsWidget />
          <UpcomingEvents />
        </div>
      </div>
    </div>
  );
}

// פונקציית עזר לעיצוב מותנה
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
