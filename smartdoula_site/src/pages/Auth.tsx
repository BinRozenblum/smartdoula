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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"mother" | "doula">("mother");
  const navigate = useNavigate();

  // --- פונקציה חדשה לחיבור עם גוגל ---
  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // אחרי החיבור, לאן לחזור?
          // בפיתוח זה לוקלהוסט, בייצור זה יהיה הכתובת של נטליפיי
          redirectTo: window.location.origin,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
      // אין צורך ב-Navigate כי גוגל עושה רידיירקט מלא לדף חיצוני
    } catch (error: any) {
      toast.error("שגיאה בהתחברות עם גוגל: " + error.message);
      setGoogleLoading(false);
    }
  };
  // ------------------------------------

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
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

  // רכיב אייקון גוגל פשוט
  const GoogleIcon = () => (
    <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );

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
                  {/* כפתור גוגל */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full py-5 border-muted-foreground/20 hover:bg-white hover:shadow-md transition-all"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading || loading}
                  >
                    {googleLoading ? (
                      <Loader2 className="animate-spin ml-2" />
                    ) : (
                      <GoogleIcon />
                    )}
                    המשך עם Google
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        או עם אימייל
                      </span>
                    </div>
                  </div>

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
                    disabled={loading || googleLoading}
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
                  {/* כפתור גוגל גם בהרשמה */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full py-5 border-muted-foreground/20 hover:bg-white hover:shadow-md transition-all"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading || loading}
                  >
                    {googleLoading ? (
                      <Loader2 className="animate-spin ml-2" />
                    ) : (
                      <GoogleIcon />
                    )}
                    הרשמה עם Google
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        או עם אימייל
                      </span>
                    </div>
                  </div>

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
                    disabled={loading || googleLoading}
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
