import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Loader2,
  Save,
  Baby,
  Stethoscope,
  Clock,
  HeartHandshake,
  FileText,
  Activity,
  ClipboardList,
  Smile,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { differenceInHours, differenceInMinutes } from "date-fns";

export function BirthSummaryTab({ pregnancyId, initialData, onSave }: any) {
  // אם אין מידע, נתחיל עם אובייקט ריק
  const [formData, setFormData] = useState(initialData || {});
  const [saving, setSaving] = useState(false);
  const [durationString, setDurationString] = useState("");

  // פונקציה לעדכון שדות בתוך ה-State
  const update = (key: string, value: any) => {
    setFormData((prev: any) => {
      const newData = { ...prev, [key]: value };

      // חישוב אוטומטי של משך לידה אם עדכנו שעות
      if (key === "startTime" || key === "endTime") {
        calculateDuration(
          key === "startTime" ? value : prev.startTime,
          key === "endTime" ? value : prev.endTime,
        );
      }
      return newData;
    });
  };

  // חישוב אוטומטי של משך הלידה
  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) {
      setDurationString("");
      return;
    }
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (endDate <= startDate) {
      setDurationString("שגיאה בתאריכים");
      return;
    }

    const hours = differenceInHours(endDate, startDate);
    const minutes = differenceInMinutes(endDate, startDate) % 60;
    setDurationString(`${hours} שעות ו-${minutes} דקות`);
  };

  // אתחול חישוב משך בלידה בטעינה ראשונית
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      calculateDuration(formData.startTime, formData.endTime);
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // שמירה לעמודת ה-JSONB הגמישה
      const { error } = await supabase
        .from("pregnancies")
        .update({
          birth_summary_data: formData,
          // אופציונלי: עדכון עמודות בסיס אם קיימות בטבלה הראשית לטובת שאילתות
          birth_date: formData.birthDate || null,
          baby_weight: formData.babyWeight || null,
        })
        .eq("id", pregnancyId);

      if (error) throw error;
      toast.success("סיכום הלידה נשמר בהצלחה!");
      if (onSave) onSave();
    } catch (error) {
      console.error(error);
      toast.error("שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header פעולות */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 rounded-xl border shadow-sm flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> סיכום לידה מלא
          </h2>
          <p className="text-xs text-muted-foreground">
            תיעוד מלא של תהליך הלידה
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gradient-warm text-white shadow-md"
        >
          {saving ? (
            <Loader2 className="animate-spin ml-2 w-4 h-4" />
          ) : (
            <Save className="ml-2 w-4 h-4" />
          )}
          שמירה
        </Button>
      </div>

      <Accordion
        type="single"
        collapsible
        defaultValue="basic"
        className="space-y-4"
      >
        {/* 1. פרטי לידה בסיסיים */}
        <AccordionItem
          value="basic"
          className="border rounded-xl bg-white px-4"
        >
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 font-bold text-base">
              <Clock className="w-5 h-5 text-blue-500" /> פרטי לידה בסיסיים
            </div>
          </AccordionTrigger>
          <AccordionContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 pb-4">
            <div className="space-y-2">
              <Label>תאריך הלידה</Label>
              <Input
                type="date"
                value={formData.birthDate || ""}
                onChange={(e) => update("birthDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>מקום הלידה</Label>
              <Select
                value={formData.birthLocation}
                onValueChange={(v) => update("birthLocation", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hospital">בית חולים</SelectItem>
                  <SelectItem value="home">לידת בית</SelectItem>
                  <SelectItem value="center">מרכז לידה טבעית</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>שם בית החולים (אם רלוונטי)</Label>
              <Input
                value={formData.hospitalName || ""}
                onChange={(e) => update("hospitalName", e.target.value)}
                placeholder="לדוגמה: איכילוב"
              />
            </div>
            <div className="space-y-2">
              <Label>סוג הלידה</Label>
              <Select
                value={formData.deliveryType}
                onValueChange={(v) => update("deliveryType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vaginal">וגינלית רגילה</SelectItem>
                  <SelectItem value="instrumental">
                    מכשירנית (ואקום/מלקחיים)
                  </SelectItem>
                  <SelectItem value="c_section_emergency">
                    קיסרי חירום
                  </SelectItem>
                  <SelectItem value="c_section_planned">
                    קיסרי מתוכנן
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>אופן התחלה</Label>
              <Select
                value={formData.startMode}
                onValueChange={(v) => update("startMode", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spontaneous">ספונטני</SelectItem>
                  <SelectItem value="induced">השראת לידה (זירוז)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* חישוב זמנים */}
            <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-lg border mt-2">
              <div className="space-y-2">
                <Label>מועד התחלה</Label>
                <Input
                  type="datetime-local"
                  value={formData.startTime || ""}
                  onChange={(e) => update("startTime", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>מועד סיום (לידה)</Label>
                <Input
                  type="datetime-local"
                  value={formData.endTime || ""}
                  onChange={(e) => update("endTime", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>משך לידה (מחושב)</Label>
                <div className="h-10 flex items-center px-3 border rounded-md bg-slate-100 font-mono text-sm font-bold">
                  {durationString || "-"}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 2. צוות רפואי */}
        <AccordionItem
          value="staff"
          className="border rounded-xl bg-white px-4"
        >
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 font-bold text-base">
              <Stethoscope className="w-5 h-5 text-green-600" /> צוות ומלווים
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2 pb-4">
            <div className="space-y-2">
              <Label>מיילדת / מיילדות (ניתן להזין כמה)</Label>
              <Input
                value={formData.midwives || ""}
                onChange={(e) => update("midwives", e.target.value)}
                placeholder="לדוגמה: שרה כהן, רחל לוי"
              />
            </div>
            <div className="space-y-2">
              <Label>רופא/ה</Label>
              <Input
                value={formData.doctor || ""}
                onChange={(e) => update("doctor", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>אנשי צוות נוספים (מרדים, סטאז'ר, דולה נוספת)</Label>
              <Input
                value={formData.otherStaff || ""}
                onChange={(e) => update("otherStaff", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>מלווים נוספים (משפחה)</Label>
              <Input
                value={formData.familyEscorts || ""}
                onChange={(e) => update("familyEscorts", e.target.value)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 3. מהלך הלידה */}
        <AccordionItem
          value="process"
          className="border rounded-xl bg-white px-4"
        >
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 font-bold text-base">
              <Activity className="w-5 h-5 text-purple-500" /> מהלך הלידה
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>פתיחה מקסימלית</Label>
                <Select
                  value={formData.maxDilation}
                  onValueChange={(v) => update("maxDilation", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ס״מ" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(11).keys()].map((i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i === 10 ? "פתיחה מלאה (10)" : i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>שלב לטנטי</Label>
                <Input
                  placeholder="משך זמן..."
                  value={formData.latentPhase || ""}
                  onChange={(e) => update("latentPhase", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>שלב פעיל</Label>
                <Input
                  placeholder="משך זמן..."
                  value={formData.activePhase || ""}
                  onChange={(e) => update("activePhase", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>שלב לחיצות</Label>
                <Input
                  placeholder="משך זמן..."
                  value={formData.pushingPhase || ""}
                  onChange={(e) => update("pushingPhase", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>סוג משכך כאבים</Label>
              <Input
                value={formData.painRelief || ""}
                onChange={(e) => update("painRelief", e.target.value)}
                placeholder="ללא, אפידורל, גז צחוק..."
              />
            </div>

            <div className="space-y-2">
              <Label>תנוחות, תנועות ותרגילים</Label>
              <Textarea
                value={formData.positions || ""}
                onChange={(e) => update("positions", e.target.value)}
                placeholder="כדור פיזיו, מקלחת, תנוחות עמידה..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>שימוש בעזרים</Label>
                <Input
                  value={formData.toolsUsed || ""}
                  onChange={(e) => update("toolsUsed", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>התערבויות רפואיות</Label>
                <Input
                  value={formData.interventions || ""}
                  onChange={(e) => update("interventions", e.target.value)}
                  placeholder="פקיעת מים, פיטוצין..."
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 4. סיום הלידה והתינוק */}
        <AccordionItem value="baby" className="border rounded-xl bg-white px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 font-bold text-base">
              <Baby className="w-5 h-5 text-orange-400" /> סיום הלידה והתינוק
            </div>
          </AccordionTrigger>
          <AccordionContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 pb-4">
            <div className="space-y-2">
              <Label>מין היילוד</Label>
              <Select
                value={formData.babyGender}
                onValueChange={(v) => update("babyGender", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">זכר</SelectItem>
                  <SelectItem value="female">נקבה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>משקל (גרם)</Label>
              <Input
                type="number"
                value={formData.babyWeight || ""}
                onChange={(e) => update("babyWeight", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>אפגר (דקה 1 / דקה 5)</Label>
              <Input
                value={formData.apgar || ""}
                onChange={(e) => update("apgar", e.target.value)}
                placeholder="9/10"
              />
            </div>
            <div className="space-y-2">
              <Label>קרע או חתך</Label>
              <Select
                value={formData.tears}
                onValueChange={(v) => update("tears", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא קרעים</SelectItem>
                  <SelectItem value="1">דרגה 1</SelectItem>
                  <SelectItem value="2">דרגה 2</SelectItem>
                  <SelectItem value="3">דרגה 3-4</SelectItem>
                  <SelectItem value="episiotomy">
                    חתך חיץ (Episiotomy)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 5. חוויה ותפקוד הדולה */}
        <AccordionItem
          value="experience"
          className="border rounded-xl bg-white px-4"
        >
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 font-bold text-base">
              <Smile className="w-5 h-5 text-pink-500" /> חוויה ורפלקציה
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>מצב רגשי</Label>
                <Input
                  value={formData.emotionalState || ""}
                  onChange={(e) => update("emotionalState", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>תחושת שליטה</Label>
                <Input
                  value={formData.senseOfControl || ""}
                  onChange={(e) => update("senseOfControl", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>שיתוף פעולה עם הצוות</Label>
              <Textarea
                value={formData.teamCooperation || ""}
                onChange={(e) => update("teamCooperation", e.target.value)}
                className="h-20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>רגעים משמעותיים</Label>
                <Textarea
                  value={formData.significantMoments || ""}
                  onChange={(e) => update("significantMoments", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>קשיים עיקריים</Label>
                <Textarea
                  value={formData.mainDifficulties || ""}
                  onChange={(e) => update("mainDifficulties", e.target.value)}
                />
              </div>
            </div>

            <div className="bg-sage/10 p-4 rounded-lg border border-sage/20 mt-4 space-y-4">
              <h3 className="font-bold text-sage-foreground text-sm">
                תפקוד הדולה
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>מה עבד טוב?</Label>
                  <Textarea
                    value={formData.doulaWorkedWell || ""}
                    onChange={(e) => update("doulaWorkedWell", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>מה פחות עבד / לשיפור</Label>
                  <Textarea
                    value={formData.doulaImprovements || ""}
                    onChange={(e) =>
                      update("doulaImprovements", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 6. אחרי לידה ומנהלות */}
        <AccordionItem
          value="postpartum"
          className="border rounded-xl bg-white px-4"
        >
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 font-bold text-base">
              <ClipboardList className="w-5 h-5 text-gray-500" /> אחרי לידה
              ומנהלות
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>הנקה ראשונית</Label>
                <Select
                  value={formData.firstBreastfeeding}
                  onValueChange={(v) => update("firstBreastfeeding", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">כן, בהצלחה</SelectItem>
                    <SelectItem value="partial">חלקית / עם קושי</SelectItem>
                    <SelectItem value="no">לא התבצעה</SelectItem>
                    <SelectItem value="staff_help">בעזרת הצוות</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>מצב היולדת אחרי לידה</Label>
                <Input
                  value={formData.motherStatusPost || ""}
                  onChange={(e) => update("motherStatusPost", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>מצב התינוק</Label>
                <Select
                  value={formData.babyStatusPost}
                  onValueChange={(v) => update("babyStatusPost", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ok">תקין (ביות מלא/חלקי)</SelectItem>
                    <SelectItem value="observation">השגחה</SelectItem>
                    <SelectItem value="nicu">טיפול נמרץ / פגייה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>המלצות להמשך ליווי (ביקורי בית, יועצת הנקה וכו')</Label>
              <Textarea
                value={formData.followUpRecs || ""}
                onChange={(e) => update("followUpRecs", e.target.value)}
              />
            </div>

            <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>שם דולה מגבה (אם היתה)</Label>
                <Input
                  value={formData.backupDoulaName || ""}
                  onChange={(e) => update("backupDoulaName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>סיכום פנימי לדולה (לא לשתף)</Label>
                <Textarea
                  value={formData.internalSummary || ""}
                  onChange={(e) => update("internalSummary", e.target.value)}
                  placeholder="הערות אישיות..."
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
