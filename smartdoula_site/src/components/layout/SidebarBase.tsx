import { useState } from "react";
import {
  Settings,
  LogOut,
  ChevronLeft,
  Baby,
  Check,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export interface NavItem {
  icon: any;
  label: string;
  href: string;
  badge?: number;
}

interface SidebarBaseProps {
  items: NavItem[];
  activeItem: string;
  onNavigate: (href: string) => void;
  profile: any;
  roleLabel: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SidebarBase({
  items,
  activeItem,
  onNavigate,
  profile,
  roleLabel,
  isOpen,
  onClose,
}: SidebarBaseProps) {
  const [copied, setCopied] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // הוספנו סטייט לטעינת יציאה
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // בדיקה האם אנחנו רצים בתוך האפליקציה (לפי ה-UserAgent שהגדרנו ב-Expo)
      const isApp = window.navigator.userAgent.includes("SmartDoulaApp");

      if (isApp) {
        console.log("📱 App logout detected - clearing push token...");
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // מחיקת הטוקן רק אם ההתנתקות בוצעה מהאפליקציה
          await supabase
            .from("profiles")
            .update({ expo_push_token: null })
            .eq("id", user.id);
        }

        // ניקוי באפר מקומי
        window.localStorage.removeItem("expo_push_token_buffer");
      } else {
        console.log("💻 Web logout detected - keeping push token active.");
      }
    } catch (error) {
      console.error("Error during logout cleanup:", error);
    } finally {
      // ביצוע הניתוק בכל מקרה (גם בוובי וגם באפליקציה)
      await supabase.auth.signOut();
      navigate("/auth");
      toast.info("התנתקת מהמערכת");
      setIsLoggingOut(false);
    }
  };

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

  const getInitials = (name: string) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2) || "??"
    );
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed right-0 top-0 h-screen w-64 bg-sidebar border-l border-sidebar-border flex flex-col z-50 transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Logo & Header */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center shadow-soft shrink-0">
              <Baby className="w-5 h-5 text-white" />
            </div>
            <div className="overflow-hidden">
              <h1 className="font-bold text-lg text-foreground leading-tight">
                SmartDoula
              </h1>
              <p className="text-[10px] text-muted-foreground truncate">
                {roleLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {items.map((item) => {
            const isActive =
              activeItem === item.href ||
              (item.href !== "/doula" &&
                item.href !== "/mother" &&
                activeItem.startsWith(item.href));

            return (
              <button
                key={item.href}
                onClick={() => {
                  onNavigate(item.href);
                  onClose();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-primary text-white shadow-soft"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    isActive
                      ? "text-white"
                      : "text-muted-foreground group-hover:text-primary"
                  )}
                />
                <span className="flex-1 text-right">{item.label}</span>
                {item.badge && !isActive && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Invite Section (Only for Doula) */}
          {profile?.role === "doula" && (
            <div className="mt-8 px-2 space-y-3">
              <div className="h-px bg-sidebar-border w-full my-4" />
              <p className="text-[11px] font-semibold text-muted-foreground px-2 uppercase tracking-wider">
                ניהול לקוחות
              </p>
              <Button
                onClick={handleCopyInvite}
                className={cn(
                  "w-full gap-2 font-bold transition-all duration-300 shadow-md h-12 rounded-xl",
                  copied
                    ? "bg-sage text-white"
                    : "gradient-warm text-white hover:opacity-90"
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
            </div>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 space-y-1 border-t border-sidebar-border">
          <button
            onClick={() => {
              const settingsPath =
                profile?.role === "doula"
                  ? "/doula/settings"
                  : "/mother/settings";
              onNavigate(settingsPath);
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-right">הגדרות חשבון</span>
          </button>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/5 transition-all disabled:opacity-50"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="flex-1 text-right">
              {isLoggingOut ? "מתנתק..." : "התנתקות"}
            </span>
          </button>
        </div>

        {/* User Profile Mini-Card */}
        <div className="p-4 bg-sidebar-accent/30 border-t border-sidebar-border">
          <div className="flex items-center gap-3 bg-white/50 p-3 rounded-2xl border border-sidebar-border">
            <div className="w-10 h-10 rounded-full gradient-sage flex items-center justify-center border-2 border-white shadow-sm shrink-0">
              <span className="text-xs font-bold text-secondary-foreground uppercase">
                {getInitials(profile?.full_name)}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-sm font-bold text-foreground truncate">
                {profile?.full_name}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium">
                {roleLabel}
              </p>
            </div>
            <ChevronLeft className="w-4 h-4 text-muted-foreground/50" />
          </div>
        </div>
      </aside>
    </>
  );
}
