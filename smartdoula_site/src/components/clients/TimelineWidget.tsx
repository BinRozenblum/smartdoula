import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Plus, MessageSquare, Send, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";

export function TimelineWidget({ pregnancyId, events, onEventAdded }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase.from("pregnancy_events").insert({
        pregnancy_id: pregnancyId,
        title: title || "עדכון",
        content,
        event_type: "note",
        event_date: new Date().toISOString(),
        created_by: user?.id,
      });

      if (error) throw error;

      toast.success("הדיווח התווסף לציר הזמן");
      setContent("");
      setTitle("");
      setIsAdding(false);
      onEventAdded();
    } catch (e) {
      toast.error("שגיאה בהוספת דיווח");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* גובה קבוע לכל הקוביה - h-[600px] או לפי העדפתך */
    <Card className="flex flex-col shadow-sm border-sage/20 h-[400px] overflow-hidden bg-white">
      <CardHeader className="border-b bg-sage/5 py-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-sage" /> ליווי היולדת
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsAdding(!isAdding)}
            className="text-sage font-bold hover:bg-sage/10"
          >
            {isAdding ? (
              <X className="w-4 h-4" />
            ) : (
              <>
                <Plus className="w-4 h-4 ml-1" /> הוספת דיווח
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* אזור הוספת דיווח - נפתח מעל הרשימה */}
        {isAdding && (
          <div className="p-4 border-b bg-muted/30 space-y-3 animate-in slide-in-from-top duration-300 flex-shrink-0">
            <Input
              placeholder="נושא (למשל: פגישת הכנה)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white h-9 text-sm"
            />
            <Textarea
              placeholder="תעדי כאן את ההתרחשות..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-white min-h-[80px] text-sm"
            />
            <Button
              onClick={handleSubmit}
              disabled={loading || !content.trim()}
              className="w-full gradient-sage text-white h-9 shadow-sm"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "שמירה לציר הזמן"
              )}
            </Button>
          </div>
        )}

        {/* אזור הרשימה הנגלל - מקבל את כל הגובה שנותר */}
        <ScrollArea className="flex-1">
          <div className="p-6 relative">
            {/* הקו האנכי של ה-Timeline */}
            <div className="absolute right-[31px] top-6 bottom-6 w-0.5 bg-muted" />

            <div className="space-y-8">
              {events.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground italic text-sm">
                  טרם הוזן תיעוד לליווי זה
                </div>
              ) : (
                events.map((event: any) => (
                  <div key={event.id} className="relative pr-8" dir="rtl">
                    {/* נקודה על הציר */}
                    <div className="absolute -right-[5px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-sage z-10 shadow-sm" />

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="font-bold text-sm text-foreground leading-tight">
                          {event.title}
                        </h4>
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          {format(
                            new Date(event.event_date),
                            "dd/MM/yy HH:mm",
                            { locale: he }
                          )}
                        </span>
                      </div>
                      <div className="bg-muted/20 p-3 rounded-lg border border-border/40">
                        <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                          {event.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
