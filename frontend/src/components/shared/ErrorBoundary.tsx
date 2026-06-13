import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
            <AlertTriangle className="size-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-zinc-500 max-w-md mb-8">
            An unexpected error occurred in the application. We've been notified and are working on a fix.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => window.location.reload()} className="gap-2">
              <RefreshCcw className="size-4" />
              Reload Page
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              Go Home
            </Button>
          </div>
          {import.meta.env.DEV && (
            <pre className="mt-8 p-4 bg-zinc-900 rounded-lg text-left text-xs text-red-400 overflow-auto max-w-full border border-red-500/20">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
