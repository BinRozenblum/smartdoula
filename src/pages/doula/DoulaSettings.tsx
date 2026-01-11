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
    address: "", // כתובת קליניקה/מגורים
    personal_notes: "", // "אודות" / ביוגרפיה מקצועית
    avatar_url: "",
    email: "", // לקריאה בלבד
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
        .single();

      if (error) throw error;

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

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          personal_notes: formData.personal_notes,
          // avatar_url יטופל בנפרד אם נוסיף העלאת תמונות
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("הפרופיל עודכן בהצלחה!");
    } catch (error: any) {
      toast.error("שגיאה בשמירה: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // יצירת ראשי תיבות לאווטאר
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            הגדרות פרופיל דולה
          </h1>
          <p className="text-muted-foreground">
            נהלי את המידע העסקי והאישי שיוצג ללקוחותייך
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gradient-warm gap-2 shadow-md w-full md:w-auto"
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
        {/* עמודה שמאלית - כרטיס פרופיל ויזואלי */}
        <div className="md:col-span-1 space-y-6">
          <Card className="text-center overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-peach-light to-sage-light"></div>
            <div className="relative -mt-12 flex justify-center">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarImage src={formData.avatar_url} />
                <AvatarFallback className="text-2xl font-bold bg-muted text-foreground">
                  {getInitials(formData.full_name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardContent className="pt-4 pb-6">
              <h3 className="font-bold text-xl">
                {formData.full_name || "שם הדולה"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">דולה מוסמכת</p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" className="w-full">
                  העלאת תמונה
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* כרטיס סטטוס מהיר */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                סטטוס חשבון
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="font-bold">פעיל</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                המנוי שלך בתוקף עד 01/2026
              </p>
            </CardContent>
          </Card>
        </div>

        {/* עמודה ימנית - טופס עריכה */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <User className="w-5 h-5" /> פרטים אישיים ועסקיים
              </CardTitle>
              <CardDescription>
                פרטים אלו עוזרים ליולדות ליצור איתך קשר
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>שם מלא / שם העסק</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pr-9"
                      value={formData.full_name}
                      onChange={(e) =>
                        handleChange("full_name", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>מספר טלפון</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pr-9"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      dir="ltr"
                      className="text-right"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>כתובת אימייל (להתחברות)</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pr-9 bg-muted/50"
                    value={formData.email}
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>כתובת קליניקה / אזור שירות</Label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pr-9"
                    placeholder="לדוגמה: תל אביב והמרכז"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>אודות / אני מאמין</Label>
                <div className="relative">
                  <Briefcase className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    className="min-h-[120px] pr-9"
                    placeholder="ספרי קצת על הגישה שלך, ההסמכה והניסיון..."
                    value={formData.personal_notes}
                    onChange={(e) =>
                      handleChange("personal_notes", e.target.value)
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  טקסט זה יופיע בפרופיל שלך עבור היולדות.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
