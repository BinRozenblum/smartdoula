import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Upload, Trash2, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DocumentsManager({ motherId }: { motherId: string }) {
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    listFiles();
  }, [motherId]);

  const listFiles = async () => {
    // מציג קבצים בתיקייה הקרויה על שם ה-ID של האמא
    const { data, error } = await supabase
      .storage
      .from('medical-docs')
      .list(motherId + '/');
    
    if (data) setFiles(data);
  };

  const handleUpload = async (event: any) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${motherId}/${fileName}`;

      const { error } = await supabase.storage
        .from('medical-docs')
        .upload(filePath, file);

      if (error) throw error;
      
      toast.success("הקובץ הועלה בהצלחה");
      listFiles();
    } catch (error: any) {
      toast.error("שגיאה בהעלאה: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileName: string) => {
     const { data } = supabase.storage
      .from('medical-docs')
      .getPublicUrl(`${motherId}/${fileName}`);
      
     window.open(data.publicUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">מסמכים ובדיקות</h3>
        <div className="relative">
           <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <label htmlFor="file-upload">
            <Button variant="outline" className="cursor-pointer gap-2" asChild>
              <span>
                {uploading ? <Loader2 className="animate-spin w-4 h-4"/> : <Upload className="w-4 h-4" />}
                העלאת מסמך
              </span>
            </Button>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {files.length === 0 && <p className="text-muted-foreground text-sm">אין מסמכים בתיק</p>}
        
        {files.map((file) => (
          <Card key={file.id} className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium truncate max-w-[150px]">{file.name}</span>
              </div>
              <Button size="icon" variant="ghost" onClick={() => handleDownload(file.name)}>
                <Eye className="w-4 h-4 text-muted-foreground" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}