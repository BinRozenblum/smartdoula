import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormFieldProps {
  label: string;
  value: any;
  onChange: (val: any) => void;
  isEditing: boolean;
  type?: string;
  placeholder?: string;
  dir?: string;
}

export function FormField({ 
  label, value, onChange, isEditing, type = "text", placeholder = "", dir="rtl"
}: FormFieldProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {isEditing ? (
        <Input 
          type={type} 
          value={value || ""} 
          onChange={e => onChange(e.target.value)} 
          placeholder={placeholder}
          dir={dir}
          className="h-9 bg-white"
        />
      ) : (
        <p className="font-medium text-sm min-h-[20px] pt-1 border-b border-transparent" dir={dir}>
          {value || "-"}
        </p>
      )}
    </div>
  );
}