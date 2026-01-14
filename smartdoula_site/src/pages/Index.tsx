import { useOutletContext } from "react-router-dom";
import { DoulaDashboard } from "./doula/DoulaDashboard";
import { MotherDashboard } from "./mother/MotherDashboard";

export default function Index() {
  // מקבלים את הפרופיל שה-MainLayout כבר טען
  const { profile } = useOutletContext<{ profile: any }>();

  if (!profile) return null;

  return (
    <div className="w-full">
      {profile.role === "doula" ? <DoulaDashboard /> : <MotherDashboard />}
    </div>
  );
}
