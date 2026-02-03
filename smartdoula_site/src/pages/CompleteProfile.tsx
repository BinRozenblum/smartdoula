import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Users, Heart, Loader2, Baby } from "lucide-react";
import { toast } from "sonner";

export default function CompleteProfile() {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"mother" | "doula">("mother");
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // וידוא שהמשתמש מחובר
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
      }
    });
  }, [navigate]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // נחליף את ה-upsert ב-update פשוט
      const { error } = await supabase
        .from("profiles")
        .update({
          role: role,
          // השם והאימייל כבר הוכנסו על ידי הטריגר ב-DB
        })
        .eq("id", user.id); // מעדכן רק את השורה של המשתמש הנוכחי

      if (error) throw error;

      // 2. עדכון ה-Metadata של המשתמש (כדי שהסשן יתעדכן מיד ללא צורך בטעינה מחדש)
      await supabase.auth.updateUser({
        data: { role: role },
      });

      toast.success("הפרופיל עודכן בהצלחה!");

      // 3. הפניה לדאשבורד המתאים
      if (role === "doula") {
        navigate("/doula");
      } else {
        navigate("/mother");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("שגיאה בעדכון: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-peach-light/40 via-background to-sage-light/20">
      <Card className="max-w-md w-full shadow-card border-none">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-warm flex items-center justify-center shadow-soft">
            <Baby className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">ברוכים הבאים!</CardTitle>
          <CardDescription>
            כדי להתאים לך את המערכת, ספרי לנו מי את
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            defaultValue="mother"
            onValueChange={(v) => setRole(v as any)}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem
                value="mother"
                id="mother"
                className="peer sr-only"
              />
              <Label
                htmlFor="mother"
                className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all h-full"
              >
                <Heart className="mb-3 h-8 w-8 text-primary" />
                <span className="font-bold text-lg">אמא</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  אני בהיריון
                </span>
              </Label>
            </div>
            <div>
              <RadioGroupItem
                value="doula"
                id="doula"
                className="peer sr-only"
              />
              <Label
                htmlFor="doula"
                className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-secondary [&:has([data-state=checked])]:border-secondary cursor-pointer transition-all h-full"
              >
                <Users className="mb-3 h-8 w-8 text-secondary-foreground" />
                <span className="font-bold text-lg">דולה</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  אני מלווה לידות
                </span>
              </Label>
            </div>
          </RadioGroup>

          <Button
            className="w-full gradient-warm text-white h-12 text-lg font-bold"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : "סיום והתחלה"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
