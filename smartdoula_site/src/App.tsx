import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

// Layouts
import DoulaLayout from "@/components/layout/doula/DoulaLayout";
import MotherLayout from "@/components/layout/mother/MotherLayout";

// General Pages
import AuthPage from "./pages/Auth";
import RootRedirect from "./pages/RootRedirect";
import InviteRegister from "./pages/InviteRegister";
import NotFound from "./pages/NotFound";

// Doula Pages
import { DoulaDashboard } from "./pages/doula/DoulaDashboard";
import ClientsList from "./pages/doula/ClientsList";
import ClientDetail from "./pages/doula/ClientDetail";
import DoulaSettings from "./pages/doula/DoulaSettings";
import NotificationsPage from "./pages/doula/NotificationsPage";
import LiveMonitor from "./pages/doula/LiveMonitor";
import CalendarPage from "./pages/doula/CalendarPage";

// Mother Pages
import { MotherDashboard } from "./pages/mother/MotherDashboard";
import MotherSettings from "./pages/mother/Settings";
import ContractionTimerPage from "./pages/mother/ContractionTimerPage";

import { useMobilePushToken } from "@/hooks/useMobilePushToken"; // <--- הוסף את זה

const queryClient = new QueryClient();

const App = () => {
  useMobilePushToken(); // <--- הפעל את ה-Hook כאן, בתוך הקומפוננטה

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <Routes>
          {/* 1. דפים ציבוריים */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/invite" element={<InviteRegister />} />

          {/* 2. ניתוב ראשי חכם */}
          <Route path="/" element={<RootRedirect />} />

          {/* 3. אזור הדולה - הכל תחת /doula */}
          <Route path="/doula" element={<DoulaLayout />}>
            <Route index element={<DoulaDashboard />} />{" "}
            {/* דף הבית של הדולה */}
            <Route path="clients" element={<ClientsList />} />
            <Route path="client/:id" element={<ClientDetail />} />
            <Route path="settings" element={<DoulaSettings />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="live-monitor/:clientId" element={<LiveMonitor />} />
            <Route path="calendar" element={<CalendarPage />} />{" "}
            {/* הוסף שורה זו */}
          </Route>

          {/* 4. אזור האמא - הכל תחת /mother */}
          <Route path="/mother" element={<MotherLayout />}>
            <Route index element={<MotherDashboard />} />{" "}
            {/* דף הבית של האמא */}
            <Route path="settings" element={<MotherSettings />} />
            <Route path="contractions" element={<ContractionTimerPage />} />
            {/* <Route path="birth-plan" element={<BirthPlan />} /> */}
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
