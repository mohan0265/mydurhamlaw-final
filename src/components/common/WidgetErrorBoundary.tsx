import React from "react";

export class WidgetErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err: unknown) {
    console.error("[WidgetErrorBoundary] Widget crashed:", err);
  }

  render() {
    if (this.state.hasError) return null; // fail closed, never crash the app
    return this.props.children;
  }
}
