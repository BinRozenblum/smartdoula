import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Save,
  Baby,
  Stethoscope,
  Clock,
  HeartHandshake,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function BirthSummaryTab({ pregnancyId, initialData, onSave }: any) {
  const [formData, setFormData] = useState(initialData || {});
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("pregnancies")
        .update({ birth_summary_data: formData })
        .eq("id", pregnancyId);

      if (error) throw error;
      toast.success("סיכום הלידה נשמר בהצלחה");
      if (onSave) onSave();
    } catch (error) {
      toast.error("שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center bg-muted/20 p-4 rounded-xl border">
        <h2 className="text-lg font-bold">סיכום לידה</h2>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gradient-warm text-white"
        >
          {saving ? (
            <Loader2 className="animate-spin ml-2" />
          ) : (
            <Save className="ml-2 w-4 h-4" />
          )}
          שמירת סיכום
        </Button>
      </div>

      {/* 1. פרטי לידה בסיסיים */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex gap-2">
            <Clock className="w-4 h-4" /> פרטי לידה בסיסיים
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>תאריך הלידה</Label>
            <Input
              type="date"
              value={formData.birthDate}
              onChange={(e) => update("birthDate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>שעת התחלה</Label>
            <Input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => update("startTime", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>שעת סיום (לידה)</Label>
            <Input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => update("endTime", e.target.value)}
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
                <SelectItem value="home">בית</SelectItem>
                <SelectItem value="natural_center">מרכז לידה טבעית</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="vaginal">וגינלית</SelectItem>
                <SelectItem value="instrumental">
                  מכשירנית (ואקום/מלקחיים)
                </SelectItem>
                <SelectItem value="c_section_emergency">קיסרי חירום</SelectItem>
                <SelectItem value="c_section_planned">קיסרי מתוכנן</SelectItem>
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
        </CardContent>
      </Card>

      {/* 2. צוות */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex gap-2">
            <Stethoscope className="w-4 h-4" /> צוות רפואי
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>שמות המיילדות</Label>
              <Input
                value={formData.midwives}
                onChange={(e) => update("midwives", e.target.value)}
                placeholder="שם, שם..."
              />
            </div>
            <div className="space-y-2">
              <Label>רופא/ה</Label>
              <Input
                value={formData.doctors}
                onChange={(e) => update("doctors", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>אנשי צוות נוספים</Label>
            <Input
              value={formData.otherStaff}
              onChange={(e) => update("otherStaff", e.target.value)}
              placeholder="מרדים, סטאז'ר..."
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. מהלך הלידה */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex gap-2">
            <FileText className="w-4 h-4" /> מהלך הלידה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>פתיחה מקסימלית</Label>
              <Input
                type="number"
                value={formData.maxDilation}
                onChange={(e) => update("maxDilation", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>משך לטנטי (שעות)</Label>
              <Input
                value={formData.latentPhaseDuration}
                onChange={(e) => update("latentPhaseDuration", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>משך פעיל</Label>
              <Input
                value={formData.activePhaseDuration}
                onChange={(e) => update("activePhaseDuration", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>שלב לחיצות</Label>
              <Input
                value={formData.pushingPhaseDuration}
                onChange={(e) => update("pushingPhaseDuration", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>משככי כאבים</Label>
            <Input
              value={formData.painRelief}
              onChange={(e) => update("painRelief", e.target.value)}
              placeholder="אפידורל, גז צחוק, ללא..."
            />
          </div>
          <div className="space-y-2">
            <Label>התערבויות רפואיות</Label>
            <Textarea
              value={formData.interventions}
              onChange={(e) => update("interventions", e.target.value)}
              placeholder="פקיעת מים, פיטוצין..."
            />
          </div>
          <div className="space-y-2">
            <Label>תנוחות וכלים שסייעו</Label>
            <Textarea
              value={formData.toolsUsed}
              onChange={(e) => update("toolsUsed", e.target.value)}
              placeholder="כדור פיזיו, מקלחת, תנוחות עמידה..."
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. סיום הלידה והתינוק */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex gap-2">
            <Baby className="w-4 h-4" /> סיום והתינוק
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              value={formData.babyWeight}
              onChange={(e) => update("babyWeight", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>אפגר (1/5)</Label>
            <Input
              value={formData.apgar}
              onChange={(e) => update("apgar", e.target.value)}
              placeholder="9/10"
            />
          </div>
          <div className="space-y-2">
            <Label>חתך/קרעים</Label>
            <Select
              value={formData.tears}
              onValueChange={(v) => update("tears", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ללא</SelectItem>
                <SelectItem value="1">דרגה 1</SelectItem>
                <SelectItem value="2">דרגה 2</SelectItem>
                <SelectItem value="3">דרגה 3</SelectItem>
                <SelectItem value="episiotomy">
                  חתך יזום (Episiotomy)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 5. חוויה וסיכום */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex gap-2">
            <HeartHandshake className="w-4 h-4" /> חוויה וסיכום אישי
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>חוויית היולדת (מילים שלה)</Label>
            <Textarea
              value={formData.motherExperience}
              onChange={(e) => update("motherExperience", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>תפקוד הדולה (מה עבד טוב? מה לשיפור?)</Label>
            <Textarea
              value={formData.doulaReflection}
              onChange={(e) => update("doulaReflection", e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <Label>הערות להמשך (הנקה/פוסט-פרטום)</Label>
            <Textarea
              value={formData.postpartumNotes}
              onChange={(e) => update("postpartumNotes", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
