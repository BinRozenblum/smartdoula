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
  Calendar,
  Baby,
  Tag,
} from "lucide-react";

import { WeeklyProgress } from "@/components/dashboard/WeeklyProgress";
import { BirthPlanViewer } from "@/components/clients/tabs/BirthPlanViewer";
import { DocumentsManager } from "@/components/clients/tabs/DocumentsManager";
import { TimelineWidget } from "@/components/clients/TimelineWidget";

import { PersonalTab } from "@/components/clients/tabs/PersonalTab";
import { MedicalTab } from "@/components/clients/tabs/MedicalTab";
import { AdminTab } from "@/components/clients/tabs/AdminTab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "recharts";
import { format } from "date-fns";

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

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

      // שליפת אירועים לקוביה 2
      const { data: evs } = await supabase
        .from("pregnancy_events")
        .select("*")
        .eq("pregnancy_id", id)
        .order("event_date", { ascending: false });

      setData(preg);
      setEvents(evs || []);
      setFormData({
        ...preg,
        full_name: preg.profiles?.full_name || "",
        phone: preg.profiles?.phone || "",
        phone_secondary: preg.profiles?.phone_secondary || "",
        email: preg.profiles?.email || "",
        address: preg.profiles?.address || "",
        occupation: preg.profiles?.occupation || "",
      });
    } catch (error) {
      toast.error("שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          phone_secondary: formData.phone_secondary,
          address: formData.address,
          occupation: formData.occupation,
        })
        .eq("id", data.mother_id);

      const { error: pregErr } = await supabase
        .from("pregnancies")
        .update({
          client_status: formData.client_status,
          agreed_price: formData.agreed_price || null,
          is_shomeret_shabbat: formData.is_shomeret_shabbat,
          is_home_birth: formData.is_home_birth,
          general_notes: formData.general_notes,
          partner_name: formData.partner_name,
          partner_phone: formData.partner_phone,
          partner_occupation: formData.partner_occupation,
          companion_name: formData.companion_name,
          companion_phone: formData.companion_phone,
          companion_relation: formData.companion_relation,
          blood_type: formData.blood_type,
          allergies: formData.allergies,
          background_diseases: formData.background_diseases,
          obstetric_history: formData.obstetric_history,
          hospital_primary: formData.hospital_primary,
          hospital_secondary: formData.hospital_secondary,
          last_period_date: formData.last_period_date || null,
          estimated_due_date: formData.estimated_due_date,
          number_of_fetuses: formData.number_of_fetuses,
          number_of_previous_births: formData.number_of_previous_births,
          g_p_summary: formData.g_p_summary,
          birth_plan_notes: formData.birth_plan_notes,
          backup_doula_name: formData.backup_doula_name,
          backup_doula_phone: formData.backup_doula_phone,
          backup_doula_notes: formData.backup_doula_notes,
          tags: formData.tags,
        })
        .eq("id", id);

      if (pregErr) throw pregErr;

      toast.success("השינויים נשמרו");
      setIsEditing(false);
      fetchClientData();
    } catch (error: any) {
      toast.error("שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  const calculateWeek = () => {
    if (!formData.estimated_due_date) return 0;
    const due = new Date(formData.estimated_due_date).getTime();
    const diffWeeks = Math.floor(
      (due - new Date().getTime()) / (1000 * 60 * 60 * 24 * 7)
    );
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
      className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in"
      dir="rtl"
    >
      {/* Top Header - פעולות כלליות */}
      <div className="flex justify-between items-center bg-white/50 p-2 rounded-xl border">
        <Button
          variant="ghost"
          onClick={() => navigate("/doula/clients")}
          size="sm"
        >
          <ArrowRight className="ml-2 w-4 h-4" /> חזרה לרשימה
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* עמודה מרכזית - קוביה 1 וטאבים */}
        <div className="lg:col-span-8 space-y-6">
          {/* קוביה קבועה 1: פרטי יולדת */}
          <Card className="shadow-sm border-none bg-gradient-to-br from-white to-peach-light/10 overflow-hidden">
            <CardContent className="p-0">
              {/* חלק ראשון: פרטים אישיים ותקשורת */}
              <div className="p-6 flex flex-col md:flex-row justify-between items-start border-b gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl gradient-warm flex items-center justify-center text-2xl font-bold text-white shadow-soft">
                    {formData.full_name?.[0]}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      {formData.full_name}
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium">
                      בן זוג: {formData.partner_name || "לא הוזן"}
                    </p>
                    <Badge
                      variant="secondary"
                      className="mt-2 bg-sage/10 text-sage border-sage/20"
                    >
                      {formData.client_status}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <a href={`tel:${formData.phone}`} className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-primary/20"
                    >
                      <Phone className="w-4 h-4" /> טלפון
                    </Button>
                  </a>
                  <a
                    href={`https://wa.me/${formData.phone?.replace(/\D/g, "")}`}
                    target="_blank"
                    className="flex-1"
                  >
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-green-200 text-green-600 hover:bg-green-50"
                    >
                      ווטסאפ
                    </Button>
                  </a>
                </div>
              </div>

              {/* חלק שני: נתוני הריון ולידה */}
              <div className="p-6 space-y-6 bg-white/40">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <span>גיל הריון נוכחי</span>
                    <span className="text-primary">שבוע {calculateWeek()}</span>
                  </div>
                  <WeeklyProgress
                    currentWeek={calculateWeek()}
                    className="shadow-none border-none p-0 bg-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-dashed">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">
                      תל״מ
                    </Label>
                    <p className="text-sm font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-primary" />{" "}
                      {formData.estimated_due_date
                        ? format(
                            new Date(formData.estimated_due_date),
                            "dd/MM/yy"
                          )
                        : "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">
                      בית חולים מועדף
                    </Label>
                    <p className="text-sm font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-primary" />{" "}
                      {formData.hospital_primary || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">
                      מספר הריון
                    </Label>
                    <p className="text-sm font-bold flex items-center gap-1">
                      <Baby className="w-3 h-3 text-primary" />{" "}
                      {formData.pregnancy_number || "1"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">
                      תגיות
                    </Label>
                    <div className="flex flex-wrap gap-1">
                      {formData.tags?.slice(0, 2).map((t: string) => (
                        <Badge key={t} className="text-[9px] px-1 bg-muted">
                          {t}
                        </Badge>
                      ))}
                      {formData.tags?.length > 2 && (
                        <span className="text-[9px] text-muted-foreground">
                          +{formData.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => navigate(`/doula/live-monitor/${id}`)}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold gap-2 py-6 rounded-xl shadow-lg animate-pulse"
                >
                  <Activity className="w-5 h-5" /> למעבר למוניטור צירים חי
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* עמודה 2: קוביה 2 (ציר זמן) */}
          <div className="lg:col-span-5 xl:col-span-4 min-w-0">
            <TimelineWidget
              pregnancyId={id}
              events={events}
              onEventAdded={fetchClientData}
            />
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="ml-2 w-4 h-4" /> ביטול
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="gradient-warm"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Save className="ml-2 w-4 h-4" />
                  )}{" "}
                  שמירה
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                עריכת תיק
              </Button>
            )}
          </div>

          {/* טאבים למידע המשלים */}
          <Tabs defaultValue="personal" className="w-full" dir="rtl">
            <TabsList className="w-full h-auto p-1 bg-muted/50 rounded-xl mb-4 flex-wrap">
              <TabsTrigger value="personal" className="flex-1 py-2 text-xs">
                פרטים אישיים
              </TabsTrigger>
              <TabsTrigger value="medical" className="flex-1 py-2 text-xs">
                מיילדותי
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex-1 py-2 text-xs">
                מנהלה
              </TabsTrigger>
              <TabsTrigger value="docs" className="flex-1 py-2 text-xs">
                מסמכים
              </TabsTrigger>
              <TabsTrigger value="plan" className="flex-1 py-2 text-xs">
                תוכנית לידה
              </TabsTrigger>
            </TabsList>
            <TabsContent value="personal">
              <PersonalTab
                formData={formData}
                setFormData={setFormData}
                isEditing={isEditing}
              />
            </TabsContent>
            <TabsContent value="medical">
              <MedicalTab
                formData={formData}
                setFormData={setFormData}
                isEditing={isEditing}
              />
            </TabsContent>
            <TabsContent value="admin">
              <AdminTab
                formData={formData}
                setFormData={setFormData}
                isEditing={isEditing}
              />
            </TabsContent>
            <TabsContent value="docs">
              <DocumentsManager motherId={data.profiles.id} />
            </TabsContent>
            <TabsContent value="plan">
              <BirthPlanViewer
                plan={formData.birth_plan_notes}
                onChange={(newPlan: any) =>
                  setFormData({ ...formData, birth_plan_notes: newPlan })
                }
                isEditable={isEditing}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
