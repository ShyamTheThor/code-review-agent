import { Editor, loader } from "@monaco-editor/react";
import { Skeleton } from "@/components/ui/Skeleton";
import { memo } from "react";

// Configure loader to use a specific version from CDN for consistency
loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs' } });

interface MonacoCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  disabled?: boolean;
}

const MonacoCodeEditor = memo(({ value, onChange, language, disabled }: MonacoCodeEditorProps) => {
  const handleEditorChange = (newValue: string | undefined) => {
    onChange(newValue || "");
  };

  // Disable validation/markers that might show false positives for correct code
  const handleEditorDidMount = (editor: any, monaco: any) => {
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });
  };

  return (
    <div className="relative w-full min-h-[500px] rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden group focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/50 transition-all">
      <Editor
        height="500px"
        language={language}
        value={value}
        theme="vs-dark"
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        loading={<Skeleton className="w-full h-full" />}
        options={{
          readOnly: disabled,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'Fira Code', 'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
          fontLigatures: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 20, bottom: 20 },
          wordWrap: "on",
          lineNumbers: "on",
          renderLineHighlight: "all",
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          contextmenu: true,
          quickSuggestions: !disabled,
          // Hide validation decorations if they still appear
          renderValidationDecorations: "on", 
        }}
      />
    </div>
  );
});

MonacoCodeEditor.displayName = "MonacoCodeEditor";

export default MonacoCodeEditor;
