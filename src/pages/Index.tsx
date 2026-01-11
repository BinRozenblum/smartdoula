import { useOutletContext } from "react-router-dom";
import { DoulaDashboard } from "@/components/dashboard/DoulaDashboard";
import { MotherDashboard } from "@/components/dashboard/MotherDashboard";

export default function Index() {
  // מקבלים את הפרופיל שה-MainLayout כבר טען
  const { profile } = useOutletContext<{ profile: any }>();

  if (!profile) return null;

  return (
    <div className="w-full">
      {profile.role === "doula" ? (
        <DoulaDashboard profile={profile} />
      ) : (
        <MotherDashboard profile={profile} />
      )}
    </div>
  );
}
