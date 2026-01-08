import { useState, useEffect } from "react";
import {
  Home,
  Users,
  Calendar,
  Timer,
  FileText,
  Bell,
  Settings,
  Baby,
  UserPlus,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: Home, label: "דאשבורד", href: "/" },
  { icon: Users, label: "יולדות", href: "/clients", badge: 12 },
  { icon: Calendar, label: "יומן", href: "/calendar" },
  { icon: Timer, label: "תזמון צירים", href: "/contractions" },
  { icon: FileText, label: "סיכומים", href: "/summaries" },
  { icon: Bell, label: "התראות", href: "/notifications", badge: 3 },
];

interface SidebarProps {
  activeItem?: string;
  onNavigate?: (href: string) => void;
}

export function Sidebar({ activeItem = "/", onNavigate }: SidebarProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // שליפת ה-ID של המשתמש המחובר
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const handleCopyInvite = () => {
    if (!userId) {
      toast.error("לא נמצא מזהה משתמש");
      return;
    }

    const inviteLink = `${window.location.origin}/invite?doulaId=${userId}`;
    navigator.clipboard.writeText(inviteLink);

    setCopied(true);
    toast.success("קישור ההזמנה הועתק!", {
      description: "שלחי אותו ליולדת כדי שתירשם תחתיך",
    });

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="fixed right-0 top-0 h-screen w-64 bg-sidebar border-l border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center shadow-soft">
            <Baby className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">SmartDoula</h1>
            <p className="text-xs text-muted-foreground">ניהול לידה חכם</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeItem === item.href;
          return (
            <button
              key={item.href}
              onClick={() => onNavigate?.(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span className="flex-1 text-right">{item.label}</span>
              {item.badge && (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* --- כפתור הזמנה חדש --- */}
        <div className="mt-6 px-2">
          <Button
            onClick={handleCopyInvite}
            className={cn(
              "w-full gap-2 font-bold transition-all duration-300 shadow-soft h-11",
              copied
                ? "bg-sage text-white"
                : "gradient-warm text-white hover:opacity-90"
            )}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                הועתק!
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                הזמנת יולדת חדשה
              </>
            )}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center mt-2 px-2">
            העתיקי את הקישור ושלחי ליולדת להרשמה מהירה
          </p>
        </div>
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={() => onNavigate?.("/settings")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
          <span className="flex-1 text-right">הגדרות</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/20">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-sage-light flex items-center justify-center border-2 border-white shadow-sm">
            <span className="text-sm font-semibold text-secondary-foreground">
              מר
            </span>
          </div>
          <div className="flex-1 text-right">
            <p className="text-sm font-medium text-foreground truncate">
              מירב רוזנברג
            </p>
            <p className="text-[10px] text-muted-foreground">דולה מוסמכת</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
