import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExplorerFilters } from "@/components/explorer/ExplorerFilters";
import { DoulaCard } from "@/components/explorer/DoulaCard";
import { Loader2, Baby, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function DoulaExplorerPage() {
  const [doulas, setDoulas] = useState<any[]>([]);
  const [filteredDoulas, setFilteredDoulas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // State לסינונים
  const [searchTerm, setSearchTerm] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [sortBy, setSortBy] = useState("random");

  useEffect(() => {
    fetchDoulas();
  }, []);

  // סינון מקומי בכל שינוי
  useEffect(() => {
    let result = [...doulas];

    // 1. חיפוש טקסט
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (d) =>
          d.full_name.toLowerCase().includes(lower) ||
          d.bio?.toLowerCase().includes(lower) ||
          d.specialties?.some((s: string) => s.toLowerCase().includes(lower)),
      );
    }

    // 2. סינון אזור (מבוסס על מערך ב-DB, כאן הדגמה פשוטה על מחרוזת)
    if (areaFilter !== "all") {
      result = result.filter((d) => d.service_areas?.includes(areaFilter));
    }

    // 3. מיון
    if (sortBy === "experience") {
      result.sort(
        (a, b) => (b.years_experience || 0) - (a.years_experience || 0),
      );
    } else if (sortBy === "name") {
      result.sort((a, b) => a.full_name.localeCompare(b.full_name));
    } else {
      // Random Shuffle (פשוט)
      result.sort(() => Math.random() - 0.5);
    }

    setFilteredDoulas(result);
  }, [searchTerm, areaFilter, sortBy, doulas]);

  const fetchDoulas = async () => {
    setLoading(true);
    try {
      // שליפת דולות עם פרופיל ציבורי
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "doula")
        .eq("is_public_profile", true); // להקפיד להוסיף את העמודה הזו ב-DB

      if (error) throw error;
      setDoulas(data || []);
      setFilteredDoulas(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50" dir="rtl">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-peach/20 to-transparent py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-soft mb-2">
            <Baby className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            למצוא את הדולה שלך
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            מאגר הדולות המומלצות של SmartDoula. חפשי לפי אזור, התמחות וניסיון
            ומצאי את הליווי המושלם ללידה שלך.
          </p>
          <div className="pt-4">
            <Button variant="outline" onClick={() => navigate("/auth")}>
              את דולה? הצטרפי למאגר
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-20 -mt-8 relative z-10">
        {/* פילטרים */}
        <ExplorerFilters
          onSearch={setSearchTerm}
          onAreaChange={setAreaFilter}
          onSortChange={setSortBy}
        />

        {/* תוצאות */}
        <div className="mt-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">טוען דולות מומלצות...</p>
            </div>
          ) : filteredDoulas.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed">
              <SearchX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground">
                לא נמצאו תוצאות
              </h3>
              <p className="text-muted-foreground">
                נסה לשנות את סינוני החיפוש
              </p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm("");
                  setAreaFilter("all");
                }}
              >
                ניקוי סינון
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDoulas.map((doula) => (
                <DoulaCard key={doula.id} doula={doula} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
