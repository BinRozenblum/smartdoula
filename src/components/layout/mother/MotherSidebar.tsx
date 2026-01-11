import { Home, Timer, FileText, Settings, Bell } from "lucide-react";
import { SidebarBase } from "../SidebarBase"; // ודא שהקובץ קיים בנתיב זה

export function MotherSidebar({ activeItem, onNavigate, profile, isOpen, onClose }: any) {
  const navItems = [
    { icon: Home, label: "ההריון שלי", href: "/mother" },
    { icon: Timer, label: "תזמון צירים", href: "/mother/contractions" },
    // { icon: FileText, label: "תוכנית לידה", href: "/mother/birth-plan" },
    { icon: Settings, label: "הגדרות ורפואי", href: "/mother/settings" },
  ];

  return (
    <SidebarBase 
      items={navItems}
      activeItem={activeItem}
      onNavigate={onNavigate}
      profile={profile}
      roleLabel="אמא בהיריון"
      isOpen={isOpen}
      onClose={onClose}
    />
  );
}