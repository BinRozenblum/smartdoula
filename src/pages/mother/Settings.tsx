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
import { Loader2, Save, User, Baby, HeartPulse, MapPin } from "lucide-react";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<"mother" | "doula">("mother");

  // State לכל הנתונים בטופס
  const [formData, setFormData] = useState({
    // נתוני פרופיל (משותף לכולם)
    full_name: "",
    phone: "",
    address: "",
    date_of_birth: "",
    avatar_url: "",
    personal_notes: "", // פרטים אישיים/אודות

    // נתוני הריון (רק לאמא)
    pregnancy_id: null, // לשמירה
    last_period_date: "",
    estimated_due_date: "",
    blood_type: "",
    allergies: "",
    background_diseases: "",
    hospital_preference: "",
    number_of_fetuses: "1",
    g_p_summary: "", // היסטוריית לידות
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  // חישוב אוטומטי של תל"מ לפי וסת אחרון
  useEffect(() => {
    if (formData.last_period_date && !formData.estimated_due_date) {
      const lmp = new Date(formData.last_period_date);
      const dueDate = new Date(lmp.setDate(lmp.getDate() + 280)); // +40 שבועות
      setFormData((prev) => ({
        ...prev,
        estimated_due_date: dueDate.toISOString().split("T")[0],
      }));
    }
  }, [formData.last_period_date]);

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. שליפת פרופיל
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setRole(profile.role);

      let pregnancyData = {};

      // 2. אם זו אמא - שליפת הריון פעיל
      if (profile.role === "mother") {
        const { data: preg } = await supabase
          .from("pregnancies")
          .select("*")
          .eq("mother_id", user.id)
          .eq("is_active", true)
          .single();

        if (preg) {
          pregnancyData = {
            pregnancy_id: preg.id,
            last_period_date: preg.last_period_date || "",
            estimated_due_date: preg.estimated_due_date || "",
            blood_type: preg.blood_type || "",
            allergies: preg.allergies || "",
            background_diseases: preg.background_diseases || "",
            hospital_preference: preg.hospital_preference || "",
            number_of_fetuses: preg.number_of_fetuses?.toString() || "1",
            g_p_summary: preg.g_p_summary || "",
          };
        }
      }

      // מיזוג הנתונים לסטייט
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        date_of_birth: profile.date_of_birth || "",
        avatar_url: profile.avatar_url || "",
        personal_notes: profile.personal_notes || "",
        ...pregnancyData,
      } as any);
    } catch (error) {
      console.error("Error fetching data:", error);
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

      // 1. שמירת פרופיל
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

      // 2. שמירת הריון (אם זו אמא)
      if (role === "mother" && formData.pregnancy_id) {
        const { error: pregError } = await supabase
          .from("pregnancies")
          .update({
            last_period_date: formData.last_period_date || null,
            estimated_due_date: formData.estimated_due_date,
            blood_type: formData.blood_type,
            allergies: formData.allergies,
            background_diseases: formData.background_diseases,
            hospital_preference: formData.hospital_preference,
            number_of_fetuses: parseInt(formData.number_of_fetuses),
            g_p_summary: formData.g_p_summary,
          })
          .eq("id", formData.pregnancy_id);

        if (pregError) throw pregError;
      }

      toast.success("השינויים נשמרו בהצלחה!");
    } catch (error: any) {
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
          <h1 className="text-3xl font-bold">הגדרות פרופיל</h1>
          <p className="text-muted-foreground">
            ניהול המידע האישי {role === "mother" && "וההריוני"} שלך
          </p>
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
            <TabsTrigger value="pregnancy">מעקב הריון</TabsTrigger>
          )}
        </TabsList>

        {/* --- טאב פרטים אישיים --- */}
        <TabsContent value="profile" className="space-y-6" dir="rtl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" /> מידע כללי
              </CardTitle>
              <CardDescription>
                פרטים אלו גלויים לדולה המלווה אותך
              </CardDescription>
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
                <Label>תאריך לידה שלך</Label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) =>
                    handleChange("date_of_birth", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>כתובת מגורים</Label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pr-9"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                  />
                </div>
              </div>
              <div className="col-span-full space-y-2">
                <Label>הערות אישיות / אודות</Label>
                <Textarea
                  placeholder="כתבי כאן דברים שחשוב שהצוות ידע עלייך..."
                  value={formData.personal_notes}
                  onChange={(e) =>
                    handleChange("personal_notes", e.target.value)
                  }
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- טאב מעקב הריון (רק לאמהות) --- */}
        {role === "mother" && (
          <TabsContent value="pregnancy" className="space-y-6" dir="rtl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Baby className="w-5 h-5" /> פרטי ההיריון
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
                  <p className="text-xs text-muted-foreground">
                    מחושב אוטומטית אם הוזן וסת אחרון
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>מספר עוברים</Label>
                  <Select
                    value={formData.number_of_fetuses}
                    onValueChange={(v) => handleChange("number_of_fetuses", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר" />
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
                    placeholder="לדוגמה: G2P1"
                    value={formData.g_p_summary}
                    onChange={(e) =>
                      handleChange("g_p_summary", e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <HeartPulse className="w-5 h-5 text-red-500" /> מידע רפואי
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
                      <SelectValue placeholder="בחר סוג דם" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(
                        (type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>בית חולים מועדף</Label>
                  <Input
                    placeholder="איפה את מתכננת ללדת?"
                    value={formData.hospital_preference}
                    onChange={(e) =>
                      handleChange("hospital_preference", e.target.value)
                    }
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <Label>רגישויות ואלרגיות</Label>
                  <Input
                    placeholder="תרופות, מזון, לטקס..."
                    value={formData.allergies}
                    onChange={(e) => handleChange("allergies", e.target.value)}
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <Label>מחלות רקע / מצב רפואי מיוחד</Label>
                  <Textarea
                    placeholder="סוכרת הריון, לחץ דם, קרישיות יתר..."
                    value={formData.background_diseases}
                    onChange={(e) =>
                      handleChange("background_diseases", e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
