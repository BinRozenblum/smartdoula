import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Phone,
  MapPin,
  ArrowRight,
  Activity,
  Loader2,
  Save,
  X,
  User,
  HeartPulse,
  Briefcase,
  FolderOpen,
  FileText,
} from "lucide-react";

import { WeeklyProgress } from "@/components/dashboard/WeeklyProgress";
import { BirthPlanViewer } from "@/components/clients/tabs/BirthPlanViewer";
import { DocumentsManager } from "@/components/clients/tabs/DocumentsManager";

// יבוא הטאבים החדשים
import { PersonalTab } from "@/components/clients/tabs/PersonalTab";
import { MedicalTab } from "@/components/clients/tabs/MedicalTab";
import { AdminTab } from "@/components/clients/tabs/AdminTab";

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- States ---
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // זהו ה-State הראשי של הטופס שמועבר לכל הבנים
  const [formData, setFormData] = useState<any>({});

  // --- Fetch ---
  useEffect(() => {
    fetchClientData();
  }, [id]);

  async function fetchClientData() {
    if (!id) return;
    try {
      setLoading(true);
      const { data: preg, error } = await supabase
        .from("pregnancies")
        .select(`*, profiles:mother_id (*)`)
        .eq("id", id)
        .single();

      if (error) throw error;

      setData(preg);

      // אתחול טופס שטוח
      setFormData({
        ...preg, // כל השדות מטבלת הריונות
        // שדות מטבלת פרופילים
        full_name: preg.profiles?.full_name || "",
        phone: preg.profiles?.phone || "",
        phone_secondary: preg.profiles?.phone_secondary || "",
        email: preg.profiles?.email || "",
        address: preg.profiles?.address || "",
        occupation: preg.profiles?.occupation || "",
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error("שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  }

  // --- Save Logic ---
  const handleSave = async () => {
    setSaving(true);
    console.log("Starting save process...");
    console.log("Current Form Data:", formData);

    try {
      // 1. עדכון טבלת profiles (פרטים אישיים)
      console.log("Updating Profile table...");
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          phone_secondary: formData.phone_secondary,
          address: formData.address,
          occupation: formData.occupation,
        })
        .eq("id", data.mother_id);

      if (profileErr) {
        console.error("Profile Update Error:", profileErr);
        throw profileErr;
      }
      console.log("Profile updated successfully.");

      // 2. עדכון טבלת pregnancies (כל השאר - כולל בן זוג ומלווים)
      console.log("Updating Pregnancies table...");

      const pregnancyPayload = {
        client_status: formData.client_status,
        agreed_price: formData.agreed_price || null, // חשוב: להמיר מחרוזת ריקה ל-null במספרים
        is_shomeret_shabbat: formData.is_shomeret_shabbat,
        is_home_birth: formData.is_home_birth,
        general_notes: formData.general_notes,

        // שדות בן זוג ומלווים
        partner_name: formData.partner_name,
        partner_phone: formData.partner_phone,
        partner_occupation: formData.partner_occupation,
        companion_name: formData.companion_name,
        companion_phone: formData.companion_phone,
        companion_relation: formData.companion_relation,

        // שדות רפואיים
        blood_type: formData.blood_type,
        allergies: formData.allergies,
        background_diseases: formData.background_diseases,
        obstetric_history: formData.obstetric_history,
        hospital_primary: formData.hospital_primary,
        hospital_secondary: formData.hospital_secondary,

        last_period_date: formData.last_period_date || null,
        estimated_due_date: formData.estimated_due_date,
        number_of_fetuses: formData.number_of_fetuses,
        g_p_summary: formData.g_p_summary,
        birth_plan_notes: formData.birth_plan_notes,

        // גיבוי ותגיות
        backup_doula_name: formData.backup_doula_name,
        backup_doula_phone: formData.backup_doula_phone,
        backup_doula_notes: formData.backup_doula_notes,
        tags: formData.tags,
      };

      console.log("Sending payload to pregnancies:", pregnancyPayload);

      const { error: pregErr } = await supabase
        .from("pregnancies")
        .update(pregnancyPayload)
        .eq("id", id);

      if (pregErr) {
        console.error("Pregnancy Update Error:", pregErr);
        throw pregErr;
      }
      console.log("Pregnancy updated successfully.");

      toast.success("השינויים נשמרו בהצלחה!");
      setIsEditing(false);

      // עדכון הנתונים המוצגים (רענון State מקומי)
      setData({
        ...data,
        ...formData,
        profiles: { ...data.profiles, ...formData },
      });
    } catch (error: any) {
      console.error("FINAL SAVE ERROR:", error);
      toast.error("שגיאה בשמירה: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const calculateWeek = () => {
    if (!formData.estimated_due_date) return 0;
    const due = new Date(formData.estimated_due_date).getTime();
    const now = new Date().getTime();
    const diffWeeks = Math.floor((due - now) / (1000 * 60 * 60 * 24 * 7));
    return Math.max(0, 40 - diffWeeks);
  };

  if (loading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!data) return <div>לא נמצאו נתונים</div>;

  return (
    <div
      className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto animate-fade-in"
      dir="rtl"
    >
      {/* Header Actions */}
      <div className="flex justify-between items-center sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/doula/clients")}
            size="sm"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">{formData.full_name}</h1>
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4 ml-2" /> ביטול
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gradient-warm shadow-md"
              >
                {saving ? (
                  <Loader2 className="animate-spin w-4 h-4 ml-2" />
                ) : (
                  <Save className="w-4 h-4 ml-2" />
                )}
                שמירת שינויים
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="shadow-sm"
            >
              עריכת תיק יולדת
            </Button>
          )}
        </div>
      </div>

      {/* Overview Banner */}
      <div className="bg-card p-6 rounded-2xl shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full gradient-warm flex items-center justify-center text-2xl font-bold text-white shadow-md">
            {formData.full_name?.[0]}
          </div>
          <div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MapPin className="w-3 h-3" /> {formData.address || "ללא כתובת"}
            </div>
            <div className="flex gap-2 mt-2">
              <Badge
                className={
                  formData.client_status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100"
                }
              >
                {formData.client_status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <Button
            onClick={() => navigate(`/doula/live-monitor/${id}`)}
            className="bg-red-500 hover:bg-red-600 text-white gap-2 shadow-lg animate-pulse"
          >
            <Activity className="w-4 h-4" /> מוניטור
          </Button>
          <a href={`tel:${formData.phone}`}>
            <Button variant="outline">
              <Phone className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>

      <WeeklyProgress currentWeek={calculateWeek()} />

      {/* Tabs */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList
          className="w-full h-auto p-1 bg-muted/50 rounded-xl mb-6 flex-wrap justify-start"
          dir="rtl"
        >
          <TabsTrigger value="personal" className="flex-1 gap-2">
            <User className="w-4 h-4" /> פרטים אישיים
          </TabsTrigger>
          <TabsTrigger value="medical" className="flex-1 gap-2">
            <HeartPulse className="w-4 h-4" /> רפואי
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex-1 gap-2">
            <Briefcase className="w-4 h-4" /> מנהלה
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex-1 gap-2">
            <FolderOpen className="w-4 h-4" /> מסמכים
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex-1 gap-2">
            <FileText className="w-4 h-4" /> תוכנית לידה
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" dir="rtl">
          <PersonalTab
            formData={formData}
            setFormData={setFormData}
            isEditing={isEditing}
          />
        </TabsContent>
        <TabsContent value="medical" dir="rtl">
          <MedicalTab
            formData={formData}
            setFormData={setFormData}
            isEditing={isEditing}
          />
        </TabsContent>
        <TabsContent value="admin" dir="rtl">
          <AdminTab
            formData={formData}
            setFormData={setFormData}
            isEditing={isEditing}
          />
        </TabsContent>

        <TabsContent value="docs" dir="rtl">
          <DocumentsManager motherId={data.profiles.id} />
        </TabsContent>

        <TabsContent value="plan" dir="rtl">
          <BirthPlanViewer
            // מעבירים את המידע מתוך ה-formData הכללי
            plan={formData.birth_plan_notes}
            // פונקציה שמעדכנת את ה-formData הראשי
            onChange={(newPlan) =>
              setFormData({ ...formData, birth_plan_notes: newPlan })
            }
            isEditable={isEditing}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
