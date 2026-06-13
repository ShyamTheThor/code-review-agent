import { useRef } from "react";
import { Upload, FileCode } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FileUploadProps {
  onFileSelect: (content: string, fileName: string) => void;
  disabled?: boolean;
}

export default function FileUpload({ onFileSelect, disabled }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onFileSelect(content, file.name);
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="gap-2"
      >
        <Upload className="size-4" />
        Upload File
      </Button>
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <FileCode className="size-3.5" />
        <span>.ts, .py, .js, .go, .rs</span>
      </div>
    </div>
  );
}
