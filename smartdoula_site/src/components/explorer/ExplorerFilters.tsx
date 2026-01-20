import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface FiltersProps {
  onSearch: (term: string) => void;
  onAreaChange: (area: string) => void;
  onSortChange: (sort: string) => void;
}

export function ExplorerFilters({
  onSearch,
  onAreaChange,
  onSortChange,
}: FiltersProps) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-border/50 flex flex-col md:flex-row gap-4 top-4 z-10">
      {/* חיפוש חופשי */}
      <div className="relative flex-1">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="חיפוש לפי שם או התמחות..."
          className="pr-10 bg-muted/10 border-muted focus-visible:ring-primary/20"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      {/* סינון אזור */}
      <div className="w-full md:w-[200px]">
        <Select onValueChange={onAreaChange}>
          <SelectTrigger className="bg-muted/10 border-muted">
            <SelectValue placeholder="אזור בארץ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הארץ</SelectItem>
            <SelectItem value="north">צפון</SelectItem>
            <SelectItem value="center">מרכז</SelectItem>
            <SelectItem value="jerusalem">ירושלים</SelectItem>
            <SelectItem value="south">דרום</SelectItem>
            <SelectItem value="sharon">שרון</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* מיון */}
      <div className="w-full md:w-[200px]">
        <Select onValueChange={onSortChange}>
          <SelectTrigger className="bg-muted/10 border-muted">
            <SelectValue placeholder="מיון לפי" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="random">מומלץ</SelectItem>
            <SelectItem value="experience">ותק (מהגבוה לנמוך)</SelectItem>
            <SelectItem value="name">א-ת</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
