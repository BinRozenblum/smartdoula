import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { MapPin, MessageCircle, Star, Phone, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DoulaProps {
  doula: {
    id: string;
    full_name: string;
    avatar_url?: string;
    bio?: string;
    years_experience?: number;
    service_areas?: string[];
    specialties?: string[];
    phone?: string;
  };
}

export function DoulaCard({ doula }: DoulaProps) {
  const navigate = useNavigate();

  // יצירת ראשי תיבות
  const initials = doula.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  // הפיכת מספר טלפון ללינק לווטסאפ
  const whatsappLink = doula.phone
    ? `https://wa.me/${doula.phone.replace(/\D/g, "")}?text=היי ראיתי אותך ב-SmartDoula ואשמח לשמוע פרטים`
    : "#";

  // פונקציית מעבר להרשמה
  const handleRegisterClick = () => {
    // מעבר לדף ההרשמה עם המזהה של הדולה הספציפית הזו
    navigate(`/invite?doulaId=${doula.id}`);
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-none bg-white/80 backdrop-blur-sm shadow-sm flex flex-col h-full">
      {/* --- Header: תמונה ורקע --- */}
      <CardHeader className="relative p-0 h-24 bg-gradient-to-r from-peach-light/50 to-sage-light/50">
        <div className="absolute -bottom-8 right-6">
          <Avatar className="w-20 h-20 border-4 border-white shadow-md">
            <AvatarImage src={doula.avatar_url} className="object-cover" />
            <AvatarFallback className="bg-white text-lg font-bold text-muted-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
        {doula.years_experience && (
          <Badge className="absolute top-4 left-4 bg-white/90 text-foreground shadow-sm hover:bg-white border-none">
            <Star className="w-3 h-3 mr-1 text-yellow-500 fill-yellow-500" />
            {doula.years_experience} שנות ניסיון
          </Badge>
        )}
      </CardHeader>

      {/* --- Content: פרטים --- */}
      <CardContent className="pt-10 pb-4 px-6 flex-1">
        <h3 className="text-xl font-bold mb-1 text-foreground">
          {doula.full_name}
        </h3>

        {/* אזורי שירות */}
        {doula.service_areas && doula.service_areas.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <MapPin className="w-3 h-3" />
            <span>{doula.service_areas.join(", ")}</span>
          </div>
        )}

        {/* ביוגרפיה קצרה */}
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed h-[60px]">
          {doula.bio ||
            "דולה מוסמכת המלווה נשים וזוגות בתהליך הלידה, מעניקה תמיכה רגשית ופיזית..."}
        </p>

        {/* תגיות התמחות */}
        <div className="flex flex-wrap gap-2 mt-auto">
          {doula.specialties?.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 border-none"
            >
              {tag}
            </Badge>
          ))}
          {doula.specialties && doula.specialties.length > 3 && (
            <span className="text-[10px] text-muted-foreground self-center">
              +{doula.specialties.length - 3}
            </span>
          )}
        </div>
      </CardContent>

      {/* --- Footer: פעולות --- */}
      <CardFooter className="p-4 bg-muted/20 flex flex-col gap-3 border-t">
        {/* שורה 1: יצירת קשר (בירורים) */}
        <div className="flex gap-2 w-full">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="flex-1"
          >
            <Button
              variant="outline"
              className="w-full gap-2 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 bg-white h-9 shadow-sm"
            >
              <MessageCircle className="w-4 h-4" /> ווטסאפ
            </Button>
          </a>
          <a href={`tel:${doula.phone}`} className="flex-none">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
            >
              <Phone className="w-4 h-4" />
            </Button>
          </a>
        </div>

        {/* שורה 2: כפתור הצטרפות (סגירה) */}
        <Button
          onClick={handleRegisterClick}
          className="w-full gradient-warm text-white shadow-md hover:opacity-90 gap-2 h-10 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          להרשמה ותחילת ליווי
        </Button>
      </CardFooter>
    </Card>
  );
}
