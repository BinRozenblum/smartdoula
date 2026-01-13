import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, FileText } from "lucide-react";

interface BirthPlanProps {
  pregnancyId: string;
  initialData: any; // ה-JSON מתוך ה-DB
  isEditable: boolean;
}

export function BirthPlanViewer({
  pregnancyId,
  initialData,
  isEditable,
}: BirthPlanProps) {
  // מבנה ברירת מחדל אם אין נתונים
  const [plan, setPlan] = useState(
    initialData || {
      environment: { dimmedLights: false, music: false, pools: false },
      painManagement: { epidural: false, natural: true, gas: false },
      notes: "",
    }
  );

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("pregnancies")
      .update({ birth_plan_notes: plan })
      .eq("id", pregnancyId);

    if (error) toast.error("שגיאה בשמירה");
    else toast.success("תוכנית הלידה עודכנה");
    setSaving(false);
  };

  const updateSection = (section: string, key: string, value: boolean) => {
    setPlan((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold flex gap-2">
          <FileText /> תוכנית לידה
        </h3>
       
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>אווירה וסביבה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={plan.environment?.dimmedLights}
                onCheckedChange={(c) =>
                  updateSection("environment", "dimmedLights", c as boolean)
                }
                disabled={!isEditable}
              />
              <span>אורות עמומים</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={plan.environment?.music}
                onCheckedChange={(c) =>
                  updateSection("environment", "music", c as boolean)
                }
                disabled={!isEditable}
              />
              <span>מוזיקה שלי</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ניהול כאב</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={plan.painManagement?.epidural}
                onCheckedChange={(c) =>
                  updateSection("painManagement", "epidural", c as boolean)
                }
                disabled={!isEditable}
              />
              <span>אפידורל (במידת הצורך)</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={plan.painManagement?.natural}
                onCheckedChange={(c) =>
                  updateSection("painManagement", "natural", c as boolean)
                }
                disabled={!isEditable}
              />
              <span>שאיפה ללידה טבעית</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>הערות ובקשות מיוחדות</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={plan.notes}
            onChange={(e) => setPlan({ ...plan, notes: e.target.value })}
            disabled={!isEditable}
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>
    </div>
  );
}
