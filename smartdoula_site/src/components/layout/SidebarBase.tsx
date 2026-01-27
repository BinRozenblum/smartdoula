import { useState } from "react";
import {
  Settings,
  LogOut,
  ChevronLeft,
  Baby,
  UserPlus,
  Check,
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const isApp = window.navigator.userAgent.includes("SmartDoulaApp");

      if (isApp) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("profiles")
            .update({ expo_push_token: null })
            .eq("id", user.id);
        }
        window.localStorage.removeItem("expo_push_token_buffer");
      }
    } catch (error) {
      console.error("Error during logout cleanup:", error);
    } finally {
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
    toast.success("קישור הועתק!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getInitials = (name: string) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2) || "ME";

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
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* 1. Logo & Header */}
        <div className="p-6 border-b border-sidebar-border shrink-0">
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

        {/* 2. Main Navigation (Scrollable) */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {items.map((item) => {
            const isActive = activeItem === item.href;
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
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    isActive
                      ? "text-white"
                      : "text-muted-foreground group-hover:text-primary",
                  )}
                />
                <span className="flex-1 text-right">{item.label}</span>
              </button>
            );
          })}

          {/* אזור הזמנה (רק לדולה) - בתוך הגלילה כדי לא לתפוס מקום קבוע */}
          {profile?.role === "doula" && (
            <div className="pt-6 px-1">
              <Button
                onClick={handleCopyInvite}
                variant="outline"
                className={cn(
                  "w-full gap-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 h-10 text-xs",
                  copied && "border-solid border-green-500 text-green-600",
                )}
              >
                {copied ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <UserPlus className="w-3 h-3" />
                )}
                {copied ? "הועתק" : "הזמנת יולדת"}
              </Button>
            </div>
          )}
        </nav>

        {/* 3. Bottom Actions (Fixed at bottom) */}
        <div className="p-4 space-y-2 border-t border-sidebar-border bg-sidebar shrink-0">
          {/* כפתור הגדרות ואזור אישי - מודגש ונפרד */}
          <button
            onClick={() => {
              const settingsPath =
                profile?.role === "doula"
                  ? "/doula/settings"
                  : "/mother/settings";
              onNavigate(settingsPath);
              onClose();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
              activeItem.includes("settings")
                ? "bg-sidebar-accent text-primary ring-1 ring-primary/20"
                : "bg-white/50 text-sidebar-foreground hover:bg-white hover:shadow-sm",
            )}
          >
            <div className="p-1.5 bg-muted rounded-lg group-hover:bg-white transition-colors">
              <Settings className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="flex-1 text-right">הגדרות ואזור אישי</span>
            <ChevronLeft className="w-4 h-4 text-muted-foreground/40" />
          </button>

          {/* כפתור התנתקות קטן יותר */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-destructive/70 hover:text-destructive transition-all"
          >
            <LogOut className="w-3 h-3" />
            <span>{isLoggingOut ? "מתנתק..." : "יציאה מהמערכת"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
