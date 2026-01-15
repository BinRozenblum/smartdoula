import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  User,
  Baby,
  HeartPulse,
  MapPin,
  ClipboardList,
} from "lucide-react";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<"mother" | "doula">("mother");

  const [formData, setFormData] = useState({
    // פרופיל
    full_name: "",
    phone: "",
    address: "",
    date_of_birth: "",
    personal_notes: "",

    // הריון (רק לאמא)
    pregnancy_id: null,
    last_period_date: "",
    estimated_due_date: "",
    blood_type: "",
    allergies: "",
    background_diseases: "",
    hospital_primary: "",
    number_of_fetuses: "1",
    number_of_previous_births: "0",
    g_p_summary: "",
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (!profile) return;

      setRole(profile.role);

      let pregnancyData = {};
      if (profile.role === "mother") {
        const { data: preg } = await supabase
          .from("pregnancies")
          .select("*")
          .eq("mother_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        if (preg) {
          pregnancyData = {
            pregnancy_id: preg.id,
            last_period_date: preg.last_period_date || "",
            estimated_due_date: preg.estimated_due_date || "",
            blood_type: preg.blood_type || "",
            allergies: preg.allergies || "",
            background_diseases: preg.background_diseases || "",
            hospital_primary: preg.hospital_primary || "",
            number_of_fetuses: preg.number_of_fetuses?.toString() || "1",
            number_of_previous_births:
              preg.number_of_previous_births?.toString() || "0",
            g_p_summary: preg.g_p_summary || "",
          };
        }
      }

      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        date_of_birth: profile.date_of_birth || "",
        personal_notes: profile.personal_notes || "",
        ...pregnancyData,
      } as any);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("שגיאה בטעינת נתונים");
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

      // 1. עדכון פרופיל
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          date_of_birth: formData.date_of_birth || null,
          personal_notes: formData.personal_notes,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // 2. עדכון הריון
      if (role === "mother" && formData.pregnancy_id) {
        const { error: pregError } = await supabase
          .from("pregnancies")
          .update({
            last_period_date: formData.last_period_date || null,
            estimated_due_date: formData.estimated_due_date || null,
            blood_type: formData.blood_type,
            allergies: formData.allergies,
            background_diseases: formData.background_diseases,
            hospital_primary: formData.hospital_primary,
            number_of_fetuses: parseInt(formData.number_of_fetuses) || 1,
            number_of_previous_births:
              parseInt(formData.number_of_previous_births) || 0,
            g_p_summary: formData.g_p_summary,
          })
          .eq("id", formData.pregnancy_id);

        if (pregError) throw pregError;
      }

      toast.success("כל השינויים נשמרו בהצלחה!");
      fetchUserData(); // רענון נתונים מהשרת
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

  if (loading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div
      className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in"
      dir="rtl"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">הגדרות חשבון</h1>
          <p className="text-muted-foreground">ניהול המידע האישי והרפואי שלך</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gradient-warm gap-2 shadow-md"
        >
          {saving ? (
            <Loader2 className="animate-spin w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          שמירת שינויים
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]" dir="rtl">
          <TabsTrigger value="profile">פרטים אישיים</TabsTrigger>
          {role === "mother" && (
            <TabsTrigger value="pregnancy">מעקב הריון ורפואי</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6" dir="rtl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> מידע כללי
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
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
                <Label>תאריך לידה</Label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) =>
                    handleChange("date_of_birth", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>כתובת</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </div>
              <div className="col-span-full space-y-2">
                <Label>הערות אישיות (מה חשוב שהדולה תדע?)</Label>
                <Textarea
                  value={formData.personal_notes}
                  onChange={(e) =>
                    handleChange("personal_notes", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pregnancy" className="space-y-6" dir="rtl">
          {/* פרטי ההריון */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Baby className="w-5 h-5 text-primary" /> פרטי ההיריון
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>תאריך וסת אחרון (LMP)</Label>
                <Input
                  type="date"
                  value={formData.last_period_date}
                  onChange={(e) =>
                    handleChange("last_period_date", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>תאריך לידה משוער (תל"מ)</Label>
                <Input
                  type="date"
                  value={formData.estimated_due_date}
                  onChange={(e) =>
                    handleChange("estimated_due_date", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>מספר לידות קודמות</Label>
                <Input
                  type="number"
                  value={formData.number_of_previous_births}
                  onChange={(e) =>
                    handleChange("number_of_previous_births", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>מספר עוברים</Label>
                <Select
                  value={formData.number_of_fetuses}
                  onValueChange={(v) => handleChange("number_of_fetuses", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">עובר יחיד</SelectItem>
                    <SelectItem value="2">תאומים</SelectItem>
                    <SelectItem value="3">שלישייה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>היסטוריית לידות (G/P)</Label>
                <Input
                  placeholder="לדוגמה: G2 P1"
                  value={formData.g_p_summary}
                  onChange={(e) => handleChange("g_p_summary", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* מידע רפואי */}
          <Card className="border-red-100 bg-red-50/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <HeartPulse className="w-5 h-5 text-red-500" /> מידע רפואי חשוב
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>סוג דם</Label>
                <Select
                  value={formData.blood_type}
                  onValueChange={(v) => handleChange("blood_type", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(
                      (t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>בית חולים מועדף</Label>
                <Input
                  value={formData.hospital_primary}
                  onChange={(e) =>
                    handleChange("hospital_primary", e.target.value)
                  }
                />
              </div>
              <div className="col-span-full space-y-2">
                <Label>רגישויות ואלרגיות</Label>
                <Input
                  placeholder="תרופות, מזון..."
                  value={formData.allergies}
                  onChange={(e) => handleChange("allergies", e.target.value)}
                />
              </div>
              <div className="col-span-full space-y-2">
                <Label>מחלות רקע / מצב רפואי מיוחד</Label>
                <Textarea
                  placeholder="סוכרת הריון, לחץ דם..."
                  value={formData.background_diseases}
                  onChange={(e) =>
                    handleChange("background_diseases", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
