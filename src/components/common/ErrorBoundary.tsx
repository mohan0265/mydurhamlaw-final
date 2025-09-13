import React from "react";

type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown): State {
    const message = err instanceof Error ? err.message : "Widget crashed";
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown) {
    if (typeof window !== "undefined") {
      // keep it light; avoid noisy logs
      console.error("Widget error:", error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="status" aria-live="polite" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Widget failed to load. Please refresh or try again later.
        </div>
      );
    }
    return this.props.children;
  }
}
