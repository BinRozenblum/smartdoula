import {
  Home,
  Users,
  Bell,
  Settings,
  Calendar,
  CreditCard,
} from "lucide-react";
import { SidebarBase } from "../SidebarBase";

export function DoulaSidebar({
  activeItem,
  onNavigate,
  profile,
  isOpen,
  onClose,
}: any) {
  const navItems = [
    { icon: Home, label: "דאשבורד", href: "/doula" },
    { icon: Users, label: "היולדות שלי", href: "/doula/clients" },
    { icon: Calendar, label: "יומן פגישות", href: "/doula/calendar" },
    { icon: CreditCard, label: "תשלומים", href: "/doula/payments" },

    { icon: Bell, label: "התראות", href: "/doula/notifications" },
   ];

  return (
    <SidebarBase
      items={navItems}
      activeItem={activeItem}
      onNavigate={onNavigate}
      profile={profile}
      roleLabel="דולה מוסמכת"
      isOpen={isOpen}
      onClose={onClose}
    />
  );
}
