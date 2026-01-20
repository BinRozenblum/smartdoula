import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  FileText,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Search,
  Archive,
} from "lucide-react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalAgreed: 0,
    pending: 0,
  });

  // Filter
  const [selectedClientId, setSelectedClientId] = useState<string>("all");

  // Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    pregnancy_id: "",
    amount: "",
    payment_date: format(new Date(), "yyyy-MM-dd"),
    payment_method: "transfer",
    status: "paid",
    invoice_url: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. שליפת יולדות + סטטוס פעיל/לא פעיל
      const { data: pregnaciesData } = await supabase
        .from("pregnancies")
        .select("id, agreed_price, is_active, profiles:mother_id(full_name)")
        .eq("doula_id", user.id)
        .order("is_active", { ascending: false }); // פעילות קודם

      setClients(pregnaciesData || []);

      // 2. שליפת תשלומים
      const { data: paymentsData } = await supabase
        .from("payments")
        .select(
          `
          *,
          pregnancies:pregnancy_id (
            is_active,
            profiles:mother_id (full_name)
          )
        `,
        )
        .order("payment_date", { ascending: false });

      setPayments(paymentsData || []);

      // 3. חישוב סטטיסטיקה (כולל כולם, כי כסף זה כסף)
      const totalPaid =
        paymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalAgreed =
        pregnaciesData?.reduce(
          (sum, p) => sum + (Number(p.agreed_price) || 0),
          0,
        ) || 0;

      setStats({
        totalPaid,
        totalAgreed,
        pending: totalAgreed - totalPaid,
      });
    } catch (error) {
      console.error(error);
      toast.error("שגיאה בטעינת נתונים");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.pregnancy_id || !formData.amount) {
      toast.error("יש למלא יולדת וסכום");
      return;
    }

    try {
      const { error } = await supabase.from("payments").insert([formData]);
      if (error) throw error;

      toast.success("תשלום נוסף בהצלחה");
      setIsDialogOpen(false);
      setFormData({ ...formData, amount: "", invoice_url: "", notes: "" });
      fetchData();
    } catch (error) {
      toast.error("שגיאה בשמירה");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק תשלום זה?")) return;
    try {
      await supabase.from("payments").delete().eq("id", id);
      toast.success("נמחק");
      fetchData();
    } catch (error) {
      toast.error("שגיאה במחיקה");
    }
  };

  // --- לוגיקה לסידור היולדות ב-Select ---
  const activeClients = clients.filter((c) => c.is_active);
  const archivedClients = clients.filter((c) => !c.is_active);

  // סינון לתצוגה
  const filteredPayments =
    selectedClientId === "all"
      ? payments
      : payments.filter((p) => p.pregnancy_id === selectedClientId);

  if (loading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="p-4 md:p-8 space-y-6 animate-fade-in" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="w-8 h-8 text-primary" /> ניהול כספים
        </h1>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="gradient-warm text-white gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" /> תשלום חדש
        </Button>
      </div>

      {/* כרטיסי סטטיסטיקה */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-sage/10 border-sage/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between">
              סה"כ הכנסות <CheckCircle2 className="w-4 h-4 text-sage" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sage-foreground">
              ₪{stats.totalPaid.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between">
              יתרה לגבייה (חובות){" "}
              <AlertCircle className="w-4 h-4 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              ₪{stats.pending.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between">
              שווי עסקאות כולל <TrendingUp className="w-4 h-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₪{stats.totalAgreed.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* אזור הסינון והטבלה */}
      <Card className="border-none shadow-card">
        <div className="p-4 border-b flex flex-col md:flex-row md:items-center gap-4 bg-muted/10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="w-4 h-4" /> סינון לפי תיק לקוחה:
          </div>

          {/* זהו ה-Select המשודרג שמפריד בין פעילות לארכיון */}
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-full md:w-[250px] bg-white">
              <SelectValue placeholder="כל היולדות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הצג את כל התשלומים</SelectItem>

              {activeClients.length > 0 && (
                <SelectGroup>
                  <SelectLabel className="text-green-600 font-bold bg-green-50 px-2 py-1 mt-1">
                    יולדות פעילות
                  </SelectLabel>
                  {activeClients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.profiles.full_name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}

              {archivedClients.length > 0 && (
                <SelectGroup>
                  <SelectLabel className="text-muted-foreground font-bold bg-gray-50 px-2 py-1 mt-1">
                    ארכיון / סיימו תהליך
                  </SelectLabel>
                  {archivedClients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.profiles.full_name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right w-[100px]">תאריך</TableHead>
                <TableHead className="text-right">יולדת</TableHead>
                <TableHead className="text-right">סכום</TableHead>
                <TableHead className="text-right hidden md:table-cell">
                  אמצעי
                </TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right hidden md:table-cell">
                  אסמכתא
                </TableHead>
                <TableHead className="text-right w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-muted-foreground"
                  >
                    לא נמצאו תשלומים לתצוגה זו
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow
                    key={payment.id}
                    className={
                      !payment.pregnancies?.is_active ? "bg-gray-50/50" : ""
                    }
                  >
                    <TableCell className="font-medium">
                      {format(new Date(payment.payment_date), "dd/MM/yy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">
                          {payment.pregnancies?.profiles?.full_name || "ללא שם"}
                        </span>
                        {/* אינדיקציה אם היולדת בארכיון */}
                        {!payment.pregnancies?.is_active && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Archive className="w-3 h-3" /> הסתיים
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      ₪{Number(payment.amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {getMethodLabel(payment.payment_method)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payment.status === "paid" ? "default" : "secondary"
                        }
                        className={
                          payment.status === "paid"
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : ""
                        }
                      >
                        {payment.status === "paid" ? "שולם" : "ממתין"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {payment.invoice_url ? (
                        <a
                          href={payment.invoice_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <FileText className="w-3 h-3" /> קישור
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(payment.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* מודאל הוספת תשלום */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          dir="rtl"
          className="max-w-[90%] md:max-w-[500px] rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle>רישום תשלום חדש</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>עבור יולדת</Label>
              <Select
                value={formData.pregnancy_id}
                onValueChange={(v) =>
                  setFormData({ ...formData, pregnancy_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר מהרשימה..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>פעילות</SelectLabel>
                    {activeClients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.profiles.full_name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>ארכיון (חובות עבר)</SelectLabel>
                    {archivedClients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.profiles.full_name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>סכום (₪)</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>תאריך</Label>
                <Input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_date: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>אמצעי תשלום</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(v) =>
                    setFormData({ ...formData, payment_method: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">העברה בנקאית</SelectItem>
                    <SelectItem value="bit">Bit / PayBox</SelectItem>
                    <SelectItem value="cash">מזומן</SelectItem>
                    <SelectItem value="check">צ'ק</SelectItem>
                    <SelectItem value="credit">אשראי</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>סטטוס</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">שולם</SelectItem>
                    <SelectItem value="pending">ממתין</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>קישור לקבלה / חשבונית</Label>
              <Input
                placeholder="URL..."
                value={formData.invoice_url}
                onChange={(e) =>
                  setFormData({ ...formData, invoice_url: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>הערות</Label>
              <Input
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleSave} className="gradient-warm text-white">
              שמירה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getMethodLabel(method: string) {
  switch (method) {
    case "transfer":
      return "העברה";
    case "bit":
      return "Bit/PayBox";
    case "cash":
      return "מזומן";
    case "check":
      return "צ'ק";
    case "credit":
      return "אשראי";
    default:
      return method;
  }
}
