import { Link } from "react-router-dom";
import { FileQuestion, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in duration-300">
      <div className="size-20 rounded-full bg-zinc-900 flex items-center justify-center mb-6 border border-zinc-800">
        <FileQuestion className="size-10 text-zinc-500" />
      </div>
      <h1 className="text-4xl font-bold text-white mb-2">404 - Lost in Code</h1>
      <p className="text-zinc-500 max-w-xs mx-auto mb-8">
        The page you are looking for doesn't exist or has been moved to another branch.
      </p>
      <Link to="/">
        <Button variant="default" className="gap-2">
          <ChevronLeft className="size-4" />
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
