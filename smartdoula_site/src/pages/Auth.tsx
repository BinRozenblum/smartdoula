import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Baby, Heart, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"mother" | "doula">("mother");
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          // השמות כאן חייבים להיות זהים למה שה-SQL מחפש (full_name ו-role)
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("נרשמת בהצלחה! בדקי את המייל לאישור החשבון");
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("שגיאה בהתחברות: " + error.message);
    } else {
      toast.success("ברוכה הבאה!");
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-peach-light/40 via-background to-sage-light/20">
      <div className="w-full max-w-md space-y-8">
        {/* Logo Section */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-16 h-16 rounded-2xl gradient-warm items-center justify-center shadow-soft mb-2">
            <Baby className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            SmartDoula
          </h1>
          <p className="text-muted-foreground">
            הבית שלך לניהול ההיריון והלידה
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8" dir="rtl">
            <TabsTrigger value="login">התחברות</TabsTrigger>
            <TabsTrigger value="register">הרשמה</TabsTrigger>
          </TabsList>

          {/* Login Form */}
          <TabsContent value="login" dir="rtl">
            <Card className="border-none shadow-card">
              <form onSubmit={handleSignIn}>
                <CardHeader>
                  <CardTitle>שמחים שחזרת</CardTitle>
                  <CardDescription>
                    הזיני פרטים כדי להיכנס לחשבון שלך
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">אימייל</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">סיסמה</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full gradient-warm text-white font-bold"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "כניסה"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Register Form */}
          <TabsContent value="register" dir="rtl">
            <Card className="border-none shadow-card">
              <form onSubmit={handleSignUp}>
                <CardHeader>
                  <CardTitle>יצירת חשבון חדש</CardTitle>
                  <CardDescription>
                    הצטרפי לקהילת הדולות והאמהות שלנו
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">שם מלא</Label>
                    <Input
                      id="name"
                      placeholder="ישראל ישראלית"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">אימייל</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">סיסמה</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label>אני נרשמת כ...</Label>
                    <RadioGroup
                      defaultValue="mother"
                      className="grid grid-cols-2 gap-4"
                      onValueChange={(v) => setRole(v as any)}
                    >
                      <div>
                        <RadioGroupItem
                          value="mother"
                          id="mother"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="mother"
                          className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                        >
                          <Heart className="mb-2 h-6 w-6 text-primary" />
                          <span className="font-semibold">אמא</span>
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
                          className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-secondary [&:has([data-state=checked])]:border-secondary cursor-pointer transition-all"
                        >
                          <Users className="mb-2 h-6 w-6 text-secondary-foreground" />
                          <span className="font-semibold">דולה</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full gradient-warm text-white font-bold"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "הרשמה"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground px-8 leading-relaxed">
          בלחיצה על הרשמה, את מסכימה לתנאי השימוש ולמדיניות הפרטיות שלנו.
        </p>
      </div>
    </div>
  );
}
