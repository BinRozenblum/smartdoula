import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Users } from "lucide-react";
import { FormField } from "./FormField";

export function PersonalTab({ formData, setFormData, isEditing }: any) {
  const update = (field: string, val: any) => setFormData({ ...formData, [field]: val });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      {/* כרטיס יולדת */}
      <Card>
        <CardHeader><CardTitle className="text-base flex gap-2"><User className="w-4 h-4"/> פרטי יולדת</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="שם מלא" value={formData.full_name} onChange={v => update('full_name', v)} isEditing={isEditing} />
            <FormField label="תחום עיסוק" value={formData.occupation} onChange={v => update('occupation', v)} isEditing={isEditing} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <FormField label="טלפון ראשי" value={formData.phone} onChange={v => update('phone', v)} isEditing={isEditing} dir="ltr" />
             <FormField label="טלפון נוסף" value={formData.phone_secondary} onChange={v => update('phone_secondary', v)} isEditing={isEditing} dir="ltr" />
          </div>
          <FormField label="אימייל" value={formData.email} onChange={v => update('email', v)} isEditing={isEditing && false} />
          <FormField label="כתובת מגורים" value={formData.address} onChange={v => update('address', v)} isEditing={isEditing} />
        </CardContent>
      </Card>

      {/* כרטיס בן זוג ומלווים */}
      <Card>
        <CardHeader><CardTitle className="text-base flex gap-2"><Users className="w-4 h-4"/> בן זוג ומלווים</CardTitle></CardHeader>
        <CardContent className="space-y-6">
           {/* בן זוג */}
           <div className="space-y-3">
             <h4 className="text-sm font-semibold text-muted-foreground border-b pb-1">בן/בת הזוג</h4>
             <div className="grid grid-cols-2 gap-4">
                <FormField label="שם מלא" value={formData.partner_name} onChange={v => update('partner_name', v)} isEditing={isEditing} />
                <FormField label="טלפון" value={formData.partner_phone} onChange={v => update('partner_phone', v)} isEditing={isEditing} dir="ltr"/>
             </div>
             <FormField label="עיסוק" value={formData.partner_occupation} onChange={v => update('partner_occupation', v)} isEditing={isEditing} />
           </div>

           {/* מלווה נוסף */}
           <div className="space-y-3">
             <h4 className="text-sm font-semibold text-muted-foreground border-b pb-1">מלווה נוסף בלידה</h4>
             <div className="grid grid-cols-3 gap-2">
                <FormField label="שם" value={formData.companion_name} onChange={v => update('companion_name', v)} isEditing={isEditing} />
                <FormField label="קירבה" value={formData.companion_relation} onChange={v => update('companion_relation', v)} isEditing={isEditing} placeholder="אמא/אחות" />
                <FormField label="טלפון" value={formData.companion_phone} onChange={v => update('companion_phone', v)} isEditing={isEditing} dir="ltr"/>
             </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}