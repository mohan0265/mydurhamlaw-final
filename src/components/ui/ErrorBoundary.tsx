import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-xl bg-red-50 border border-red-100 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
          <div className="bg-red-100 p-3 rounded-full text-red-600 mb-3">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            {this.props.fallbackTitle || "Something went wrong"}
          </h3>
          <p className="text-sm text-gray-600 mb-4 max-w-md">
            {this.props.fallbackMessage ||
              "We couldn't load this component. It might be a temporary glitch."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
