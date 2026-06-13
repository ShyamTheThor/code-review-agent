import { Play, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ReviewActionsProps {
  onReview: () => void;
  onReset: () => void;
  loading: boolean;
  disabled: boolean;
}

export default function ReviewActions({ onReview, onReset, loading, disabled }: ReviewActionsProps) {
  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={onReview}
        disabled={disabled || loading}
        className="gap-2 px-6"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Play className="size-4 fill-current" />
        )}
        {loading ? "Analyzing..." : "Start Review"}
      </Button>
      
      <Button
        variant="outline"
        onClick={onReset}
        disabled={loading}
        className="gap-2"
      >
        <RotateCcw className="size-4" />
        Clear
      </Button>
    </div>
  );
}
