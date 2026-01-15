import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Baby, Tag, X } from "lucide-react";
import { FormField } from "./FormField";
import { useState } from "react";

export function MedicalTab({ formData, setFormData, isEditing }: any) {
  const [newTag, setNewTag] = useState("");
  const update = (field: string, val: any) =>
    setFormData({ ...formData, [field]: val });

  const addTag = () => {
    if (newTag && !formData.tags?.includes(newTag)) {
      setFormData({ ...formData, tags: [...(formData.tags || []), newTag] });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t: string) => t !== tagToRemove),
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      {/* נתונים רפואיים קריטיים */}
      <Card className="border-red-100 bg-red-50/30">
        <CardHeader>
          <CardTitle className="text-base flex gap-2 text-red-900">
            <ShieldAlert className="w-4 h-4" /> מידע רפואי קריטי
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="סוג דם"
              value={formData.blood_type}
              onChange={(v) => update("blood_type", v)}
              isEditing={isEditing}
            />
            <FormField
              label="מספר לידות קודמות"
              value={formData.number_of_previous_births}
              onChange={(v) => update("number_of_previous_births", v)}
              isEditing={isEditing}
              type="number"
            />

            <FormField
              label="מספר עוברים"
              value={formData.number_of_fetuses}
              onChange={(v) => update("number_of_fetuses", v)}
              isEditing={isEditing}
              type="number"
            />
          </div>
          <FormField
            label="רגישויות ואלרגיות"
            value={formData.allergies}
            onChange={(v) => update("allergies", v)}
            isEditing={isEditing}
          />
          <FormField
            label="מחלות רקע"
            value={formData.background_diseases}
            onChange={(v) => update("background_diseases", v)}
            isEditing={isEditing}
          />
        </CardContent>
      </Card>

      {/* פרטי הריון */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex gap-2">
            <Baby className="w-4 h-4" /> פרטי הלידה המתוכננת
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="וסת אחרון (LMP)"
              value={formData.last_period_date}
              onChange={(v) => update("last_period_date", v)}
              isEditing={isEditing}
              type="date"
            />
            <FormField
              label="תל''מ (EDD)"
              value={formData.estimated_due_date}
              onChange={(v) => update("estimated_due_date", v)}
              isEditing={isEditing}
              type="date"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="בי''ח מועדף 1"
              value={formData.hospital_primary}
              onChange={(v) => update("hospital_primary", v)}
              isEditing={isEditing}
            />
            <FormField
              label="בי''ח מועדף 2"
              value={formData.hospital_secondary}
              onChange={(v) => update("hospital_secondary", v)}
              isEditing={isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* תגיות */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex gap-2">
            <Tag className="w-4 h-4" /> תגיות ומאפיינים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.tags?.map((tag: string) => (
              <Badge
                key={tag}
                variant="secondary"
                className="px-3 py-1 gap-2 bg-white border"
              >
                {tag}
                {isEditing && (
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeTag(tag)}
                  />
                )}
              </Badge>
            ))}
            {(!formData.tags || formData.tags.length === 0) && (
              <span className="text-muted-foreground text-sm">אין תגיות</span>
            )}
          </div>

          {isEditing && (
            <div className="flex gap-2 max-w-sm">
              <Input
                placeholder="הוסף תגית (לדוגמה: סכרת הריון)"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTag())
                }
                className="h-9"
              />
              <Button
                type="button"
                onClick={addTag}
                variant="secondary"
                size="sm"
              >
                הוסף
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* היסטוריה */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">היסטוריה מיילדותית (G/P)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            label="סיכום G/P"
            value={formData.g_p_summary}
            onChange={(v) => update("g_p_summary", v)}
            isEditing={isEditing}
            placeholder="G_ P_"
          />
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              פירוט לידות עבר / הפלות
            </Label>
            <Textarea
              value={formData.obstetric_history}
              onChange={(e) => update("obstetric_history", e.target.value)}
              disabled={!isEditing}
              className="min-h-[100px] bg-white"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
