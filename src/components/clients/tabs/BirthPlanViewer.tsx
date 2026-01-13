import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface BirthPlanProps {
  plan: any; // המידע מגיע מלמעלה
  onChange: (newPlan: any) => void; // עדכון למעלה
  isEditable: boolean;
}

export function BirthPlanViewer({
  plan,
  onChange,
  isEditable,
}: BirthPlanProps) {
  // וידוא שהאובייקט קיים למניעת קריסה
  const safePlan = plan || {
    environment: { dimmedLights: false, music: false, pools: false },
    painManagement: { epidural: false, natural: true, gas: false },
    notes: "",
  };

  const updateSection = (section: string, key: string, value: boolean) => {
    const updated = {
      ...safePlan,
      [section]: { ...safePlan[section], [key]: value },
    };
    onChange(updated);
  };

  const updateNotes = (value: string) => {
    const updated = { ...safePlan, notes: value };
    onChange(updated);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold flex gap-2">
          <FileText /> תוכנית לידה
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">אווירה וסביבה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={safePlan.environment?.dimmedLights}
                onCheckedChange={(c) =>
                  updateSection("environment", "dimmedLights", c as boolean)
                }
                disabled={!isEditable}
              />
              <span>אורות עמומים</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={safePlan.environment?.music}
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
            <CardTitle className="text-base">ניהול כאב</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={safePlan.painManagement?.epidural}
                onCheckedChange={(c) =>
                  updateSection("painManagement", "epidural", c as boolean)
                }
                disabled={!isEditable}
              />
              <span>אפידורל (במידת הצורך)</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={safePlan.painManagement?.natural}
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
          <CardTitle className="text-base">הערות ובקשות מיוחדות</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={safePlan.notes || ""}
            onChange={(e) => updateNotes(e.target.value)}
            disabled={!isEditable}
            className="min-h-[100px] bg-white"
          />
        </CardContent>
      </Card>
    </div>
  );
}
