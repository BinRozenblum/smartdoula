import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BadgeCheck } from "lucide-react";
import { FormField } from "./FormField";

const STATUS_OPTIONS = [
  { value: "lead", label: "ליד (מתעניינת)" },
  { value: "client", label: "לקוחה (חתמה)" },
  { value: "active", label: "פעילה (חודש 9/לידה)" },
  { value: "postpartum", label: "אחרי לידה" },
  { value: "cancelled", label: "בוטלה" },
];

export function AdminTab({ formData, setFormData, isEditing }: any) {
  const update = (field: string, val: any) =>
    setFormData({ ...formData, [field]: val });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">פרטי התקשרות</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">סטטוס לקוחה</Label>
            <Select
              value={formData.client_status || "lead"}
              onValueChange={(v) => update("client_status", v)}
              disabled={!isEditing}
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <FormField
            label="מחיר שסוכם (₪)"
            value={formData.agreed_price}
            onChange={(v) => update("agreed_price", v)}
            isEditing={isEditing}
            type="number"
          />

          <div className="flex items-center justify-between p-2 border rounded bg-white mt-4">
            <span className="text-sm">שומרת שבת?</span>
            <Switch
              checked={!!formData.is_shomeret_shabbat}
              onCheckedChange={(c) =>
                isEditing && update("is_shomeret_shabbat", c)
              }
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex gap-2">
            <BadgeCheck className="w-4 h-4" /> גיבוי (Back-up)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            label="שם דולת הגיבוי"
            value={formData.backup_doula_name}
            onChange={(v) => update("backup_doula_name", v)}
            isEditing={isEditing}
          />
          <FormField
            label="טלפון גיבוי"
            value={formData.backup_doula_phone}
            onChange={(v) => update("backup_doula_phone", v)}
            isEditing={isEditing}
            dir="ltr"
          />
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              סיכום מול הגיבוי
            </Label>
            <Textarea
              // התיקון כאן: הוספת || ""
              value={formData.backup_doula_notes || ""}
              onChange={(e) => update("backup_doula_notes", e.target.value)}
              disabled={!isEditing}
              placeholder="הערות לדולת הגיבוי..."
              className="bg-white"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">הערות כלליות</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            // התיקון כאן: הוספת || ""
            value={formData.general_notes || ""}
            onChange={(e) => update("general_notes", e.target.value)}
            disabled={!isEditing}
            className="min-h-[100px] bg-white"
          />
        </CardContent>
      </Card>
    </div>
  );
}
