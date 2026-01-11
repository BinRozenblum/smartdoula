import { useOutletContext } from "react-router-dom";
import { WeeklyProgress } from "../../components/dashboard/WeeklyProgress";
import { ContractionTimer } from "../../components/dashboard/ContractionTimer";
import { AlertsWidget } from "../../components/dashboard/AlertsWidget";

export function MotherDashboard() {
  const { profile } = useOutletContext<{ profile: any }>();
  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">
          ההיריון שלי, {profile?.full_name?.split(" ")[0]} ✨
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          כל המידע והכלים ללידה שלך במקום אחד
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* התקדמות שבועית בולטת */}
          <WeeklyProgress currentWeek={32} className="py-10" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-card">
              <h3 className="font-bold mb-2">תוכנית לידה</h3>
              <p className="text-sm text-muted-foreground">
                המכתב שלך לבית החולים מוכן. ניתן לערוך אותו בכל עת.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-card">
              <h3 className="font-bold mb-2">הדולה שלי</h3>
              <p className="text-sm text-muted-foreground">
                מירב רוזנברג זמינה עבורך לכל שאלה.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <ContractionTimer />
          <AlertsWidget />
        </div>
      </div>
    </div>
  );
}
