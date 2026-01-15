import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Plus, MessageSquare, Send, Loader2 } from "lucide-react";
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
        title: title || "עדכון כללי",
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
      onEventAdded(); // רענון הרשימה
    } catch (e) {
      toast.error("שגיאה בהוספת דיווח");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col shadow-sm border-sage/20">
      <CardHeader className="border-b bg-sage/5 py-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-sage" /> ליווי היולדת
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsAdding(!isAdding)}
            className="text-sage font-bold"
          >
            {isAdding ? (
              "ביטול"
            ) : (
              <>
                <Plus className="w-4 h-4 ml-1" /> הוספת דיווח
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {isAdding && (
          <div className="p-4 border-b bg-muted/30 space-y-3 animate-in slide-in-from-top duration-300">
            <Input
              placeholder="כותרת (לדוגמה: שיחת טלפון)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white"
            />
            <Textarea
              placeholder="מה קרה עכשיו? (תיעוד הפגישה, הרגשה, בדיקה...)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-white min-h-[100px]"
            />
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full gradient-sage text-white"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 ml-2" /> שמירה לרצף
                </>
              )}
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6 relative mr-4 border-r-2 border-muted pr-6">
            {events.length === 0 && (
              <p className="text-center text-muted-foreground py-10 italic">
                טרם הוזן תיעוד לליווי זה
              </p>
            )}
            {events.map((event: any) => (
              <div key={event.id} className="relative" dir="rtl">
                <div className="absolute -right-[33px] top-1 w-4 h-4 rounded-full bg-white border-2 border-sage z-10" />
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-foreground">
                      {event.title}
                    </h4>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(event.event_date), "dd/MM/yy HH:mm", {
                        locale: he,
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {event.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
