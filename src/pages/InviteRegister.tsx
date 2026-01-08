import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Baby, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function InviteRegister() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const doulaId = searchParams.get("doulaId");
  
  const [doulaName, setDoulaName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    dueDate: ""
  });

  // טעינת שם הדולה כדי לתת הרגשה אישית
  useEffect(() => {
    if (doulaId) {
      supabase.from('profiles').select('full_name').eq('id', doulaId).single()
        .then(({ data }) => setDoulaName(data?.full_name || null));
    }
  }, [doulaId]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doulaId) return;
    
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          role: 'mother',
          invited_by: doulaId,
          due_date: formData.dueDate
        },
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("ברוכה הבאה! החשבון נוצר והקשר עם הדולה עודכן");
      navigate("/");
    }
    setLoading(false);
  };

  if (!doulaId) return <div className="text-center p-10 font-heebo text-xl text-destructive">קישור הזמנה לא תקין</div>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-hover border-none bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 gradient-warm rounded-full flex items-center justify-center shadow-soft">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">הצטרפי ל-SmartDoula</CardTitle>
          <CardDescription className="text-lg">
            {doulaName ? (
              <span>הדולה <strong>{doulaName}</strong> הזמינה אותך לליווי דיגיטלי אישי</span>
            ) : (
              "הוזמנת לליווי אישי חכם"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4 font-heebo text-right" dir="rtl">
            <div className="space-y-2">
              <Label>שם מלא</Label>
              <Input required placeholder="איך לקרוא לך?" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>אימייל</Label>
              <Input type="email" required placeholder="your@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>סיסמה</Label>
              <Input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>תאריך לידה משוער (אופציונלי)</Label>
              <Input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
            </div>
            <Button className="w-full gradient-warm text-white h-12 text-lg mt-6" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "בואי נתחיל"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}