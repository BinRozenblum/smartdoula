import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  User,
  MapPin,
  Phone,
  Mail,
  Briefcase,
} from "lucide-react";

export default function DoulaSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
    personal_notes: "",
    avatar_url: "",
    email: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle(); // שימוש ב-maybeSingle מונע שגיאה אם אין שורה

      if (error) throw error;
      if (!profile) return;

      // המרה למחרוזות ריקות כדי למנוע בעיות ב-Input
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        personal_notes: profile.personal_notes || "",
        avatar_url: profile.avatar_url || "",
        email: user.email || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("שגיאה בטעינת פרופיל");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          personal_notes: formData.personal_notes,
        })
        .eq("id", user.id)
        .select() // מחזיר מערך
        .maybeSingle(); // מחזיר null במקום לזרוק שגיאה אם המערך ריק

      if (error) throw error;

      // אם data הוא null, סימן שהעדכון לא תפס (בגלל RLS או ID שגוי)
      if (!data) {
        throw new Error(
          "לא ניתן היה לשמור את השינויים. אנא בדוק הרשאות או נסה שוב."
        );
      }

      // עדכון ה-State המקומי עם מה שחזר מהשרת
      setFormData((prev) => ({
        ...prev,
        full_name: data.full_name || "",
        phone: data.phone || "",
        address: data.address || "",
        personal_notes: data.personal_notes || "",
      }));

      toast.success("הפרופיל עודכן בהצלחה!");

      // רענון כדי לעדכן את הסרגל צד
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error("שגיאה בשמירה: " + error.message);
    } finally {
      setSaving(false);
    }
  };
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getInitials = (name: string) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase()
      : "ME";

  if (loading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );

  return (
    <div
      className="max-w-3xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in"
      dir="rtl"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">הגדרות פרופיל</h1>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gradient-warm gap-2"
        >
          {saving ? (
            <Loader2 className="animate-spin w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          שמירת שינויים
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* כרטיס פרופיל */}
        <div className="md:col-span-1 space-y-6">
          <Card className="text-center overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-peach-light to-sage-light"></div>
            <div className="relative -mt-12 flex justify-center">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarImage src={formData.avatar_url} />
                <AvatarFallback className="text-2xl font-bold bg-muted">
                  {getInitials(formData.full_name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardContent className="pt-4">
              <h3 className="font-bold text-xl">{formData.full_name}</h3>
              <p className="text-sm text-muted-foreground">דולה מוסמכת</p>
            </CardContent>
          </Card>
        </div>

        {/* טופס עריכה */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>פרטים אישיים</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>שם מלא</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>טלפון</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  dir="ltr"
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label>אזור שירות / כתובת</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>אודות</Label>
                <Textarea
                  value={formData.personal_notes}
                  onChange={(e) =>
                    handleChange("personal_notes", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
