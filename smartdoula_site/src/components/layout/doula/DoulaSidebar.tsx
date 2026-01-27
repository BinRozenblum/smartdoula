import {
  Home,
  Users,
  Activity, // אייקון למוניטור
  Calendar,
  CreditCard, // אייקון להנהלת חשבונות
} from "lucide-react";
import { SidebarBase } from "../SidebarBase";

export function DoulaSidebar({
  activeItem,
  onNavigate,
  profile,
  isOpen,
  onClose,
}: any) {
  // סידור הפריטים בדיוק לפי האפיון
  const navItems = [
    {
      icon: Home,
      label: "דף הבית",
      href: "/doula",
    },
    {
      icon: Users,
      label: "הלקוחות שלי",
      href: "/doula/clients",
    },
    {
      icon: Activity,
      label: "מוניטור חי",
      // הערה: כרגע מפנה לדאשבורד כי המוניטור דורש ID,
      // בעתיד נבנה דף מרכז לכל המוניטורים
      href: "/doula/live-monitor/overview",
    },
    {
      icon: Calendar,
      label: "יומן",
      href: "/doula/calendar",
    },
    {
      icon: CreditCard,
      label: "הנהלת חשבונות",
      href: "/doula/payments",
    },
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
