import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClientCard } from "@/components/dashboard/ClientCard";
import { Input } from "@/components/ui/input";
import { Search, Plus, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function ClientsList() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("pregnancies")
        .select(
          `
          id, estimated_due_date, is_active, tags,
          profiles:mother_id (id, full_name, avatar_url, phone)
        `
        )
        .eq("doula_id", user.id);

      if (data) setClients(data);
      setLoading(false);
    };
    fetchClients();
  }, []);

  // תיקון הקריסה: בדיקה האם profiles קיים לפני שניגשים לשם
  const filteredClients = clients.filter((c) => {
    const fullName = c.profiles?.full_name || ""; // שימוש בערך ריק כברירת מחדל
    return fullName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // פונקציית עזר לחישוב שבוע
  const calculateWeek = (dueDate: string) => {
    if (!dueDate) return 0;
    const diff = new Date(dueDate).getTime() - new Date().getTime();
    const weeksLeft = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
    return Math.max(0, 40 - weeksLeft);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">היולדות שלי</h1>
        <Button className="gradient-warm gap-2">
          <UserPlus className="w-4 h-4" /> יולדת חדשה
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          className="pr-10"
          placeholder="חיפוש לפי שם..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <ClientCard
            key={client.id}
            // הגנה מפני נתונים חסרים
            name={client.profiles?.full_name || "לקוחה ללא שם"}
            week={calculateWeek(client.estimated_due_date)}
            dueDate={
              client.estimated_due_date
                ? new Date(client.estimated_due_date).toLocaleDateString(
                    "he-IL"
                  )
                : "-"
            }
            location="ביה''ח המתוכנן"
            status={client.is_active ? "active" : "approaching"}
            onClick={() => navigate(`/doula/client/${client.id}`)}
          />
        ))}
        {filteredClients.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-10">
            לא נמצאו יולדות
          </p>
        )}
      </div>
    </div>
  );
}
