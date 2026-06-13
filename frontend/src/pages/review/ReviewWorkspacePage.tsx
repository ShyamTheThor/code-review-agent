import { useState } from "react";
import { useReview } from "@/hooks/useReview";
import MonacoCodeEditor from "@/components/review/MonacoCodeEditor";
import LanguageSelector from "@/components/review/LanguageSelector";
import FileUpload from "@/components/review/FileUpload";
import ReviewActions from "@/components/review/ReviewActions";
import ReviewSummary from "@/components/review/ReviewSummary";
import IssueList from "@/components/review/IssueList";
import { AlertCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ReviewWorkspacePage() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("typescript");
  const { loading, error, result, submitReview, resetReview } = useReview();

  const handleReview = () => {
    submitReview(code, language);
  };

  const handleReset = () => {
    setCode("");
    resetReview();
  };

  const handleFileSelect = (content: string, fileName: string) => {
    setCode(content);
    // Optionally infer language from file extension
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'py') setLanguage('python');
    else if (ext === 'js') setLanguage('javascript');
    else if (ext === 'ts' || ext === 'tsx') setLanguage('typescript');
    else if (ext === 'go') setLanguage('go');
    else if (ext === 'rs') setLanguage('rust');
    else if (ext === 'java') setLanguage('java');
    else if (ext === 'cpp' || ext === 'cc') setLanguage('cpp');
    else if (ext === 'c') setLanguage('c');
  };

  if (result) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetReview} 
              className="-ml-2 mb-2 text-zinc-500 hover:text-zinc-200"
            >
              <ChevronLeft className="size-4 mr-1" />
              Back to Editor
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Review Results</h1>
            <p className="text-zinc-500">AI-generated analysis for your code.</p>
          </div>
          <Button onClick={resetReview} variant="outline">
            New Review
          </Button>
        </div>

        <ReviewSummary result={result} />
        <IssueList issues={result.issues} />
        
        {result.suggestions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Suggestions</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {result.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-3 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 text-sm text-zinc-300">
                  <span className="flex-shrink-0 size-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                    {index + 1}
                  </span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Review Workspace</h1>
          <p className="text-zinc-500 mt-1">Paste your code or upload a file to begin the AI analysis.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <LanguageSelector 
            value={language} 
            onChange={setLanguage} 
            disabled={loading} 
          />
          <FileUpload 
            onFileSelect={handleFileSelect} 
            disabled={loading} 
          />
        </div>
      </div>

      <div className="space-y-4">
        <MonacoCodeEditor 
          value={code} 
          onChange={setCode} 
          language={language}
          disabled={loading} 
        />
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-zinc-500 font-mono">
            {code.length} characters
          </div>
          {error && (
            <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs animate-in slide-in-from-top-2">
              <AlertCircle className="size-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          <ReviewActions 
            onReview={handleReview} 
            onReset={handleReset} 
            loading={loading}
            disabled={!code.trim()}
          />
        </div>
      </div>
    </div>
  );
}
