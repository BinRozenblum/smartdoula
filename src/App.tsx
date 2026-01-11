import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Layouts & Pages
import MainLayout from "@/components/layout/MainLayout";
import AuthPage from "./pages/Auth";
import InviteRegister from "./pages/InviteRegister";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

// Dashboard Pages
import Index from "./pages/Index"; // זה יהפוך להיות רק התצוגה של הדאשבורד
import ClientsList from "./pages/doula/ClientsList";
import ClientDetail from "./pages/doula/ClientDetail";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* דפים ללא Layout (התחברות/הרשמה) */}
            <Route
              path="/auth"
              element={!session ? <AuthPage /> : <Navigate to="/" />}
            />
            <Route path="/invite" element={<InviteRegister />} />

            {/* דפים מוגנים בתוך המערכת */}
            {session && (
              <Route element={<MainLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/clients" element={<ClientsList />} />
                <Route path="/client/:id" element={<ClientDetail />} />
                {/* אפשר להוסיף כאן עוד נתיבים: /calendar, /settings וכו' */}
              </Route>
            )}

            {/* הפניה לדף התחברות אם אין סשן */}
            {!session && <Route path="*" element={<Navigate to="/auth" />} />}

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
