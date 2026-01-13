import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  Loader2,
  Pencil,
  Check,
  X,
  FileImage,
  File,
  ExternalLink,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

export function DocumentsManager({ motherId }: { motherId: string }) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // State להעלאה
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileNameInput, setFileNameInput] = useState("");
  const [uploading, setUploading] = useState(false);

  // State לעריכת שם (Rename)
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editNameInput, setEditNameInput] = useState("");

  // State לתצוגה מקדימה
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "pdf" | "other">(
    "other"
  );
  const [previewTitle, setPreviewTitle] = useState("");

  useEffect(() => {
    if (motherId) listFiles();
  }, [motherId]);

  // --- עזרי Base64 לטיפול בעברית (קידוד בטוח לשרת) ---
  const encodeName = (str: string) => {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    )
      .replace(/\//g, "_")
      .replace(/\+/g, "-"); // הופך את ה-Base64 לבטוח ל-URL
  };

  const decodeName = (str: string) => {
    try {
      const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
      return decodeURIComponent(
        Array.prototype.map
          .call(
            atob(base64),
            (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
          )
          .join("")
      );
    } catch (e) {
      return str; // במקרה של קבצים ישנים שלא קודדו
    }
  };

  const listFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage
      .from("medical-docs")
      .list(motherId + "/");

    if (error) {
      console.error("Error listing files:", error);
    } else {
      setFiles(data || []);
    }
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const nameWithoutExt =
        file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
      setFileNameInput(nameWithoutExt);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !fileNameInput.trim()) return;

    try {
      setUploading(true);
      const fileExt = selectedFile.name.split(".").pop();
      const displayName = fileNameInput.trim() + "." + fileExt;
      const safeName = encodeName(displayName); // קידוד השם ל-Base64 בטוח

      const filePath = `${motherId}/${safeName}`;

      const { error } = await supabase.storage
        .from("medical-docs")
        .upload(filePath, selectedFile);

      if (error) throw error;

      toast.success("המסמך הועלה בהצלחה");
      setIsUploadOpen(false);
      setSelectedFile(null);
      setFileNameInput("");
      listFiles();
    } catch (error: any) {
      toast.error("שגיאה בהעלאה: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = async (file: any) => {
    try {
      const { data, error } = await supabase.storage
        .from("medical-docs")
        .createSignedUrl(`${motherId}/${file.name}`, 3600);

      if (error) throw error;

      const ext = decodeName(file.name).split(".").pop()?.toLowerCase();
      let type: "image" | "pdf" | "other" = "other";
      if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || ""))
        type = "image";
      else if (ext === "pdf") type = "pdf";

      setPreviewUrl(data.signedUrl);
      setPreviewType(type);
      setPreviewTitle(decodeName(file.name));

      if (type === "other") window.open(data.signedUrl, "_blank");
      else setPreviewOpen(true);
    } catch (error: any) {
      toast.error("שגיאה בפתיחה");
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm(`האם למחוק את המסמך?`)) return;

    try {
      const { error } = await supabase.storage
        .from("medical-docs")
        .remove([`${motherId}/${fileName}`]);

      if (error) throw error;

      toast.success("הקובץ נמחק");
      setFiles((prev) => prev.filter((f) => f.name !== fileName));
    } catch (error: any) {
      toast.error("שגיאה במחיקה");
    }
  };

  const saveRename = async (oldName: string) => {
    if (!editNameInput.trim()) return;
    try {
      const oldDisplayName = decodeName(oldName);
      const fileExt = oldDisplayName.split(".").pop();
      const newDisplayName = editNameInput.trim() + "." + fileExt;
      const newSafeName = encodeName(newDisplayName);

      const { error } = await supabase.storage
        .from("medical-docs")
        .move(`${motherId}/${oldName}`, `${motherId}/${newSafeName}`);

      if (error) throw error;

      toast.success("שם הקובץ עודכן");
      setEditingFileId(null);
      listFiles();
    } catch (error: any) {
      toast.error("שגיאה בשינוי שם");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">תיקייה רפואית</h3>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 border-primary/20 hover:bg-primary/5"
            >
              <Upload className="w-4 h-4" /> העלאה
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>העלאת מסמך</DialogTitle>
              <DialogDescription>
                הקבצים נשמרים בצורה מאובטחת ומוצפנת.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input type="file" onChange={handleFileSelect} />
              {selectedFile && (
                <div className="space-y-2">
                  <Label>שם המסמך</Label>
                  <Input
                    value={fileNameInput}
                    onChange={(e) => setFileNameInput(e.target.value)}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className="w-full gradient-warm"
              >
                {uploading ? <Loader2 className="animate-spin" /> : "בצע העלאה"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {files.map((file) => (
          <Card
            key={file.id}
            className="group hover:border-primary/30 transition-all"
          >
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden flex-1">
                {editingFileId === file.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editNameInput}
                      onChange={(e) => setEditNameInput(e.target.value)}
                      className="h-8"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-green-600"
                      onClick={() => saveRename(file.name)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-500"
                      onClick={() => setEditingFileId(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-3 cursor-pointer flex-1"
                    onClick={() => handlePreview(file)}
                  >
                    <div className="bg-muted p-2 rounded-lg">
                      {decodeName(file.name).match(
                        /\.(jpg|jpeg|png|gif|webp)$/i
                      ) ? (
                        <FileImage className="w-4 h-4 text-purple-500" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm truncate max-w-[200px]">
                        {decodeName(file.name)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(file.created_at).toLocaleDateString("he-IL")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {!editingFileId && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingFileId(file.id);
                      setEditNameInput(decodeName(file.name).split(".")[0]);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(file.name)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden"
          dir="rtl"
        >
          <DialogHeader className="p-4 border-b bg-muted/30">
            <div className="flex justify-between items-center w-full">
              <DialogTitle className="truncate">{previewTitle}</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(previewUrl!, "_blank")}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" /> חלון חדש
              </Button>
            </div>
            <DialogDescription className="sr-only">
              תצוגה מקדימה
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 bg-slate-100 flex items-center justify-center p-4">
            {previewType === "image" ? (
              <img
                src={previewUrl!}
                className="max-w-full max-h-full object-contain shadow-lg"
              />
            ) : (
              <iframe src={previewUrl!} className="w-full h-full bg-white" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
